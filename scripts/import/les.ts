// Leser det som finnes i staging – bare GET. Brukes av tørrkjøringen (med nøkler), før --apply og
// i etterkontrollen.

import { INNSTILLINGER } from './plan'
import { WooFeil } from './klient'
import type { WooKlient } from './klient'
import type { Eksisterende, Kilde, WooAttributt, WooProdukt, WooTerm, WooVariasjon } from './typer'

const PRODUKTFELT = [
  'id',
  'name',
  'slug',
  'type',
  'status',
  'sku',
  'regular_price',
  'sale_price',
  'description',
  'short_description',
  'categories',
  'brands',
  'attributes',
  'manage_stock',
  'stock_quantity',
  'stock_status',
  'images',
].join(',')

const VARIANTFELT = [
  'id',
  'parent_id',
  'sku',
  'regular_price',
  'sale_price',
  'description',
  'manage_stock',
  'stock_quantity',
  'stock_status',
  'attributes',
  'image',
  'menu_order',
].join(',')

export async function lesEksisterende(
  klient: WooKlient,
  logg: (linje: string) => void,
): Promise<Eksisterende> {
  logg(`Leser eksisterende data fra ${klient.base} (bare GET) …`)
  const kategorier = await klient.hentAlle<WooTerm>('/products/categories', { per_page: 100 })

  let merker: WooTerm[] = []
  let merkerStottes = true
  try {
    merker = await klient.hentAlle<WooTerm>('/products/brands', { per_page: 100 })
  } catch (e) {
    if (e instanceof WooFeil && e.status === 404) merkerStottes = false
    else throw e
  }

  const { data: attributter } = await klient.hent<WooAttributt[]>('/products/attributes')
  const termer: Record<number, WooTerm[]> = {}
  for (const a of attributter) {
    termer[a.id] = await klient.hentAlle<WooTerm>(`/products/attributes/${a.id}/terms`, { per_page: 100 })
  }

  const produkter = await klient.hentAlle<WooProdukt>('/products', {
    per_page: 100,
    status: 'any',
    _fields: PRODUKTFELT,
  })
  const variasjoner: Record<number, WooVariasjon[]> = {}
  for (const p of produkter.filter((x) => x.type === 'variable')) {
    variasjoner[p.id] = await klient.hentAlle<WooVariasjon>(`/products/${p.id}/variations`, {
      per_page: 100,
      _fields: VARIANTFELT,
    })
  }

  const innstillinger: Record<string, string | null> = {}
  for (const [id] of INNSTILLINGER) {
    try {
      const { data } = await klient.hent<{ value?: unknown }>(`/settings/${id}`)
      innstillinger[id] =
        typeof data.value === 'string' || typeof data.value === 'number' ? String(data.value) : null
    } catch {
      innstillinger[id] = null
    }
  }

  logg(
    `  ${kategorier.length} kategorier, ${merkerStottes ? merker.length : 'ingen'} merker, ${attributter.length} attributter, ` +
      `${produkter.length} produkter, ${Object.values(variasjoner).flat().length} variasjoner`,
  )
  return {
    kilde: 'staging',
    kategorier,
    merker,
    merkerStottes,
    attributter,
    termer,
    produkter,
    variasjoner,
    innstillinger,
  }
}

export interface Etterkontroll {
  produkter: { forventet: number; funnet: number; mangler: string[] }
  variasjoner: { forventet: number; funnet: number; mangler: string[] }
  kategorier: { forventet: number; funnet: number; mangler: string[] }
  merker: { forventet: number; funnet: number; mangler: string[] }
  stemmer: boolean
}

/** Teller opp i staging etter importen: finnes alt fra kilden (minus doble variasjoner)? */
export async function kontrollerEtterImport(kilde: Kilde, klient: WooKlient): Promise<Etterkontroll> {
  const produkter = await klient.hentAlle<Pick<WooProdukt, 'id' | 'sku' | 'slug' | 'type'>>('/products', {
    per_page: 100,
    status: 'any',
    _fields: 'id,sku,slug,type',
  })
  const etterSku = new Map(produkter.filter((p) => p.sku).map((p) => [p.sku, p]))
  const etterSlug = new Map(produkter.map((p) => [p.slug, p]))

  const produktMangler: string[] = []
  const variantMangler: string[] = []
  let produktFunnet = 0
  let variantForventet = 0
  let variantFunnet = 0
  for (const p of kilde.produkter) {
    const treff = p.sku ? etterSku.get(p.sku) : etterSlug.get(p.slug)
    if (treff) produktFunnet += 1
    else produktMangler.push(p.sku ?? p.slug)
    const forventede = p.variasjoner.filter((v) => v.dobbeltAv === null)
    variantForventet += forventede.length
    if (!treff || forventede.length === 0) {
      variantMangler.push(...forventede.map((v) => v.sku ?? `${p.slug}#${v.kildeId}`))
      continue
    }
    const iStaging = await klient.hentAlle<Pick<WooVariasjon, 'id' | 'sku'>>(
      `/products/${treff.id}/variations`,
      {
        per_page: 100,
        _fields: 'id,sku',
      },
    )
    const skuer = new Set(iStaging.map((v) => v.sku))
    for (const v of forventede) {
      // Varianter uten SKU kan ikke telles sikkert her; de regnes som funnet når antallet rekker.
      if (v.sku ? skuer.has(v.sku) : iStaging.length >= forventede.length) variantFunnet += 1
      else variantMangler.push(v.sku ?? `${p.slug}#${v.kildeId}`)
    }
  }

  const kategorier = await klient.hentAlle<WooTerm>('/products/categories', { per_page: 100 })
  const kategoriSlugs = new Set(kategorier.map((k) => k.slug))
  const kategoriMangler = kilde.kategorier.filter((k) => !kategoriSlugs.has(k.slug)).map((k) => k.slug)

  let merkeSlugs = new Set<string>()
  try {
    merkeSlugs = new Set(
      (await klient.hentAlle<WooTerm>('/products/brands', { per_page: 100 })).map((m) => m.slug),
    )
  } catch (e) {
    if (!(e instanceof WooFeil && e.status === 404)) throw e
  }
  const merkeMangler = kilde.merker.filter((m) => !merkeSlugs.has(m.slug)).map((m) => m.slug)

  const resultat: Etterkontroll = {
    produkter: { forventet: kilde.antall.produkter, funnet: produktFunnet, mangler: produktMangler },
    variasjoner: { forventet: variantForventet, funnet: variantFunnet, mangler: variantMangler },
    kategorier: {
      forventet: kilde.kategorier.length,
      funnet: kilde.kategorier.length - kategoriMangler.length,
      mangler: kategoriMangler,
    },
    merker: {
      forventet: kilde.merker.length,
      funnet: kilde.merker.length - merkeMangler.length,
      mangler: merkeMangler,
    },
    stemmer: false,
  }
  resultat.stemmer =
    resultat.produkter.funnet === resultat.produkter.forventet &&
    resultat.variasjoner.funnet === resultat.variasjoner.forventet &&
    kategoriMangler.length === 0 &&
    merkeMangler.length === 0
  return resultat
}
