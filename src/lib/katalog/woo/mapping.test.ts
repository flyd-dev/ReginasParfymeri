import { describe, expect, it } from 'vitest'
import utvalg from './testdata/storeapi-utvalg.json'
import type { WooProdukt } from './storeApi'
import { kjentBeholdning, lagLager, lagMaks, lagPris, lagProdukt, tilOre } from './mapping'

const produkter = utvalg.produkter as unknown as WooProdukt[]
const variasjoner = new Map((utvalg.variasjoner as unknown as WooProdukt[]).map((v) => [v.id, v]))

function bygg(id: number) {
  const p = produkter.find((x) => x.id === id)
  if (!p) throw new Error(`mangler testprodukt ${id}`)
  return lagProdukt(p, {
    merkeFor: () => ({ id: 1, navn: 'Initio Parfums Privés', slug: 'initio' }),
    analyse: () => undefined,
    variasjon: (vid) => variasjoner.get(vid),
    rekkefolge: 0,
  })
}

describe('beløp fra Store API', () => {
  it('leser minste enhet som heltall øre', () => {
    expect(tilOre('264500', 2)).toBe(264500)
    expect(tilOre('2645', 0)).toBe(264500)
    expect(tilOre('', 2)).toBe(0)
  })

  it('godtar ikke desimaltall eller tekst – det ville vært et brudd på kontrakten', () => {
    expect(() => tilOre('2645.00', 2)).toThrow()
    expect(() => tilOre('kr 10', 2)).toThrow()
  })

  it('merker tilbud bare når WooCommerce sier det og prisen faktisk er lavere', () => {
    const priser = {
      price: '34900',
      regular_price: '49900',
      sale_price: '34900',
      price_range: null,
      currency_code: 'NOK',
      currency_minor_unit: 2,
    }
    expect(lagPris(priser, true)).toEqual({ pris: 34900, ordinaer: 49900, tilbud: true, valuta: 'NOK' })
    expect(lagPris(priser, false).tilbud).toBe(false)
    expect(lagPris({ ...priser, regular_price: '34900' }, true).tilbud).toBe(false)
  })
})

describe('lager', () => {
  const grunn = {
    is_in_stock: true,
    is_on_backorder: false,
    low_stock_remaining: null,
    stock_availability: { text: '', class: 'in-stock' },
  }

  it('utsolgt når WooCommerce sier at varen ikke er på lager', () => {
    expect(lagLager({ ...grunn, is_in_stock: false }).status).toBe('utsolgt')
  })

  it('«få igjen» bare når WooCommerce selv melder lav beholdning', () => {
    expect(
      lagLager({ ...grunn, low_stock_remaining: 1, stock_availability: { text: '1 på lager', class: '' } }),
    ).toEqual({
      status: 'fa-igjen',
      antall: 1,
      tekst: '1 på lager',
    })
    expect(lagLager({ ...grunn, stock_availability: { text: '4 på lager', class: '' } }).status).toBe(
      'pa-lager',
    )
  })

  it('leser antallet fra WooCommerces egen tekst og begrenser kurven til det', () => {
    const felt = { ...grunn, stock_availability: { text: '4 på lager', class: '' } }
    expect(kjentBeholdning(felt)).toBe(4)
    expect(
      lagMaks({
        ...felt,
        add_to_cart: { maximum: 9999, minimum: 1, multiple_of: 1 },
        sold_individually: false,
      }),
    ).toBe(4)
  })

  it('«selges enkeltvis» gir maks én', () => {
    expect(
      lagMaks({
        ...grunn,
        add_to_cart: { maximum: 9999, minimum: 1, multiple_of: 1 },
        sold_individually: true,
      }),
    ).toBe(1)
  })
})

describe('variable produkter', () => {
  it('gir hver størrelse sin egen pris og sitt eget lager (Initio Side Effect)', () => {
    const p = bygg(6223)
    expect(p.type).toBe('variabel')
    expect(p.varianter).toHaveLength(2)
    const femti = p.varianter.find((v) => v.valg['Størrelse'] === '50ml')
    const nitti = p.varianter.find((v) => v.valg['Størrelse'] === '90ml')
    expect(femti?.id).toBe(6224)
    expect(nitti?.id).toBe(6225)
    expect(femti?.pris.pris).toBe(264500)
    expect(nitti?.pris.pris).toBe(330500)
    // Produktet viser laveste pris og spennet.
    expect(p.pris.pris).toBe(264500)
    expect(p.prisspenn).toEqual({ fra: 264500, til: 330500 })
  })

  it('er utsolgt når alle variantene er utsolgt (Montblanc Legend EdP)', () => {
    const p = bygg(6385)
    expect(p.varianter.every((v) => v.lager.status === 'utsolgt')).toBe(true)
    expect(p.lager.status).toBe('utsolgt')
    expect(p.kjopbar).toBe(false)
  })

  it('velger den første av to like variasjoner, slik WooCommerce gjør, og melder avviket', () => {
    const forelder = produkter.find((x) => x.id === 6223) as WooProdukt
    const dobbel: WooProdukt = {
      ...forelder,
      variations: [
        { id: 6225, attributes: [{ name: 'Størrelse', value: '90ml' }] },
        { id: 6224, attributes: [{ name: 'Størrelse', value: '90ml' }] },
      ],
    }
    const avvik: string[] = []
    const p = lagProdukt(dobbel, {
      merkeFor: () => null,
      analyse: () => undefined,
      variasjon: (vid) => variasjoner.get(vid),
      rekkefolge: 0,
      avvik: (a) => avvik.push(a.type),
    })
    expect(p.varianter.map((v) => [v.id, v.pris.pris])).toEqual([[6225, 330500]])
    expect(avvik).toEqual(['dobbel-variant'])
  })

  it('viser verdiene med norsk skrivemåte', () => {
    const p = bygg(6223)
    expect(p.egenskaper[0]?.verdier.map((v) => v.visning)).toEqual(['50 ml', '90 ml'])
  })
})

describe('enkle produkter', () => {
  it('beholder pris, SKU og lenken til dagens nettbutikk', () => {
    const p = bygg(10481)
    expect(p.type).toBe('enkel')
    expect(p.pris.pris).toBe(94900)
    expect(p.varianter).toHaveLength(0)
    expect(p.lenke).toMatch(/^https:\/\/nettbutikk\.reginaparfymeri\.no\/produkt\//)
  })

  it('leser duftnoter som står i beskrivelsen og tar dem ut av teksten', () => {
    const p = bygg(10211)
    expect(p.duftnoter?.topp).toEqual(['Pistasjakkord', 'Cosmofruit™'])
    expect(p.duftnoter?.hjerte).toEqual(['Appelsinblomst', 'Tonkabønne'])
    expect(p.duftnoter?.bunn).toEqual(['Vanilje', 'Tobakk', 'Saffiano-skinn'])
    const tekst = JSON.stringify(p.beskrivelse)
    expect(tekst).not.toMatch(/Toppnoter:/)
    expect(tekst).toMatch(/Velvet Tonka Extrait er en sensuell/)
  })
})
