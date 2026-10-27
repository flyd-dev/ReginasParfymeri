// Holder grensen: katalogen kan bare lese (GET) fra tillatte stier i WooCommerce.

import { describe, expect, it } from 'vitest'
import { erTillattLesing, hentAlle, hentJson, TILLATTE_LESESTIER } from './store-api'

const butikk = 'https://nettbutikk.reginaparfymeri.no'

describe('lesegrensen mot WooCommerce', () => {
  it('tillater bare katalog- og innholdsstier', () => {
    const b = new URL(butikk)
    expect(erTillattLesing(new URL('/wp-json/wc/store/v1/products?per_page=100', b), b)).toBe(true)
    expect(erTillattLesing(new URL('/wp-json/wc/store/v1/products/categories/', b), b)).toBe(true)
    for (const sti of [
      '/wp-json/wc/store/v1/cart',
      '/wp-json/wc/store/v1/cart/add-item',
      '/wp-json/wc/store/v1/checkout',
      '/wp-json/wc/v3/orders',
      '/wp-admin/',
    ]) {
      expect(erTillattLesing(new URL(sti, b), b), sti).toBe(false)
    }
    expect(erTillattLesing(new URL('https://annen.no/wp-json/wc/store/v1/products'), b)).toBe(false)
  })

  it('har ingen stier for kurv, kasse eller ordre', () => {
    for (const sti of TILLATTE_LESESTIER) expect(sti).not.toMatch(/cart|checkout|order|batch/)
  })

  it('sender bare GET og stopper ikke-tillatte stier før kallet', async () => {
    const kall: { url: string; metode: string }[] = []
    const fetcher = (async (url: URL | RequestInfo, init?: RequestInit) => {
      kall.push({ url: String(url), metode: init?.method ?? 'GET' })
      return new Response('[]', { status: 200, headers: { 'x-wp-totalpages': '1' } })
    }) as typeof fetch
    await hentAlle('/wp-json/wc/store/v1/products', {}, { butikk, fetcher })
    await expect(hentJson(new URL('/wp-json/wc/store/v1/cart', butikk), { butikk, fetcher })).rejects.toThrow(
      /ikke tillatt/,
    )
    expect(kall).toHaveLength(1)
    expect(kall.every((k) => k.metode === 'GET')).toBe(true)
  })
})
