import { describe, expect, it } from 'vitest'
import { lagKlient } from './klient'
import type { FetchFunksjon } from './klient'

function svarListe(svar: Response[]): { fetch: FetchFunksjon; init: RequestInit[] } {
  const init: RequestInit[] = []
  return {
    fetch: async (_url, i) => {
      init.push(i)
      const neste = svar.shift()
      if (!neste) throw new Error('Ingen flere svar')
      return neste
    },
    init,
  }
}

const json = (data: unknown, status = 200, hoder: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', ...hoder } })

function klient(fetch: FetchFunksjon, ventetider: number[]) {
  return lagKlient({
    url: 'https://staging.example.no',
    nokkel: 'ck_nokkel',
    hemmelighet: 'cs_hemmelig',
    fetch,
    bareLesing: false,
    vent: async (ms) => {
      ventetider.push(ms)
    },
  })
}

describe('klienten', () => {
  it('prøver igjen ved 429 og 5xx med eksponentiell ventetid', async () => {
    const ventetider: number[] = []
    const { fetch } = svarListe([json({}, 503), json({}, 502), json({}, 429), json({ create: [] })])
    await expect(klient(fetch, ventetider).batch('/products/batch', { create: [] })).resolves.toEqual({
      create: [],
    })
    expect(ventetider).toEqual([1000, 2000, 4000])
  })

  it('følger Retry-After', async () => {
    const ventetider: number[] = []
    const { fetch } = svarListe([json({}, 429, { 'retry-after': '7' }), json([])])
    await klient(fetch, ventetider).hent('/products')
    expect(ventetider).toEqual([7000])
  })

  it('gir opp etter fem forsøk og prøver ikke igjen ved 4xx', async () => {
    const ventetider: number[] = []
    const fem = svarListe(Array.from({ length: 5 }, () => json({ code: 'feil', message: 'nede' }, 500)))
    await expect(klient(fem.fetch, ventetider).hent('/products')).rejects.toThrow(/500 feil: nede/)
    expect(fem.init).toHaveLength(5)

    const ugyldig = svarListe([json({ code: 'rest_invalid_param', message: 'Ugyldig' }, 400)])
    await expect(klient(ugyldig.fetch, []).hent('/products')).rejects.toThrow(/400/)
    expect(ugyldig.init).toHaveLength(1)
  })

  it('følger aldri omdirigeringer', async () => {
    const { fetch, init } = svarListe([
      new Response(null, {
        status: 301,
        headers: { location: 'https://nettbutikk.reginaparfymeri.no/wp-json/wc/v3/products' },
      }),
    ])
    await expect(klient(fetch, []).hent('/products')).rejects.toThrow(/følges ikke/)
    expect(init[0]?.redirect).toBe('manual')
  })

  it('sender nøklene bare i Authorization-hodet og aldri i feilmeldinger', async () => {
    const { fetch, init } = svarListe([json({ code: 'woocommerce_rest_cannot_view', message: 'Nei' }, 401)])
    const feil = await klient(fetch, [])
      .hent('/products')
      .catch((e: unknown) => e)
    expect(String(feil)).not.toContain('cs_hemmelig')
    const hoder = init[0]?.headers as Record<string, string>
    expect(hoder.Authorization).toBe(`Basic ${Buffer.from('ck_nokkel:cs_hemmelig').toString('base64')}`)
  })

  it('avviser stier som peker ut av API-et og batcher over 100', async () => {
    const k = klient(svarListe([]).fetch, [])
    await expect(k.hent('https://nettbutikk.reginaparfymeri.no/x')).rejects.toThrow(/Ugyldig API-sti/)
    await expect(k.hent('/../../wp/v2/users')).rejects.toThrow(/Ugyldig API-sti/)
    await expect(
      k.batch('/products/batch', { create: Array.from({ length: 101 }, () => ({})) }),
    ).rejects.toThrow(/maks/)
  })

  it('henter alle sider', async () => {
    const { fetch } = svarListe([
      json([{ id: 1 }, { id: 2 }], 200, { 'x-wp-totalpages': '2' }),
      json([{ id: 3 }], 200, { 'x-wp-totalpages': '2' }),
    ])
    await expect(klient(fetch, []).hentAlle('/products', { per_page: 2 })).resolves.toEqual([
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ])
  })
})
