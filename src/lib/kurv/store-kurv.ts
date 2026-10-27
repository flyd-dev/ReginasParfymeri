// Handlekurv i WooCommerce via Store API med Cart-Token (kontrakten står i docs/architecture.md §5.1–5.2).
// Bare fra serveren. Tokenet ligger i en httpOnly-cookie på vårt domene og oppdateres fra hvert svar.
// Skriving er stengt mot produksjonsverten til lansering (AGENTS.md): kurver opprettes bare i staging.

import { normaliserMal, rensTekst } from '@/lib/tekst'
import type { Katalog, Produkt } from '@/lib/woocommerce/typer'
import { KurvFeil } from './lokal-kurv'
import type { Kurv, Kurvlinje, Kurvmelding, LeggTil } from './typer'

export const TOKEN_COOKIE = 'regina_kurv'
const STORE = '/wp-json/wc/store/v1'
const PRODUKSJON = ['nettbutikk.reginaparfymeri.no', 'reginaparfymeri.no', 'www.reginaparfymeri.no']

/** Skriving (kurv) mot produksjon er stengt til lansering, da settes TILLAT_KURV_PRODUKSJON=ja. */
export function kanSkriveTil(butikk: string, env: Record<string, string | undefined> = process.env): boolean {
  const url = new URL(butikk)
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') return false
  if (PRODUKSJON.includes(url.hostname)) return env.TILLAT_KURV_PRODUKSJON === 'ja'
  return true
}

interface StoreKurvlinje {
  key: string
  id: number
  quantity: number
  name: string
  sku?: string
  images?: { src: string; thumbnail?: string }[]
  variation?: { attribute: string; value: string }[]
  quantity_limits?: { maximum?: number }
  prices: { price: string; regular_price: string; sale_price: string; currency_minor_unit: number }
}

export interface StoreKurv {
  items: StoreKurvlinje[]
  items_count: number
  totals: { total_items: string; total_items_tax: string; currency_minor_unit: number }
  errors?: { code: string; message: string }[]
}

export interface Tokenlager {
  les(): string | null
  skriv(token: string): void
}

export interface Kurvoppsett {
  butikk: string
  token: Tokenlager
  fetcher?: typeof fetch
  env?: Record<string, string | undefined>
}

const ore = (verdi: string | undefined, enhet: number) => {
  const tall = Number.parseInt(verdi ?? '0', 10)
  return Number.isFinite(tall) ? Math.round((tall * 100) / 10 ** enhet) : 0
}

async function kall(
  o: Kurvoppsett,
  metode: 'GET' | 'POST',
  sti: string,
  kropp?: unknown,
): Promise<{ status: number; data: unknown }> {
  if (metode !== 'GET' && !kanSkriveTil(o.butikk, o.env)) {
    throw new KurvFeil('Handlekurven er ikke koblet til nettbutikken ennå.', 503)
  }
  const headers: Record<string, string> = { accept: 'application/json', 'user-agent': 'regina-next/1.0' }
  const token = o.token.les()
  if (token) headers['cart-token'] = token
  if (kropp !== undefined) headers['content-type'] = 'application/json'
  let svar: Response
  try {
    svar = await (o.fetcher ?? fetch)(new URL(`${STORE}${sti}`, o.butikk), {
      method: metode,
      headers,
      body: kropp === undefined ? undefined : JSON.stringify(kropp),
      cache: 'no-store',
      redirect: 'error',
    })
  } catch {
    throw new KurvFeil('Fikk ikke kontakt med nettbutikken. Prøv igjen om litt.', 502)
  }
  const nytt = svar.headers.get('cart-token')
  if (nytt) o.token.skriv(nytt)
  return { status: svar.status, data: await svar.json().catch(() => null) }
}

function feilFra(data: unknown, status: number): KurvFeil {
  const melding =
    typeof data === 'object' && data !== null && typeof (data as { message?: unknown }).message === 'string'
      ? (data as { message: string }).message.replace(/<[^>]+>/g, '')
      : 'Noe gikk galt med handlekurven.'
  return new KurvFeil(melding, status >= 400 && status < 600 ? status : 500)
}

/** POST med ett nytt forsøk: utløpt token gir 401 – hent nytt med GET /cart og prøv igjen (§5.1). */
async function skriv(o: Kurvoppsett, sti: string, kropp: unknown): Promise<StoreKurv> {
  if (!kanSkriveTil(o.butikk, o.env))
    throw new KurvFeil('Handlekurven er ikke koblet til nettbutikken ennå.', 503)
  // Første gang: hent et token med GET /cart før vi skriver (§5.1).
  if (!o.token.les()) await kall(o, 'GET', '/cart')
  let svar = await kall(o, 'POST', sti, kropp)
  if (svar.status === 401) {
    await kall({ ...o, token: { les: () => null, skriv: o.token.skriv } }, 'GET', '/cart')
    svar = await kall(o, 'POST', sti, kropp)
  }
  if (svar.status >= 400) throw feilFra(svar.data, svar.status)
  return svar.data as StoreKurv
}

export async function lesStoreKurv(o: Kurvoppsett): Promise<StoreKurv> {
  const svar = await kall(o, 'GET', '/cart')
  if (svar.status >= 400) throw feilFra(svar.data, svar.status)
  return svar.data as StoreKurv
}

/** Variant: id er variasjonens ID; valgene sendes som { attribute: egenskapsnavn, value: slug } (§3.5). */
export function leggTilKropp(
  k: Katalog,
  ny: LeggTil,
): { id: number; quantity: number; variation?: { attribute: string; value: string }[] } {
  const produkt = k.produkter.find((p) => p.id === ny.produktId)
  if (!produkt) throw new KurvFeil('Fant ikke varen.', 404)
  if (produkt.type === 'variabel') {
    if (ny.variantId === null) throw new KurvFeil('Velg en variant først.')
    const variant = produkt.varianter.find((v) => v.id === ny.variantId && v.duplikatAv === null)
    if (!variant) throw new KurvFeil('Varianten finnes ikke.', 404)
    return {
      id: variant.id,
      quantity: ny.antall,
      variation: Object.entries(variant.valg).map(([attribute, value]) => ({ attribute, value })),
    }
  }
  return { id: produkt.id, quantity: ny.antall }
}

export const leggTilStore = async (o: Kurvoppsett, k: Katalog, ny: LeggTil) =>
  skriv(o, '/cart/add-item', leggTilKropp(k, ny))
export const endreStore = async (o: Kurvoppsett, nokkel: string, antall: number) =>
  antall < 1
    ? skriv(o, '/cart/remove-item', { key: nokkel })
    : skriv(o, '/cart/update-item', { key: nokkel, quantity: antall })
export const fjernStore = async (o: Kurvoppsett, nokkel: string) =>
  skriv(o, '/cart/remove-item', { key: nokkel })

function finnProdukt(k: Katalog, id: number): { produkt: Produkt; variantId: number | null } | null {
  for (const p of k.produkter) {
    if (p.id === id) return { produkt: p, variantId: null }
    if (p.varianter.some((v) => v.id === id)) return { produkt: p, variantId: id }
  }
  return null
}

/** Store API-kurven som flatens Kurv. Navn, merke og lenke slås opp i katalogen; pris og antall er WooCommerces. */
export function fraStoreKurv(k: Katalog, s: StoreKurv): Kurv {
  const linjer: Kurvlinje[] = s.items.map((i) => {
    const treff = finnProdukt(k, i.id)
    const enhet = i.prices.currency_minor_unit ?? 2
    const pris = ore(i.prices.price, enhet)
    const ordinaer = ore(i.prices.regular_price, enhet)
    return {
      nokkel: i.key,
      produktId: treff?.produkt.id ?? i.id,
      variantId: treff?.variantId ?? null,
      antall: i.quantity,
      navn: treff?.produkt.visningsnavn ?? i.name.replace(/<[^>]+>/g, ''),
      merke: treff?.produkt.merke?.navn ?? null,
      slug: treff?.produkt.slug ?? '',
      bilde: i.images?.[0]?.src ?? treff?.produkt.bilder[0]?.src ?? null,
      valg: (i.variation ?? [])
        .map((v) => `${rensTekst(v.attribute)}: ${normaliserMal(rensTekst(v.value))}`)
        .join(', '),
      pris,
      ordinaer: ordinaer > pris ? ordinaer : null,
      maks: Math.max(1, Math.min(i.quantity_limits?.maximum ?? 20, 20)),
    }
  })
  const enhet = s.totals.currency_minor_unit ?? 2
  const meldinger: Kurvmelding[] = (s.errors ?? []).map((e) => ({
    type: 'tekst',
    tekst: e.message.replace(/<[^>]+>/g, ''),
  }))
  return {
    modus: 'woocommerce',
    linjer,
    antall: s.items_count,
    delsum: ore(s.totals.total_items, enhet) + ore(s.totals.total_items_tax, enhet),
    meldinger,
  }
}

/** Adressen «Gå til kassen» sender kunden til (mu-pluginen overfører kurven, §5.2). Null når kurven er tom. */
export async function kasseadresse(o: Kurvoppsett): Promise<string | null> {
  const kurv = await lesStoreKurv(o)
  const token = o.token.les()
  if (!token || kurv.items_count < 1) return null
  const url = new URL('/', o.butikk)
  url.searchParams.set('regina_kurv', token)
  return url.toString()
}
