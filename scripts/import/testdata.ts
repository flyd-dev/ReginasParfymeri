// Testdata og en falsk WooCommerce i minnet for testene. Brukes bare av *.test.ts.

import type { FetchFunksjon } from './klient'
import type {
  KildeFiler,
  ProduktJson,
  VariasjonJson,
  VariasjonRaa,
  WooAttributt,
  WooProdukt,
  WooTerm,
  WooVariasjon,
} from './typer'

// ---------------------------------------------------------------------------------------------
// Kildedata
// ---------------------------------------------------------------------------------------------

export function enkeltProdukt(overstyr: Partial<ProduktJson> = {}): ProduktJson {
  return {
    id: 1,
    name: 'MERKE – Duft 50ml',
    slug: 'merke-duft-50ml',
    brand: 'Merke',
    brand_slug: 'merke',
    type: 'simple',
    sku: 'A1',
    price: 949,
    regular_price: 949,
    sale_price: null,
    on_sale: false,
    in_stock: true,
    low_stock_remaining: null,
    max_quantity: 3,
    stock_text: '3 på lager',
    short_description: '',
    description: 'Første avsnitt.\n\nAndre avsnitt.',
    categories: [
      {
        slug: 'nisjeduft',
        name: 'NISJEDUFT',
        path: ['DUFT', 'NISJEDUFT'],
        path_slugs: ['duft', 'nisjeduft'],
      },
    ],
    attributes: [],
    variations: [],
    images: [{ src: 'https://bilder.example/a.jpg', alt: '' }],
    source_url: 'https://bilder.example/produkt/merke-duft-50ml/',
    date_created: '2025-08-25T17:43:23',
    legacy_brand: { name: 'MERKE', slug: 'merke' },
    ...overstyr,
  }
}

export function variasjonJson(
  id: number,
  storrelse: string,
  overstyr: Partial<VariasjonJson> = {},
): VariasjonJson {
  return {
    id,
    attributes: { Størrelse: storrelse },
    attribute_labels: { Størrelse: storrelse },
    sku: `V${id}`,
    price: 2645,
    regular_price: 2645,
    sale_price: null,
    on_sale: false,
    in_stock: true,
    low_stock_remaining: 1,
    stock_text: '1 på lager',
    max_quantity: 1,
    description: '',
    image: 'https://bilder.example/v.jpg',
    ...overstyr,
  }
}

export function variasjonRaa(
  v: VariasjonJson,
  forelder: number,
  overstyr: Partial<VariasjonRaa> = {},
): VariasjonRaa {
  const ore = String(Math.round((v.regular_price ?? 0) * 100))
  return {
    id: v.id,
    parent: forelder,
    sku: v.sku,
    on_sale: false,
    prices: { price: ore, regular_price: ore, sale_price: ore, currency_code: 'NOK', currency_minor_unit: 2 },
    is_in_stock: v.in_stock,
    is_on_backorder: false,
    low_stock_remaining: v.low_stock_remaining,
    stock_availability: { text: v.stock_text },
    sold_individually: false,
    add_to_cart: { maximum: v.max_quantity },
    ...overstyr,
  }
}

export function variabeltProdukt(
  variasjoner: VariasjonJson[],
  overstyr: Partial<ProduktJson> = {},
): ProduktJson {
  const storrelser = [...new Set(variasjoner.map((v) => v.attributes['Størrelse'] ?? ''))]
  return enkeltProdukt({
    id: 2,
    name: 'MERKE – Parfyme',
    slug: 'merke-parfyme',
    type: 'variable',
    sku: 'P2',
    price: 2645,
    regular_price: 2645,
    max_quantity: 9999,
    stock_text: '',
    attributes: [{ name: 'Størrelse', options: storrelser, option_slugs: storrelser, variation: true }],
    variations: variasjoner,
    images: [
      { src: 'https://bilder.example/p1.jpg', alt: '' },
      { src: 'https://bilder.example/v.jpg', alt: '' },
    ],
    ...overstyr,
  })
}

export function kildeFiler(produkter: ProduktJson[], raa: VariasjonRaa[] = []): KildeFiler {
  return {
    produkter,
    variasjonerRaa: Object.fromEntries(raa.map((r) => [String(r.id), r])),
    kategorier: [
      {
        slug: 'duft',
        name: 'DUFT',
        path: 'duft',
        product_count: 2,
        children: [
          { slug: 'nisjeduft', name: 'NISJEDUFT', path: 'duft/nisjeduft', product_count: 2, children: [] },
        ],
      },
    ],
    merker: [{ name: 'Merke', slug: 'merke', product_count: 2 }],
  }
}

// ---------------------------------------------------------------------------------------------
// Falsk WooCommerce REST API v3
// ---------------------------------------------------------------------------------------------

export interface Kall {
  metode: string
  sti: string
  sporring: URLSearchParams
  kropp: unknown
}

export interface Tilstand {
  kategorier: WooTerm[]
  merker: WooTerm[]
  attributter: WooAttributt[]
  termer: Record<number, WooTerm[]>
  produkter: WooProdukt[]
  variasjoner: Record<number, WooVariasjon[]>
  innstillinger: Record<string, string>
}

type Felt = Record<string, unknown>

const STANDARDINNSTILLINGER: Record<string, string> = {
  'general/woocommerce_currency': 'NOK',
  'tax/woocommerce_prices_include_tax': 'yes',
  'products/woocommerce_manage_stock': 'yes',
  'products/woocommerce_notify_low_stock_amount': '2',
}

export interface FalskWooValg {
  start?: Partial<Tilstand>
  /** Første POST til denne stien behandles, men svaret «forsvinner» (503). */
  mistSvarPaa?: string
  /** Staging uten WooCommerce Brands (eldre enn 9.6). */
  utenBrands?: boolean
}

export function lagFalskWoo(valg: FalskWooValg = {}) {
  const t: Tilstand = {
    kategorier: [],
    merker: [],
    attributter: [],
    termer: {},
    produkter: [],
    variasjoner: {},
    innstillinger: { ...STANDARDINNSTILLINGER },
    ...valg.start,
  }
  const kall: Kall[] = []
  let nesteId = 1000
  let mistet = false

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'content-type': 'application/json', 'x-wp-totalpages': '1' },
    })
  const feil = (code: string, message: string, data: Felt = {}) => ({ id: 0, error: { code, message, data } })

  function bildeFra(b: Felt): WooBilde {
    if (typeof b.id === 'number' && b.id > 0)
      return { id: b.id, src: `https://staging.example.no/bilde/${b.id}.jpg` }
    const id = nesteId++
    return { id, src: `https://staging.example.no/wp-content/uploads/${String(b.src).split('/').pop()}` }
  }

  function oppdaterProdukt(p: WooProdukt, f: Felt): WooProdukt {
    for (const felt of [
      'name',
      'slug',
      'type',
      'status',
      'sku',
      'regular_price',
      'sale_price',
      'description',
      'short_description',
    ] as const) {
      if (typeof f[felt] === 'string') (p as unknown as Felt)[felt] = f[felt]
    }
    if (Array.isArray(f.categories)) {
      p.categories = (f.categories as { id: number }[]).map((c) => ({
        id: c.id,
        slug: t.kategorier.find((k) => k.id === c.id)?.slug ?? '?',
      }))
    }
    if (Array.isArray(f.brands)) {
      p.brands = (f.brands as { id: number }[]).map((b) => ({
        id: b.id,
        slug: t.merker.find((m) => m.id === b.id)?.slug ?? '?',
      }))
    }
    if (Array.isArray(f.attributes)) {
      p.attributes = (f.attributes as { id: number; variation: boolean; options: string[] }[]).map((a) => ({
        id: a.id,
        name: t.attributter.find((x) => x.id === a.id)?.name ?? '?',
        variation: a.variation,
        options: a.options,
      }))
    }
    oppdaterLager(p, f)
    if (Array.isArray(f.images)) p.images = (f.images as Felt[]).map(bildeFra)
    return p
  }

  function oppdaterLager(
    o: { manage_stock: boolean | 'parent'; stock_quantity: number | null; stock_status: string },
    f: Felt,
  ) {
    if (typeof f.manage_stock === 'boolean') o.manage_stock = f.manage_stock
    if (typeof f.stock_quantity === 'number') o.stock_quantity = f.stock_quantity
    if (typeof f.stock_status === 'string') o.stock_status = f.stock_status
    if (o.manage_stock === true) o.stock_status = (o.stock_quantity ?? 0) > 0 ? 'instock' : 'outofstock'
    else o.stock_quantity = null
  }

  function oppdaterVariasjon(v: WooVariasjon, f: Felt): WooVariasjon {
    for (const felt of ['sku', 'regular_price', 'sale_price', 'description'] as const) {
      if (typeof f[felt] === 'string') v[felt] = f[felt]
    }
    if (typeof f.menu_order === 'number') v.menu_order = f.menu_order
    if (Array.isArray(f.attributes)) {
      v.attributes = (f.attributes as { id: number; option: string }[]).map((a) => ({
        id: a.id,
        name: t.attributter.find((x) => x.id === a.id)?.name ?? '?',
        option: a.option,
      }))
    }
    oppdaterLager(v, f)
    if (typeof f.image === 'object' && f.image !== null) v.image = bildeFra(f.image as Felt)
    return v
  }

  function alleSkuer(): { id: number; sku: string; parent_id: number }[] {
    return [
      ...t.produkter.map((p) => ({ id: p.id, sku: p.sku, parent_id: 0 })),
      ...Object.entries(t.variasjoner).flatMap(([forelder, liste]) =>
        liste.map((v) => ({ id: v.id, sku: v.sku, parent_id: Number(forelder) })),
      ),
    ].filter((x) => x.sku)
  }

  function termBatch(liste: WooTerm[], kropp: { create?: Felt[]; update?: Felt[] }) {
    return {
      create: (kropp.create ?? []).map((f) => {
        const finnes = liste.find((x) => x.slug === f.slug)
        if (finnes) return feil('term_exists', 'Finnes', { resource_id: finnes.id })
        const term: WooTerm = {
          id: nesteId++,
          name: String(f.name),
          slug: String(f.slug),
          parent: Number(f.parent ?? 0),
        }
        liste.push(term)
        return term
      }),
      update: (kropp.update ?? []).map((f) => {
        const term = liste.find((x) => x.id === f.id)
        if (!term) return feil('term_invalid', 'Finnes ikke')
        if (typeof f.name === 'string') term.name = f.name
        if (typeof f.parent === 'number') term.parent = f.parent
        return term
      }),
    }
  }

  function hent(sti: string, sp: URLSearchParams): unknown {
    if (valg.utenBrands && sti.startsWith('/products/brands')) return null
    if (Number(sp.get('page') ?? 1) > 1) return []
    let m: RegExpExecArray | null
    if (sti === '/products/categories') return t.kategorier
    if (sti === '/products/brands') return t.merker
    if (sti === '/products/attributes') return t.attributter
    if ((m = /^\/products\/attributes\/(\d+)\/terms$/.exec(sti))) return t.termer[Number(m[1])] ?? []
    if (sti === '/products') {
      const sku = sp.get('sku')
      return sku ? alleSkuer().filter((x) => sku.split(',').includes(x.sku)) : t.produkter
    }
    if ((m = /^\/products\/(\d+)\/variations$/.exec(sti))) return t.variasjoner[Number(m[1])] ?? []
    if ((m = /^\/settings\/(.+)$/.exec(sti))) return { id: m[1], value: t.innstillinger[m[1] ?? ''] ?? null }
    return null
  }

  function batch(sti: string, kropp: { create?: Felt[]; update?: Felt[] }): unknown {
    let m: RegExpExecArray | null
    if (sti === '/products/categories/batch') return termBatch(t.kategorier, kropp)
    if (sti === '/products/brands/batch') return termBatch(t.merker, kropp)
    if ((m = /^\/products\/attributes\/(\d+)\/terms\/batch$/.exec(sti))) {
      const id = Number(m[1])
      t.termer[id] ??= []
      return termBatch(t.termer[id], kropp)
    }
    if (sti === '/products/attributes/batch') {
      return {
        create: (kropp.create ?? []).map((f) => {
          const slug = `pa_${String(f.slug).replace(/^pa_/, '')}`
          if (t.attributter.some((a) => a.slug === slug))
            return feil('woocommerce_rest_cannot_create', 'Slug i bruk')
          const a = { id: nesteId++, name: String(f.name), slug }
          t.attributter.push(a)
          return a
        }),
        update: [],
      }
    }
    if (sti === '/products/batch') {
      return {
        create: (kropp.create ?? []).map((f) => {
          const finnes = alleSkuer().find((x) => x.sku === f.sku)
          if (finnes)
            return feil('product_invalid_sku', 'Ugyldig eller duplisert SKU.', { resource_id: finnes.id })
          const p = oppdaterProdukt(tomtProdukt(nesteId++), f)
          t.produkter.push(p)
          return p
        }),
        update: (kropp.update ?? []).map((f) => {
          const p = t.produkter.find((x) => x.id === f.id)
          return p ? oppdaterProdukt(p, f) : feil('woocommerce_rest_product_invalid_id', 'Ugyldig ID')
        }),
      }
    }
    if ((m = /^\/products\/(\d+)\/variations\/batch$/.exec(sti))) {
      const forelder = Number(m[1])
      const liste = (t.variasjoner[forelder] ??= [])
      return {
        create: (kropp.create ?? []).map((f) => {
          const finnes = alleSkuer().find((x) => x.sku === f.sku)
          if (finnes)
            return feil('product_invalid_sku', 'Ugyldig eller duplisert SKU.', { resource_id: finnes.id })
          const v = oppdaterVariasjon(tomVariasjon(nesteId++, forelder), f)
          liste.push(v)
          return v
        }),
        update: (kropp.update ?? []).map((f) => {
          const v = liste.find((x) => x.id === f.id)
          return v
            ? oppdaterVariasjon(v, f)
            : feil('woocommerce_rest_product_variation_invalid_id', 'Ugyldig ID')
        }),
      }
    }
    return null
  }

  const fetch: FetchFunksjon = async (url, init) => {
    const u = new URL(url)
    const sti = u.pathname.replace(/^.*\/wp-json\/wc\/v3/, '')
    const metode = init.method ?? 'GET'
    const kropp: unknown = typeof init.body === 'string' ? JSON.parse(init.body) : undefined
    kall.push({ metode, sti, sporring: u.searchParams, kropp })
    if (metode === 'GET') {
      const data = hent(sti, u.searchParams)
      return data === null ? json({ code: 'rest_no_route', message: 'Ingen rute' }, 404) : json(data)
    }
    if (metode === 'POST' && sti.endsWith('/batch')) {
      const data = batch(sti, kropp as { create?: Felt[]; update?: Felt[] })
      if (data === null) return json({ code: 'rest_no_route', message: 'Ingen rute' }, 404)
      if (valg.mistSvarPaa === sti && !mistet) {
        mistet = true
        return json({ code: 'gateway', message: 'Svaret ble borte' }, 503)
      }
      return json(data)
    }
    return json({ code: 'rest_no_route', message: 'Ingen rute' }, 404)
  }

  return { fetch, kall, tilstand: t }
}

type WooBilde = { id: number; src: string }

function tomtProdukt(id: number): WooProdukt {
  return {
    id,
    name: '',
    slug: '',
    type: 'simple',
    status: 'publish',
    sku: '',
    regular_price: '',
    sale_price: '',
    description: '',
    short_description: '',
    categories: [],
    brands: [],
    attributes: [],
    manage_stock: false,
    stock_quantity: null,
    stock_status: 'instock',
    images: [],
  }
}

function tomVariasjon(id: number, forelder: number): WooVariasjon {
  return {
    id,
    parent_id: forelder,
    sku: '',
    regular_price: '',
    sale_price: '',
    description: '',
    manage_stock: false,
    stock_quantity: null,
    stock_status: 'instock',
    attributes: [],
    image: null,
    menu_order: 0,
  }
}
