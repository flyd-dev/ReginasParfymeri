// Kilde for DATA_SOURCE=woocommerce: leser WooCommerce Store API (staging etter import, eller den live
// butikken bare for lesing) og gjør det om til samme domenemodell som json-kilden.

import { dekodHtml, lagVisningsnavn, rensTekst, roligeVersaler } from '@/lib/tekst'
import { kategorinavn, lagLager, lagMaks, lagPris, sammenstillVarianter, velgHovedkategori } from './mapping'
import { hentAlle, type Leseoppsett } from './store-api'
import type { PwbMerke, StoreKategori, StorePriser, StoreProdukt, WpProduktMeta } from './store-format'
import type { Kategori, KategoriRef, Katalog, Merke, MerkeRef, Ore, Produkt, Variant } from './typer'

export interface StoreRaadata {
  produkter: StoreProdukt[]
  variasjoner: StoreProdukt[]
  kategorier: StoreKategori[]
  /** Produkt-ID-er i WooCommerces popularitetsrekkefølge (total_sales). */
  popularitet: number[]
  produktmeta: WpProduktMeta[]
  pwbMerker: PwbMerke[]
}

/** Beløp i minste enhet som tekst → øre. */
export function belop(verdi: string | undefined, enhet: number): Ore {
  const tall = Number.parseInt(verdi ?? '', 10)
  if (!Number.isFinite(tall)) return 0
  return Math.round((tall * 100) / 10 ** enhet)
}

function prisFra(p: StorePriser, paaTilbud: boolean) {
  const enhet = p.currency_minor_unit ?? 2
  return lagPris(belop(p.price, enhet), belop(p.regular_price, enhet) || null, paaTilbud)
}

/** «/produktkategori/duft/nisjeduft/» → ['duft', 'nisjeduft']. */
export function stiFraLenke(lenke: string): string[] {
  const treff = /\/produktkategori\/(.+?)\/?$/.exec(new URL(lenke, 'https://x').pathname)
  return treff?.[1] ? treff[1].split('/') : []
}

/** Gjør klar ren tekst av beskrivelses-HTML: avsnitt blir tomme linjer, alt annet fjernes. */
export function rensBeskrivelse(html: string): string {
  const medLinjer = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
  return dekodHtml(medLinjer)
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{2,}/g, '\n\n')
    .trim()
}

function merkenavn(navn: string): string {
  return roligeVersaler(rensTekst(navn))
}

function fraVariasjon(v: StoreProdukt, valg: Record<string, string>, duplikatAv: number | null): Variant {
  const paaLager = v.is_in_stock
  const pris = prisFra(v.prices, v.on_sale)
  return {
    id: v.id,
    valg,
    sku: v.sku,
    pris,
    lager: lagLager(paaLager, v.low_stock_remaining, v.stock_availability?.text),
    kjopbar: paaLager && v.is_purchasable && pris.pris > 0,
    maks: lagMaks(v.add_to_cart?.maximum, paaLager),
    bilde: v.images[0]?.src ?? null,
    duplikatAv,
  }
}

export function fraStoreProdukt(
  p: StoreProdukt,
  oppslag: {
    variasjoner: Map<number, StoreProdukt>
    merke: MerkeRef | null
    meta: WpProduktMeta | undefined
    popularitet: number | null
  },
): Produkt {
  const navn = rensTekst(p.name)
  const visningsnavn = lagVisningsnavn(navn, oppslag.merke?.navn ?? null)
  const kategorier: KategoriRef[] = p.categories.map((k) => ({
    slug: k.slug,
    navn: kategorinavn(rensTekst(k.name)),
    sti: stiFraLenke(k.link),
  }))
  const egenskaper = p.attributes.map((a) => ({
    navn: rensTekst(a.name),
    variasjon: a.has_variations,
    verdier: a.terms.map((t) => ({ navn: rensTekst(t.name), slug: dekodHtml(t.slug) })),
  }))
  const felles = {
    id: p.id,
    slug: p.slug,
    navn,
    visningsnavn,
    merke: oppslag.merke,
    sku: p.sku,
    kortBeskrivelse: rensBeskrivelse(p.short_description),
    beskrivelse: rensBeskrivelse(p.description),
    kategorier,
    hovedkategori: velgHovedkategori(kategorier),
    egenskaper,
    bilder: p.images.map((b) => ({
      src: b.src,
      alt: b.alt?.trim() || [oppslag.merke?.navn, visningsnavn].filter(Boolean).join(' – '),
    })),
    kildeUrl: p.permalink,
    opprettet: oppslag.meta?.date ?? null,
    popularitet: oppslag.popularitet,
  }

  if (p.type === 'variable') {
    const sett = new Map<string, number>()
    const varianter: Variant[] = []
    for (const ref of p.variations) {
      const full = oppslag.variasjoner.get(ref.id)
      if (!full) continue
      const valg = Object.fromEntries(ref.attributes.map((a) => [rensTekst(a.name), dekodHtml(a.value)]))
      const nokkel = JSON.stringify(Object.entries(valg).sort())
      const forste = sett.get(nokkel) ?? null
      if (forste === null) sett.set(nokkel, ref.id)
      varianter.push(fraVariasjon(full, valg, forste))
    }
    const samlet = sammenstillVarianter(varianter)
    return {
      ...felles,
      type: 'variabel',
      varianter,
      pris: samlet.pris ?? prisFra(p.prices, false),
      prisspenn: samlet.prisspenn,
      lager: samlet.lager,
      kjopbar: p.is_purchasable && samlet.kjopbar,
      maks: samlet.maks,
    }
  }

  const pris = prisFra(p.prices, p.on_sale)
  return {
    ...felles,
    type: 'enkel',
    varianter: [],
    pris,
    prisspenn: null,
    lager: lagLager(p.is_in_stock, p.low_stock_remaining, p.stock_availability?.text),
    kjopbar: p.is_in_stock && p.is_purchasable && pris.pris > 0,
    maks: lagMaks(p.add_to_cart?.maximum, p.is_in_stock),
  }
}

export function byggKategoritre(kategorier: StoreKategori[]): Kategori[] {
  const perId = new Map(kategorier.map((k) => [k.id, k]))
  const sti = (k: StoreKategori): string[] => {
    const forelder = k.parent ? perId.get(k.parent) : undefined
    return forelder ? [...sti(forelder), k.slug] : [k.slug]
  }
  const node = (k: StoreKategori): Kategori => ({
    slug: k.slug,
    navn: kategorinavn(rensTekst(k.name)),
    sti: sti(k),
    antall: k.count,
    barn: kategorier
      .filter((b) => b.parent === k.id && b.count > 0)
      .map(node)
      .sort((a, b) => b.antall - a.antall),
  })
  return kategorier
    .filter((k) => k.parent === 0 && k.count > 0 && k.slug !== 'ukategorisert' && k.slug !== 'uncategorized')
    .map(node)
    .sort((a, b) => b.antall - a.antall)
}

export function byggKatalog(raa: StoreRaadata, hentet: string): Katalog {
  const variasjoner = new Map(raa.variasjoner.map((v) => [v.id, v]))
  const meta = new Map(raa.produktmeta.map((m) => [m.id, m]))
  const pwb = new Map(raa.pwbMerker.map((m) => [m.id, m]))
  const plass = new Map(raa.popularitet.map((id, i) => [id, i + 1]))

  const produkter = raa.produkter.map((p) => {
    // WooCommerce Brands (etter import) først, ellers Perfect WooCommerce Brands (dagens butikk).
    const wc = p.brands?.[0]
    const gammel = meta
      .get(p.id)
      ?.['pwb-brand']?.map((id) => pwb.get(id))
      .find(Boolean)
    const merke = wc
      ? { navn: rensTekst(wc.name), slug: wc.slug }
      : gammel
        ? { navn: merkenavn(gammel.name), slug: gammel.slug }
        : null
    return fraStoreProdukt(p, {
      variasjoner,
      merke,
      meta: meta.get(p.id),
      popularitet: plass.get(p.id) ?? null,
    })
  })

  const antall = new Map<string, Merke>()
  for (const p of produkter) {
    if (!p.merke) continue
    const m = antall.get(p.merke.slug) ?? { ...p.merke, antall: 0 }
    m.antall++
    antall.set(p.merke.slug, m)
  }

  return {
    produkter,
    kategorier: byggKategoritre(raa.kategorier),
    merker: [...antall.values()].sort((a, b) => a.navn.localeCompare(b.navn, 'nb')),
    kilde: 'woocommerce',
    hentet,
  }
}

export async function hentStoreRaadata(oppsett: Leseoppsett): Promise<StoreRaadata> {
  const store = '/wp-json/wc/store/v1/products'
  const [produkter, variasjoner, kategorier, popularitet, produktmeta, pwbMerker] = await Promise.all([
    hentAlle<StoreProdukt>(store, {}, oppsett),
    hentAlle<StoreProdukt>(store, { type: 'variation' }, oppsett),
    hentAlle<StoreKategori>('/wp-json/wc/store/v1/products/categories', {}, oppsett),
    hentAlle<{ id: number }>(store, { orderby: 'popularity', order: 'desc', _fields: 'id' }, oppsett),
    hentAlle<WpProduktMeta>('/wp-json/wp/v2/product', { _fields: 'id,date,pwb-brand' }, oppsett),
    // Finnes ikke når Perfect WooCommerce Brands er fjernet – da er listen tom.
    hentAlle<PwbMerke>('/wp-json/wp/v2/pwb-brand', { _fields: 'id,name,slug,count' }, oppsett).catch(
      () => [],
    ),
  ])
  return {
    produkter,
    variasjoner,
    kategorier,
    popularitet: popularitet.map((p) => p.id),
    produktmeta,
    pwbMerker,
  }
}
