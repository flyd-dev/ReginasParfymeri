import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { byggKilde, tolkLager } from './kilde'
import { kjorImport } from './kjor'
import { lagKlient } from './klient'
import type { FetchFunksjon } from './klient'
import { lesEksisterende } from './les'
import { kronerTilOre, minsteEnhetTilOre, oreTilPris, prisTilOre } from './penger'
import { lagPlan, produktPayload, sorterForelderForBarn, tomButikk, variasjonPayload } from './plan'
import type { IdOppslag } from './plan'
import { ProduksjonAvvist, kontrollerStagingUrl } from './sikkerhet'
import {
  enkeltProdukt,
  kildeFiler,
  lagFalskWoo,
  variabeltProdukt,
  variasjonJson,
  variasjonRaa,
} from './testdata'
import type { Eksisterende, KildeFiler, Post, Produkt, WooProdukt } from './typer'
import { utforPlan } from './utfor'

const STAGING = 'https://staging.example.no'
const NOKLER = {
  WC_STAGING_URL: STAGING,
  WC_STAGING_KEY: 'ck_test_nokkel',
  WC_STAGING_SECRET: 'cs_hemmelig_verdi',
}
const ingenVent = async () => {}
const stille = () => {}
const ider: IdOppslag = { kategori: () => 11, merke: () => 20, attributt: () => 30, bilde: () => undefined }

function stagingKlient(fetch: FetchFunksjon, bareLesing = false) {
  return lagKlient({ url: STAGING, nokkel: 'ck', hemmelighet: 'cs', fetch, bareLesing, vent: ingenVent })
}

/** En fetch som feiler testen hvis den blir kalt. */
function forbudtFetch(): { fetch: FetchFunksjon; antall: () => number } {
  let antall = 0
  return {
    fetch: async () => {
      antall += 1
      throw new Error('fetch skulle ikke vært kalt')
    },
    antall: () => antall,
  }
}

/** Kjører hele importen med kildefiler i minnet og fanger rapportene. */
async function kjor(
  argv: string[],
  env: Record<string, string | undefined>,
  fetch: FetchFunksjon,
  filer?: KildeFiler,
) {
  const kilde = filer ?? kildeFiler([enkeltProdukt()])
  const innhold: Record<string, string> = {
    'data/products.json': JSON.stringify(kilde.produkter),
    'raw/variations_raw.json': JSON.stringify(kilde.variasjonerRaa),
    'data/categories.json': JSON.stringify(kilde.kategorier),
    'data/brands.json': JSON.stringify(kilde.merker),
  }
  const skrevet = new Map<string, string>()
  const resultat = await kjorImport({
    argv,
    env,
    fetch,
    rot: '/repo',
    lesFil: async (sti) => {
      const tekst = innhold[path.relative('/repo', sti)]
      if (tekst === undefined) throw new Error(`Ukjent fil: ${sti}`)
      return tekst
    },
    skrivFil: async (sti, tekst) => {
      skrevet.set(path.relative('/repo', sti), tekst)
    },
    logg: stille,
    vent: ingenVent,
    naa: () => new Date('2026-10-27T12:00:00Z'),
  })
  return { resultat, skrevet }
}

/** Slik produktet fra `enkeltProdukt()` ser ut i staging når det er importert. */
function stagingProdukt(overstyr: Partial<WooProdukt> = {}): WooProdukt {
  return {
    id: 55,
    name: 'MERKE – Duft 50ml',
    slug: 'merke-duft-50ml',
    type: 'simple',
    status: 'publish',
    sku: 'A1',
    regular_price: '949.00',
    sale_price: '',
    description: '<p>Første avsnitt.</p>\n<p>Andre avsnitt.</p>',
    short_description: '',
    categories: [{ id: 11, slug: 'nisjeduft' }],
    brands: [{ id: 20, slug: 'merke' }],
    attributes: [],
    manage_stock: true,
    stock_quantity: 3,
    stock_status: 'instock',
    images: [{ id: 99, src: 'https://staging.example.no/wp-content/uploads/a.jpg' }],
    ...overstyr,
  }
}

function stagingMed(del: Partial<Eksisterende>): Eksisterende {
  return {
    ...tomButikk(),
    kilde: 'staging',
    kategorier: [
      { id: 10, name: 'DUFT', slug: 'duft', parent: 0 },
      { id: 11, name: 'NISJEDUFT', slug: 'nisjeduft', parent: 10 },
    ],
    merker: [{ id: 20, name: 'Merke', slug: 'merke' }],
    attributter: [{ id: 30, name: 'Størrelse', slug: 'pa_storrelse' }],
    termer: {
      30: [
        { id: 31, name: '50ml', slug: '50ml' },
        { id: 32, name: '100ml', slug: '100ml' },
      ],
    },
    innstillinger: {
      'general/woocommerce_currency': 'NOK',
      'tax/woocommerce_prices_include_tax': 'yes',
      'products/woocommerce_manage_stock': 'yes',
      'products/woocommerce_notify_low_stock_amount': '2',
    },
    ...del,
  }
}

/** Et variabelt produkt med to størrelser, priser og lager fra rådata. */
function variabelKilde(ekstra: { dobbel?: 'merket' | 'umerket' } = {}): KildeFiler {
  const variasjoner = [
    variasjonJson(11, '50ml'),
    variasjonJson(12, '100ml', { regular_price: 3200, price: 3200 }),
  ]
  if (ekstra.dobbel) {
    variasjoner.push(
      variasjonJson(13, '100ml', {
        sku: ekstra.dobbel === 'merket' ? 'V12' : 'V13',
        regular_price: 3000,
        price: 3000,
        in_stock: false,
        low_stock_remaining: null,
        max_quantity: 9999,
        stock_text: 'Utsolgt',
        ...(ekstra.dobbel === 'merket' ? { duplicate_of: 12 } : {}),
      }),
    )
  }
  const raa = variasjoner.map((v) => variasjonRaa(v, 2))
  return kildeFiler([enkeltProdukt(), variabeltProdukt(variasjoner)], raa)
}

function finnPost<T extends { kildeId: number }>(poster: Post<T>[], kildeId: number): Post<T> {
  const post = poster.find((p) => p.onske.kildeId === kildeId)
  if (!post) throw new Error(`Fant ikke post for ${kildeId}`)
  return post
}

// ---------------------------------------------------------------------------------------------

describe('priser i heltall øre', () => {
  it('regner om uten flyttallsfeil og gir to desimaler', () => {
    expect(kronerTilOre(949)).toBe(94900)
    expect(oreTilPris(94900)).toBe('949.00')
    expect(oreTilPris(kronerTilOre(0.1) + kronerTilOre(0.2))).toBe('0.30')
    expect(oreTilPris(kronerTilOre(19.9))).toBe('19.90')
    expect(oreTilPris(5)).toBe('0.05')
    expect(() => kronerTilOre(1.005)).toThrow(/to desimaler/)
    expect(minsteEnhetTilOre('264500', 2)).toBe(264500)
    expect(minsteEnhetTilOre('2645', 0)).toBe(264500)
    expect(prisTilOre('949')).toBe(94900)
    expect(prisTilOre('949.5')).toBe(94950)
    expect(prisTilOre('')).toBeNull()
  })

  it('sender ordinær pris og tilbudspris som tekst med to desimaler', () => {
    const kilde = byggKilde(
      kildeFiler([enkeltProdukt({ regular_price: 949, price: 849.5, sale_price: 849.5, on_sale: true })]),
    )
    const post = finnPost(lagPlan(kilde, tomButikk()).produkter, 1)
    const payload = produktPayload(post, ider)
    expect(payload.regular_price).toBe('949.00')
    expect(payload.sale_price).toBe('849.50')
  })

  it('henter variantpris fra rådata (minste enhet) og ikke fra products.json', () => {
    const v = variasjonJson(11, '50ml', { regular_price: 1 })
    const raa = variasjonRaa(v, 2, {
      on_sale: true,
      prices: {
        price: '199900',
        regular_price: '264500',
        sale_price: '199900',
        currency_code: 'NOK',
        currency_minor_unit: 2,
      },
    })
    const plan = lagPlan(byggKilde(kildeFiler([variabeltProdukt([v])], [raa])), tomButikk())
    const payload = variasjonPayload(finnPost(plan.variasjoner, 11), ider)
    expect(payload.regular_price).toBe('2645.00')
    expect(payload.sale_price).toBe('1999.00')
    expect(plan.advarsler.map((a) => a.kode)).toContain('prisavvik_kilder')
  })
})

describe('SKU-matching og idempotens', () => {
  it('oppdaterer et produkt med samme SKU i stedet for å opprette et nytt', () => {
    const kilde = byggKilde(kildeFiler([enkeltProdukt()]))
    const plan = lagPlan(kilde, stagingMed({ produkter: [stagingProdukt({ regular_price: '899.00' })] }))
    const post = finnPost(plan.produkter, 1)
    expect(post.handling).toBe('oppdater')
    expect(post.id).toBe(55)
    expect(post.endringer).toEqual(['pris'])
    expect(plan.produkter.filter((p) => p.handling === 'opprett')).toHaveLength(0)
    expect(produktPayload(post, ider)).toEqual({ id: 55, regular_price: '949.00', sale_price: '' })
  })

  it('gir «uendret» når staging allerede er lik kilden', () => {
    const plan = lagPlan(
      byggKilde(kildeFiler([enkeltProdukt()])),
      stagingMed({ produkter: [stagingProdukt()] }),
    )
    expect(finnPost(plan.produkter, 1)).toMatchObject({ handling: 'uendret', id: 55, endringer: [] })
  })

  it('matcher produkter uten SKU på slug og melder det', () => {
    const kilde = byggKilde(kildeFiler([enkeltProdukt({ sku: '' })]))
    const plan = lagPlan(
      kilde,
      stagingMed({ produkter: [stagingProdukt({ sku: '', name: 'Gammelt navn' })] }),
    )
    expect(finnPost(plan.produkter, 1)).toMatchObject({ handling: 'oppdater', id: 55, endringer: ['navn'] })
    expect(plan.advarsler.filter((a) => a.kode === 'uten_sku')).toHaveLength(1)
  })

  it('matcher varianter på SKU under eksisterende forelder', () => {
    const kilde = byggKilde(variabelKilde())
    const forelder = stagingProdukt({
      id: 70,
      sku: 'P2',
      slug: 'merke-parfyme',
      type: 'variable',
      manage_stock: false,
    })
    const plan = lagPlan(
      kilde,
      stagingMed({
        produkter: [forelder],
        variasjoner: {
          70: [
            {
              id: 71,
              sku: 'V11',
              regular_price: '2000.00',
              sale_price: '',
              description: '',
              manage_stock: true,
              stock_quantity: 1,
              stock_status: 'instock',
              attributes: [{ id: 30, name: 'Størrelse', option: '50ml' }],
              image: { id: 5, src: 'x' },
            },
          ],
        },
      }),
    )
    expect(finnPost(plan.produkter, 2)).toMatchObject({ id: 70 })
    expect(finnPost(plan.variasjoner, 11)).toMatchObject({
      handling: 'oppdater',
      id: 71,
      endringer: ['pris'],
    })
    expect(finnPost(plan.variasjoner, 12)).toMatchObject({ handling: 'opprett', id: null })
  })

  it('melder duplikate SKU-er i kilden og importerer ingen av dem', () => {
    const kilde = byggKilde(kildeFiler([enkeltProdukt(), enkeltProdukt({ id: 3, slug: 'annet-produkt' })]))
    const plan = lagPlan(kilde, tomButikk())
    expect(plan.produkter.map((p) => p.handling)).toEqual(['hopp_over', 'hopp_over'])
    expect(plan.feil.filter((f) => f.kode === 'duplikat_sku')).toHaveLength(2)
    expect(plan.advarsler.filter((a) => a.kode === 'duplikat_sku')).toHaveLength(1)
    expect(plan.avstemming.find((a) => a.type === 'Produkter')?.stemmer).toBe(false)
  })

  it('en ny kjøring etter --apply oppretter og endrer ingenting', async () => {
    const woo = lagFalskWoo()
    const kilde = byggKilde(variabelKilde())
    const eks1 = await lesEksisterende(stagingKlient(woo.fetch, true), stille)
    const resultat = await utforPlan(lagPlan(kilde, eks1), eks1, stagingKlient(woo.fetch), {
      produkterPerKall: 20,
      logg: stille,
    })
    expect(resultat.feil).toEqual([])
    expect(woo.tilstand.produkter).toHaveLength(2)

    const plan2 = lagPlan(kilde, await lesEksisterende(stagingKlient(woo.fetch, true), stille))
    const alle = [
      ...plan2.kategorier,
      ...plan2.merker,
      ...plan2.attributter,
      ...plan2.termer,
      ...plan2.produkter,
      ...plan2.variasjoner,
    ]
    expect(
      alle.filter((p) => p.handling !== 'uendret').map((p) => `${p.nokkel}: ${p.endringer.join(',')}`),
    ).toEqual([])
  })

  it('et kall som ble behandlet, men der svaret uteble, gir ikke duplikater', async () => {
    const woo = lagFalskWoo({ mistSvarPaa: '/products/batch' })
    const kilde = byggKilde(variabelKilde())
    const eks = await lesEksisterende(stagingKlient(woo.fetch, true), stille)
    const resultat = await utforPlan(lagPlan(kilde, eks), eks, stagingKlient(woo.fetch), {
      produkterPerKall: 20,
      logg: stille,
    })
    expect(woo.tilstand.produkter).toHaveLength(2)
    expect(resultat.telling.produkter).toMatchObject({ opprettet: 0, fantesAllerede: 2, feilet: 0 })
    // Variantene havner likevel på riktig forelder.
    expect(woo.tilstand.variasjoner[woo.tilstand.produkter[1]?.id ?? -1]).toHaveLength(2)
  })
})

describe('kategorier: forelder før barn', () => {
  it('sorterer forelder før barn uansett rekkefølge inn', () => {
    const sortert = sorterForelderForBarn([
      { slug: 'c', forelderSlug: 'b' },
      { slug: 'b', forelderSlug: 'a' },
      { slug: 'x', forelderSlug: null },
      { slug: 'a', forelderSlug: null },
    ])
    expect(sortert.map((k) => k.slug)).toEqual(['x', 'a', 'b', 'c'])
    expect(() => sorterForelderForBarn([{ slug: 'b', forelderSlug: 'mangler' }])).toThrow(/ikke finnes/)
    expect(() =>
      sorterForelderForBarn([
        { slug: 'a', forelderSlug: 'b' },
        { slug: 'b', forelderSlug: 'a' },
      ]),
    ).toThrow(/sirkel/)
  })

  it('planen har forelderen først og riktig dybde', () => {
    const plan = lagPlan(byggKilde(kildeFiler([enkeltProdukt()])), tomButikk())
    expect(plan.kategorier.map((k) => [k.onske.slug, k.onske.dybde, k.handling])).toEqual([
      ['duft', 0, 'opprett'],
      ['nisjeduft', 1, 'opprett'],
    ])
  })

  it('--apply oppretter forelderen i et eget kall før barnet, med forelderens nye ID', async () => {
    const woo = lagFalskWoo()
    const kilde = byggKilde(kildeFiler([enkeltProdukt()]))
    await utforPlan(lagPlan(kilde, tomButikk()), tomButikk(), stagingKlient(woo.fetch), {
      produkterPerKall: 20,
      logg: stille,
    })
    const kategorikall = woo.kall.filter((k) => k.sti === '/products/categories/batch')
    const duftId = woo.tilstand.kategorier.find((k) => k.slug === 'duft')?.id
    expect(kategorikall.map((k) => k.kropp)).toEqual([
      { create: [{ name: 'DUFT', slug: 'duft', parent: 0 }], update: [] },
      { create: [{ name: 'NISJEDUFT', slug: 'nisjeduft', parent: duftId }], update: [] },
    ])
  })
})

describe('doble variasjoner', () => {
  it('hopper over variasjoner merket duplicate_of og melder dem', () => {
    const plan = lagPlan(byggKilde(variabelKilde({ dobbel: 'merket' })), tomButikk())
    expect(finnPost(plan.variasjoner, 13)).toMatchObject({
      handling: 'hopp_over',
      grunn: 'samme valg som variasjon 12',
    })
    expect(plan.advarsler.filter((a) => a.kode === 'dobbel_variasjon')).toHaveLength(1)
    // Den doble har samme SKU som originalen – det meldes, men stopper ikke originalen.
    expect(plan.advarsler.find((a) => a.kode === 'duplikat_sku')?.tekst).toMatch(/hoppes over/)
    expect(plan.feil).toEqual([])
    expect(finnPost(plan.variasjoner, 12).handling).toBe('opprett')
    expect(plan.avstemming.find((a) => a.type === 'Variasjoner')).toMatchObject({
      iKilden: 3,
      hoppesOver: 1,
      forventet: 2,
      stemmer: true,
    })
  })

  it('fanger også en dobbel som ikke er merket – den første vinner', () => {
    const plan = lagPlan(byggKilde(variabelKilde({ dobbel: 'umerket' })), tomButikk())
    expect(finnPost(plan.variasjoner, 13)).toMatchObject({
      handling: 'hopp_over',
      grunn: 'samme valg som variasjon 12',
    })
  })

  it('sender aldri den doble variasjonen til WooCommerce', async () => {
    const woo = lagFalskWoo()
    const kilde = byggKilde(variabelKilde({ dobbel: 'umerket' }))
    await utforPlan(lagPlan(kilde, tomButikk()), tomButikk(), stagingKlient(woo.fetch), {
      produkterPerKall: 20,
      logg: stille,
    })
    const sendt = woo.kall
      .filter((k) => /\/variations\/batch$/.test(k.sti))
      .flatMap((k) => ((k.kropp as { create?: { sku?: string }[] }).create ?? []).map((v) => v.sku))
    expect(sendt).toEqual(['V11', 'V12'])
  })
})

describe('produksjon avvises', () => {
  it.each([
    'https://nettbutikk.reginaparfymeri.no',
    'https://reginaparfymeri.no',
    'https://www.reginaparfymeri.no/',
    'https://NETTBUTIKK.ReginaParfymeri.no.',
    'https://butikk.reginaparfymeri.no',
    'https://test.nettbutikk.reginaparfymeri.no/wp-json/wc/v3',
  ])('avviser %s', (url) => {
    expect(() => kontrollerStagingUrl(url)).toThrow(ProduksjonAvvist)
  })

  it('godtar tydelig staging og krever https', () => {
    expect(kontrollerStagingUrl('https://staging.nettbutikk.reginaparfymeri.no/')).toBe(
      'https://staging.nettbutikk.reginaparfymeri.no',
    )
    expect(kontrollerStagingUrl('https://nettbutikk-staging.reginaparfymeri.no')).toBe(
      'https://nettbutikk-staging.reginaparfymeri.no',
    )
    expect(kontrollerStagingUrl('https://regina.flyd.no/wp-json/wc/v3')).toBe('https://regina.flyd.no')
    expect(() => kontrollerStagingUrl('http://staging.example.no')).toThrow(/https/)
    expect(() => kontrollerStagingUrl('https://ck:cs@staging.example.no')).toThrow(/brukernavn/)
  })

  it('stopper før første kall – også med --apply og nøkler i miljøet', async () => {
    const spion = forbudtFetch()
    const prod = { ...NOKLER, WC_STAGING_URL: 'https://nettbutikk.reginaparfymeri.no' }
    await expect(kjor(['--apply'], prod, spion.fetch)).rejects.toThrow(ProduksjonAvvist)
    await expect(kjor([], prod, spion.fetch)).rejects.toThrow(ProduksjonAvvist)
    await expect(kjor([], { WC_STAGING_URL: 'https://reginaparfymeri.no' }, spion.fetch)).rejects.toThrow(
      ProduksjonAvvist,
    )
    expect(spion.antall()).toBe(0)
  })

  it('klienten nekter produksjon også når den lages direkte', () => {
    expect(() =>
      lagKlient({
        url: 'https://nettbutikk.reginaparfymeri.no',
        nokkel: 'ck',
        hemmelighet: 'cs',
        fetch: forbudtFetch().fetch,
        bareLesing: true,
      }),
    ).toThrow(ProduksjonAvvist)
  })
})

describe('tørrkjøring', () => {
  it('gjør bare GET-kall mot staging (falsk fetch) og viser forskjellen', async () => {
    const woo = lagFalskWoo({
      start: {
        kategorier: [{ id: 10, name: 'DUFT', slug: 'duft', parent: 0 }],
        produkter: [stagingProdukt({ regular_price: '899.00' })],
      },
    })
    for (const argv of [[], ['--dry-run']]) {
      const { resultat, skrevet } = await kjor(argv, NOKLER, woo.fetch, variabelKilde())
      expect(resultat.kode).toBe(0)
      expect(resultat.plan && finnPost(resultat.plan.produkter, 1)).toMatchObject({
        handling: 'oppdater',
        id: 55,
      })
      expect(skrevet.get('reports/import-dry-run.md')).toContain('## Endringer mot staging')
      expect(JSON.parse(skrevet.get('reports/import-dry-run.json') ?? '{}')).toHaveProperty('avstemming')
    }
    expect(woo.kall.length).toBeGreaterThan(10)
    expect([...new Set(woo.kall.map((k) => k.metode))]).toEqual(['GET'])
    expect(woo.tilstand.produkter).toHaveLength(1)
  })

  it('kjører helt offline uten nøkler', async () => {
    const spion = forbudtFetch()
    const { resultat, skrevet } = await kjor([], {}, spion.fetch, variabelKilde())
    expect(resultat.kode).toBe(0)
    expect(spion.antall()).toBe(0)
    expect(skrevet.get('reports/import-dry-run.md')).toContain('offline')
    expect(resultat.plan?.avstemming.find((a) => a.type === 'Produkter')).toMatchObject({
      opprett: 2,
      stemmer: true,
    })
  })

  it('klienten i lesemodus nekter alt annet enn GET før noe sendes', async () => {
    const spion = forbudtFetch()
    const klient = stagingKlient(spion.fetch, true)
    await expect(klient.batch('/products/batch', { create: [] })).rejects.toThrow(/bare GET/)
    await expect(klient.send('PUT', '/products/1', {})).rejects.toThrow(/bare GET/)
    expect(spion.antall()).toBe(0)
  })

  it('skriver aldri nøklene i rapportene', async () => {
    const { skrevet } = await kjor([], NOKLER, lagFalskWoo().fetch)
    for (const tekst of skrevet.values()) {
      expect(tekst).not.toContain(NOKLER.WC_STAGING_KEY)
      expect(tekst).not.toContain(NOKLER.WC_STAGING_SECRET)
    }
  })
})

describe('--apply', () => {
  it('skriver i batcher og teller opp mot kilden etterpå', async () => {
    const woo = lagFalskWoo()
    const { resultat, skrevet } = await kjor(
      ['--apply', '--produkter-per-kall=1'],
      NOKLER,
      woo.fetch,
      variabelKilde(),
    )
    expect(resultat.kode).toBe(0)
    const produktkall = woo.kall.filter((k) => k.sti === '/products/batch')
    expect(produktkall).toHaveLength(2)
    for (const k of woo.kall.filter((x) => x.metode === 'POST')) {
      const kropp = k.kropp as { create?: unknown[]; update?: unknown[] }
      expect((kropp.create?.length ?? 0) + (kropp.update?.length ?? 0)).toBeLessThanOrEqual(100)
    }
    const rapport = skrevet.get('reports/import-apply.md') ?? ''
    expect(rapport).toContain('Opptelling i staging etter importen')
    expect(rapport).toContain('Alt fra kilden finnes i staging.')
  })

  it('stopper før skriving når staging mangler WooCommerce Brands', async () => {
    const woo = lagFalskWoo({ utenBrands: true })
    const { resultat, skrevet } = await kjor(['--apply'], NOKLER, woo.fetch)
    expect(resultat.kode).toBe(1)
    expect([...new Set(woo.kall.map((k) => k.metode))]).toEqual(['GET'])
    expect(skrevet.get('reports/import-apply.md')).toContain('Ingenting er skrevet')
  })

  it('krever nøkler', async () => {
    await expect(kjor(['--apply'], { WC_STAGING_URL: STAGING }, forbudtFetch().fetch)).rejects.toThrow(
      /krever/,
    )
  })
})

describe('lagerstrategi', () => {
  it('lagerstyring bare når kilden gir et faktisk antall', () => {
    expect(tolkLager({ iLager: true, lavtLager: null, maks: 3, tekst: '3 på lager' })).toEqual({
      lager: { styring: 'antall', antall: 3, status: 'instock', grunnlag: 'antall fra Store API' },
      merknad: null,
    })
    expect(tolkLager({ iLager: true, lavtLager: null, maks: 9999, tekst: '' }).lager).toMatchObject({
      styring: 'status',
      status: 'instock',
    })
    expect(tolkLager({ iLager: false, lavtLager: 0, maks: 9999, tekst: 'Utsolgt' }).lager).toMatchObject({
      styring: 'antall',
      antall: 0,
      status: 'outofstock',
    })
    expect(tolkLager({ iLager: false, lavtLager: null, maks: 9999, tekst: 'Utsolgt' }).lager).toMatchObject({
      styring: 'status',
      status: 'outofstock',
    })
    expect(tolkLager({ iLager: false, lavtLager: 0, maks: 1, tekst: 'Utsolgt' }).merknad).toBe(
      'mulig_negativt_lager',
    )
    expect(tolkLager({ iLager: true, lavtLager: 2, maks: 3, tekst: '3 på lager' })).toMatchObject({
      lager: { styring: 'status' },
      merknad: 'lager_uenig',
    })
  })

  it('variable produkter får ingen lagerstyring eller pris på forelderen', () => {
    const plan = lagPlan(byggKilde(variabelKilde()), tomButikk())
    const payload = produktPayload(finnPost(plan.produkter, 2) as Post<Produkt>, ider)
    expect(payload.manage_stock).toBe(false)
    expect(payload).not.toHaveProperty('stock_quantity')
    expect(payload).not.toHaveProperty('stock_status')
    expect(payload).not.toHaveProperty('regular_price')
    expect(variasjonPayload(finnPost(plan.variasjoner, 11), ider)).toMatchObject({
      manage_stock: true,
      stock_quantity: 1,
      sku: 'V11',
      attributes: [{ id: 30, option: '50ml' }],
    })
  })
})

describe('kilden', () => {
  it('flagger merker som ikke selges på nett uten å endre produktet', () => {
    const filer = kildeFiler([
      enkeltProdukt({
        name: 'GUERLAIN – Mon Guerlain',
        brand: 'Guerlain',
        brand_slug: 'guerlain',
        legacy_brand: null,
      }),
    ])
    filer.merker.push({ name: 'Guerlain', slug: 'guerlain', product_count: 1 })
    const plan = lagPlan(byggKilde(filer), tomButikk())
    expect(plan.advarsler.filter((a) => a.kode === 'kun_i_butikk')).toHaveLength(1)
    expect(finnPost(plan.produkter, 1)).toMatchObject({
      handling: 'opprett',
      onske: { merke: { slug: 'guerlain' } },
    })
  })

  it('melder manglende merke og beskrivelse, og fjerner gjentatte bilder', () => {
    const bilde = { src: 'https://bilder.example/a.jpg', alt: '' }
    const kilde = byggKilde(
      kildeFiler([enkeltProdukt({ brand: null, brand_slug: null, description: '', images: [bilde, bilde] })]),
    )
    const koder = kilde.meldinger.map((m) => m.kode)
    expect(koder).toEqual(expect.arrayContaining(['mangler_merke', 'mangler_beskrivelse', 'doble_bilder']))
    expect(kilde.produkter[0]?.bilder).toEqual([bilde])
  })
})
