import { describe, expect, it } from 'vitest'
import type { Katalog, Produkt, Variant } from '../katalog/typer'
import { delsum, hurtigkjop, kurvReducer, lagLinje, nokkel, validerKurv } from './kurv'

const lager = { status: 'pa-lager' as const, antall: null, tekst: '' }
const pris = (ore: number) => ({ pris: ore, ordinaer: ore, tilbud: false, valuta: 'NOK' })

function variant(id: number, storrelse: string, ore: number, utsolgt = false): Variant {
  return {
    id,
    valg: { Størrelse: storrelse },
    beskrivelse: '',
    pris: pris(ore),
    lager: utsolgt ? { status: 'utsolgt', antall: 0, tekst: 'Utsolgt' } : lager,
    kjopbar: !utsolgt,
    sku: `sku-${id}`,
    maks: 2,
  }
}

function produkt(over: Partial<Produkt>): Produkt {
  return {
    id: 1,
    slug: 'p',
    navn: 'P',
    visningsnavn: 'P',
    merke: { id: 9, navn: 'Creed', slug: 'creed' },
    type: 'enkel',
    kategorier: [],
    pris: pris(10000),
    prisspenn: null,
    lager,
    kjopbar: true,
    maks: 5,
    sku: 'x',
    bilder: [],
    beskrivelse: [],
    duftnoter: null,
    egenskaper: [],
    varianter: [],
    rekkefolge: 0,
    lenke: '',
    ...over,
  }
}

const parfyme = produkt({
  id: 6223,
  type: 'variabel',
  visningsnavn: 'Side Effect EdP',
  egenskaper: [
    {
      navn: 'Størrelse',
      taksonomi: 'pa_storrelse',
      verdier: [
        { verdi: '50ml', visning: '50 ml' },
        { verdi: '90ml', visning: '90 ml' },
      ],
    },
  ],
  varianter: [variant(6224, '50ml', 264500), variant(6225, '90ml', 330500)],
})
const olje = produkt({ id: 10481, pris: pris(94900), maks: 3 })
const katalog = { produkter: [parfyme, olje], kategorier: [], merker: [], meta: {} } as unknown as Katalog

describe('lagLinje', () => {
  it('bruker prisen og navnet til varianten som er valgt', () => {
    const linje = lagLinje(parfyme, 6225)
    expect(linje.variantId).toBe(6225)
    expect(linje.enhetspris).toBe(330500)
    expect(linje.variantTekst).toBe('Størrelse: 90 ml')
  })

  it('nekter et variabelt produkt uten valgt variant', () => {
    expect(() => lagLinje(parfyme, null)).toThrow(/Velg variant/)
    expect(() => lagLinje(parfyme, 999)).toThrow()
  })

  it('nekter variant på et enkelt produkt', () => {
    expect(() => lagLinje(olje, 6224)).toThrow()
  })
})

describe('kurvReducer', () => {
  it('slår sammen samme variant og holder ulike varianter adskilt', () => {
    let kurv = kurvReducer([], { type: 'legg-til', linje: lagLinje(parfyme, 6224), antall: 1 })
    kurv = kurvReducer(kurv, { type: 'legg-til', linje: lagLinje(parfyme, 6224), antall: 1 })
    kurv = kurvReducer(kurv, { type: 'legg-til', linje: lagLinje(parfyme, 6225), antall: 1 })
    expect(kurv.map((l) => [nokkel(l), l.antall])).toEqual([
      ['6223:6224', 2],
      ['6223:6225', 1],
    ])
    expect(delsum(kurv)).toBe(2 * 264500 + 330500)
  })

  it('går aldri over maks og aldri under én', () => {
    let kurv = kurvReducer([], { type: 'legg-til', linje: lagLinje(olje, null), antall: 10 })
    expect(kurv[0]?.antall).toBe(3)
    kurv = kurvReducer(kurv, { type: 'sett-antall', nokkel: '10481:0', antall: 0 })
    expect(kurv[0]?.antall).toBe(1)
    kurv = kurvReducer(kurv, { type: 'sett-antall', nokkel: '10481:0', antall: 2.7 })
    expect(kurv[0]?.antall).toBe(2)
  })

  it('fjerner bare linjen som er valgt', () => {
    let kurv = kurvReducer([], { type: 'legg-til', linje: lagLinje(parfyme, 6224), antall: 1 })
    kurv = kurvReducer(kurv, { type: 'legg-til', linje: lagLinje(olje, null), antall: 1 })
    kurv = kurvReducer(kurv, { type: 'fjern', nokkel: '6223:6224' })
    expect(kurv.map(nokkel)).toEqual(['10481:0'])
  })
})

describe('validerKurv', () => {
  it('oppdaterer en gammel pris fra nettleseren og sier fra', () => {
    const [r] = validerKurv([{ produktId: 6223, variantId: 6224, antall: 1, enhetspris: 199900 }], katalog)
    expect(r?.status).toEqual({ type: 'pris-endret', fra: 199900, til: 264500 })
    expect(r?.linje.enhetspris).toBe(264500)
    expect(r?.gyldig).toBe(true)
  })

  it('justerer antallet ned til det som finnes', () => {
    const [r] = validerKurv([{ produktId: 10481, variantId: null, antall: 9, enhetspris: 94900 }], katalog)
    expect(r?.status).toEqual({ type: 'antall-justert', til: 3 })
    expect(r?.linje.antall).toBe(3)
  })

  it('stopper utsolgte, forsvunne og feil sammensatte linjer fra å gå til kassen', () => {
    const utsolgt = produkt({ id: 5, type: 'variabel', varianter: [variant(51, '50ml', 1000, true)] })
    const k = { ...katalog, produkter: [...katalog.produkter, utsolgt] } as Katalog
    const resultat = validerKurv(
      [
        { produktId: 5, variantId: 51, antall: 1, enhetspris: 1000 },
        { produktId: 404, variantId: null, antall: 1, enhetspris: 1000 },
        { produktId: 6223, variantId: null, antall: 1, enhetspris: 264500 },
        { produktId: 6223, variantId: 9999, antall: 1, enhetspris: 264500 },
        { produktId: 10481, variantId: 6224, antall: 1, enhetspris: 94900 },
      ],
      k,
    )
    expect(resultat.map((r) => [r.status.type, r.gyldig])).toEqual([
      ['utsolgt', false],
      ['finnes-ikke', false],
      ['finnes-ikke', false],
      ['finnes-ikke', false],
      ['finnes-ikke', false],
    ])
  })
})

describe('hurtigkjop', () => {
  it('er lov for enkle produkter på lager', () => {
    expect(hurtigkjop(olje)).toEqual({ variantId: null })
  })
  it('er aldri lov når kunden må velge størrelse', () => {
    expect(hurtigkjop(parfyme)).toBeNull()
  })
  it('er lov når et variabelt produkt bare har én variant', () => {
    expect(hurtigkjop(produkt({ type: 'variabel', varianter: [variant(7, '50ml', 100)] }))).toEqual({
      variantId: 7,
    })
  })
  it('er ikke lov for en utsolgt eneste variant eller et utsolgt produkt', () => {
    expect(hurtigkjop(produkt({ type: 'variabel', varianter: [variant(7, '50ml', 100, true)] }))).toBeNull()
    expect(
      hurtigkjop(produkt({ kjopbar: false, lager: { status: 'utsolgt', antall: 0, tekst: '' } })),
    ).toBeNull()
  })
})
