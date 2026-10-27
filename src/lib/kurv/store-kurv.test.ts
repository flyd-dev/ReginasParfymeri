// Kontrakten mot Store API-kurven (docs/architecture.md §5.1–5.2), testet med en falsk WooCommerce.

import { beforeAll, describe, expect, it } from 'vitest'
import { lesJsonKatalog } from '@/lib/woocommerce/json-kilde'
import type { Katalog } from '@/lib/woocommerce/typer'
import {
  fraStoreKurv,
  kanSkriveTil,
  kasseadresse,
  leggTilKropp,
  leggTilStore,
  type Kurvoppsett,
  type StoreKurv,
} from './store-kurv'

const STAGING = 'https://staging.nettbutikk.reginaparfymeri.no'

const tomKurv: StoreKurv = {
  items: [],
  items_count: 0,
  totals: { total_items: '0', total_items_tax: '0', currency_minor_unit: 2 },
}

function falskWoo(
  svar: (url: string, init: RequestInit) => { status: number; body: unknown; token?: string },
) {
  const kall: { url: string; metode: string; hoder: Record<string, string>; kropp?: unknown }[] = []
  const fetcher = (async (url: URL | RequestInfo, init: RequestInit = {}) => {
    const hoder = init.headers as Record<string, string>
    kall.push({
      url: String(url),
      metode: init.method ?? 'GET',
      hoder,
      kropp: init.body ? JSON.parse(String(init.body)) : undefined,
    })
    const s = svar(String(url), init)
    return new Response(JSON.stringify(s.body), {
      status: s.status,
      headers: s.token ? { 'cart-token': s.token } : {},
    })
  }) as typeof fetch
  return { kall, fetcher }
}

function oppsett(
  fetcher: typeof fetch,
  start: string | null = null,
  butikk = STAGING,
): Kurvoppsett & { lagret: () => string | null } {
  let token = start
  return { butikk, fetcher, token: { les: () => token, skriv: (t) => (token = t) }, lagret: () => token }
}

let k: Katalog
beforeAll(async () => {
  k = await lesJsonKatalog()
})

describe('skrivegrensen', () => {
  it('stenger kurv mot produksjon til lansering', () => {
    expect(kanSkriveTil('https://nettbutikk.reginaparfymeri.no', {})).toBe(false)
    expect(kanSkriveTil('https://nettbutikk.reginaparfymeri.no', { TILLAT_KURV_PRODUKSJON: 'ja' })).toBe(true)
    expect(kanSkriveTil(STAGING, {})).toBe(true)
    expect(kanSkriveTil('http://staging.example.no', {})).toBe(false)
  })
  it('gjør ingen kall mot produksjon når noe legges i kurven', async () => {
    const { kall, fetcher } = falskWoo(() => ({ status: 200, body: tomKurv }))
    const enkel = k.produkter.find((p) => p.type === 'enkel' && p.kjopbar)
    if (!enkel) throw new Error('mangler')
    await expect(
      leggTilStore(oppsett(fetcher, null, 'https://nettbutikk.reginaparfymeri.no'), k, {
        produktId: enkel.id,
        variantId: null,
        antall: 1,
      }),
    ).rejects.toThrow(/ikke koblet/)
    expect(kall).toHaveLength(0)
  })
})

describe('Cart-Token', () => {
  it('henter første token med GET /cart, sender det som Cart-Token og aldri Nonce', async () => {
    const { kall, fetcher } = falskWoo((url) => ({
      status: 200,
      body: tomKurv,
      token: url.endsWith('/cart') ? 'tok-1' : 'tok-2',
    }))
    const o = oppsett(fetcher)
    const enkel = k.produkter.find((p) => p.type === 'enkel' && p.kjopbar)
    if (!enkel) throw new Error('mangler')
    await leggTilStore(o, k, { produktId: enkel.id, variantId: null, antall: 1 })
    expect(kall.map((x) => `${x.metode} ${new URL(x.url).pathname}`)).toEqual([
      'GET /wp-json/wc/store/v1/cart',
      'POST /wp-json/wc/store/v1/cart/add-item',
    ])
    expect(kall[1]?.hoder['cart-token']).toBe('tok-1')
    for (const x of kall) expect(Object.keys(x.hoder).some((h) => /nonce/i.test(h))).toBe(false)
    expect(o.lagret()).toBe('tok-2')
  })
  it('henter nytt token og prøver én gang til ved 401', async () => {
    let forsok = 0
    const { kall, fetcher } = falskWoo((url) => {
      if (url.endsWith('/add-item') && forsok++ === 0)
        return { status: 401, body: { code: 'woocommerce_rest_missing_nonce', message: 'x' } }
      return { status: 200, body: tomKurv, token: 'nytt' }
    })
    const enkel = k.produkter.find((p) => p.type === 'enkel' && p.kjopbar)
    if (!enkel) throw new Error('mangler')
    await leggTilStore(oppsett(fetcher, 'gammelt'), k, { produktId: enkel.id, variantId: null, antall: 1 })
    expect(kall.map((x) => x.metode)).toEqual(['POST', 'GET', 'POST'])
    expect(kall[1]?.hoder['cart-token']).toBeUndefined()
    expect(kall[2]?.hoder['cart-token']).toBe('nytt')
  })
})

describe('add-item', () => {
  it('sender variasjons-ID og valgene for varianter', () => {
    const p = k.produkter.find((x) => x.slug === 'initio-side-effect-edp')
    const v = p?.varianter.find((x) => x.duplikatAv === null)
    if (!p || !v) throw new Error('mangler')
    expect(leggTilKropp(k, { produktId: p.id, variantId: v.id, antall: 2 })).toEqual({
      id: v.id,
      quantity: 2,
      variation: Object.entries(v.valg).map(([attribute, value]) => ({ attribute, value })),
    })
  })
  it('velger aldri variant for kunden', () => {
    const p = k.produkter.find((x) => x.type === 'variabel')
    if (!p) throw new Error('mangler')
    expect(() => leggTilKropp(k, { produktId: p.id, variantId: null, antall: 1 })).toThrow(/Velg/)
  })
})

describe('kurven fra Store API', () => {
  it('gjør beløp om til øre og regner delsum med mva.', () => {
    const p = k.produkter.find((x) => x.slug === 'initio-side-effect-edp')
    const v = p?.varianter[0]
    if (!p || !v) throw new Error('mangler')
    const kurv = fraStoreKurv(k, {
      items: [
        {
          key: 'abc',
          id: v.id,
          quantity: 2,
          name: 'INITIO &#8211; Side Effect',
          variation: [{ attribute: 'Størrelse', value: '50ml' }],
          prices: { price: '264500', regular_price: '264500', sale_price: '264500', currency_minor_unit: 2 },
          quantity_limits: { maximum: 3 },
        },
      ],
      items_count: 2,
      totals: { total_items: '423200', total_items_tax: '105800', currency_minor_unit: 2 },
    })
    expect(kurv.linjer[0]).toMatchObject({
      nokkel: 'abc',
      produktId: p.id,
      variantId: v.id,
      pris: 264500,
      slug: p.slug,
      maks: 3,
    })
    expect(kurv.delsum).toBe(529000)
    expect(kurv.antall).toBe(2)
  })
  it('lager kasseadressen med tokenet til mu-pluginen', async () => {
    const { fetcher } = falskWoo(() => ({
      status: 200,
      body: { ...tomKurv, items_count: 1 },
      token: 'a.b+c',
    }))
    const url = await kasseadresse(oppsett(fetcher, 'a.b+c'))
    expect(url).toBe(`${STAGING}/?regina_kurv=a.b%2Bc`)
  })
  it('gir ingen kasseadresse for en tom kurv', async () => {
    const { fetcher } = falskWoo(() => ({ status: 200, body: tomKurv, token: 't' }))
    expect(await kasseadresse(oppsett(fetcher, 't'))).toBeNull()
  })
})
