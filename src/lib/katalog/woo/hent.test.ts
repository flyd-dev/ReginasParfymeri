import { describe, expect, it } from 'vitest'
import { erTillattLesing, hentRaadata, KatalogFeil } from './hent'

const BUTIKK = 'https://nettbutikk.reginaparfymeri.no'

describe('lesegrensen mot WooCommerce', () => {
  it('slipper bare kjente lesestier i samme butikk', () => {
    const b = new URL(BUTIKK)
    expect(erTillattLesing(new URL('/wp-json/wc/store/v1/products?page=2', b), b)).toBe(true)
    expect(erTillattLesing(new URL('/wp-json/wc/store/v1/cart/add-item', b), b)).toBe(false)
    expect(erTillattLesing(new URL('/wp-json/wc/store/v1/checkout', b), b)).toBe(false)
    expect(erTillattLesing(new URL('/wp-json/wc/v3/orders', b), b)).toBe(false)
    expect(erTillattLesing(new URL('https://angriper.example/wp-json/wc/store/v1/products'), b)).toBe(false)
  })

  it('henter alt med GET, følger sidetallet og rører ingen andre stier', async () => {
    const kall: { url: string; metode: string }[] = []
    const fetcher = (async (input: URL | RequestInfo, init?: RequestInit) => {
      const url = new URL(String(input))
      kall.push({ url: url.pathname + url.search, metode: init?.method ?? 'GET' })
      const side = Number(url.searchParams.get('page'))
      const sider = url.pathname.endsWith('/products') && !url.searchParams.has('type') ? 2 : 1
      return new Response(JSON.stringify(side <= sider ? [{ id: side }] : []), {
        headers: { 'x-wp-totalpages': String(sider) },
      })
    }) as typeof fetch

    const raa = await hentRaadata({ butikk: BUTIKK, fetcher })
    expect(raa.produkter).toHaveLength(2)
    expect(kall.every((k) => k.metode === 'GET')).toBe(true)
    expect(new Set(kall.map((k) => k.url.split('?')[0]))).toEqual(
      new Set([
        '/wp-json/wc/store/v1/products',
        '/wp-json/wc/store/v1/products/categories',
        '/wp-json/wp/v2/pwb-brand',
        '/wp-json/wp/v2/product',
      ]),
    )
  })

  it('melder feil i stedet for å late som katalogen er tom', async () => {
    const fetcher = (async () => new Response('nei', { status: 503 })) as typeof fetch
    await expect(hentRaadata({ butikk: BUTIKK, fetcher })).rejects.toBeInstanceOf(KatalogFeil)
    const nede = (async () => {
      throw new TypeError('fetch failed')
    }) as typeof fetch
    await expect(hentRaadata({ butikk: BUTIKK, fetcher: nede })).rejects.toThrow(/Fikk ikke kontakt/)
  })
})
