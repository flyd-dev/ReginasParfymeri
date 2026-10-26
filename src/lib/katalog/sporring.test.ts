import { describe, expect, it } from 'vitest'
import type { Katalog, Produkt } from './typer'
import {
  antallAktive,
  fasetter,
  filtrer,
  kategoristi,
  kategoritre,
  lagSokeindeks,
  lesFiltre,
  sok,
  sorter,
  TOMME_FILTRE,
} from './sporring'

const lager = { status: 'pa-lager' as const, antall: null, tekst: '' }

function p(id: number, over: Partial<Produkt>): Produkt {
  return {
    id,
    slug: `p${id}`,
    navn: `P${id}`,
    visningsnavn: `P${id}`,
    merke: null,
    type: 'enkel',
    kategorier: [],
    pris: { pris: 10000, ordinaer: 10000, tilbud: false, valuta: 'NOK' },
    prisspenn: null,
    lager,
    kjopbar: true,
    maks: 5,
    sku: `SKU${id}`,
    bilder: [],
    beskrivelse: [],
    duftnoter: null,
    egenskaper: [],
    varianter: [],
    rekkefolge: id,
    lenke: '',
    ...over,
  }
}

const creed = { id: 1, navn: 'Creed', slug: 'creed' }
const lowengrip = { id: 2, navn: 'Löwengrip', slug: 'lowengrip' }

const katalog: Katalog = {
  kategorier: [
    { id: 10, navn: 'Duft', slug: 'duft', forelder: null, antall: 0 },
    { id: 11, navn: 'Nisjeduft', slug: 'nisjeduft', forelder: 10, antall: 0 },
    { id: 12, navn: 'Herreduft', slug: 'herreduft', forelder: 10, antall: 0 },
    { id: 20, navn: 'Hår', slug: 'har', forelder: null, antall: 0 },
    { id: 30, navn: 'Tom', slug: 'tom', forelder: null, antall: 0 },
  ],
  merker: [],
  meta: { kilde: 'utdrag', butikk: '', hentet: '', antallProdukter: 4 },
  produkter: [
    p(1, {
      navn: 'CREED – Aventus',
      visningsnavn: 'Aventus',
      merke: creed,
      kategorier: [11],
      pris: { pris: 265000, ordinaer: 265000, tilbud: false, valuta: 'NOK' },
      duftnoter: { topp: ['Bergamott'], hjerte: ['Rose'], bunn: ['Vanilje fra Madagaskar'] },
    }),
    p(2, {
      navn: 'CREED – Viking Cologne',
      visningsnavn: 'Viking Cologne',
      merke: creed,
      kategorier: [12],
      pris: { pris: 25000, ordinaer: 25000, tilbud: false, valuta: 'NOK' },
      lager: { status: 'utsolgt', antall: 0, tekst: 'Utsolgt' },
    }),
    p(3, {
      navn: 'LÖWENGRIP – Good To Go – Tørrshampoo',
      visningsnavn: 'Good To Go – Tørrshampoo',
      merke: lowengrip,
      kategorier: [20],
      pris: { pris: 10900, ordinaer: 17500, tilbud: true, valuta: 'NOK' },
    }),
    p(4, { navn: 'Pinsett', visningsnavn: 'Pinsett', kategorier: [20] }),
  ],
}

describe('kategorier', () => {
  it('teller produkter i underkategorier og skjuler tomme kategorier', () => {
    const tre = kategoritre(katalog)
    expect(tre.map((n) => [n.slug, n.totalt])).toEqual([
      ['duft', 2],
      ['har', 2],
    ])
    expect(tre[0]?.barn.map((b) => b.slug)).toEqual(['herreduft', 'nisjeduft'])
  })

  it('finner stien til en kategori', () => {
    const nisje = katalog.kategorier[1]
    expect(nisje && kategoristi(katalog, nisje).map((k) => k.slug)).toEqual(['duft', 'nisjeduft'])
  })
})

describe('filtre fra adressen', () => {
  it('leser gyldige verdier og ignorerer resten', () => {
    const { filtre, sortering, side } = lesFiltre({
      merke: 'creed,<script>',
      pris: ['under-300', 'tull'],
      lager: '1',
      sorter: 'pris-synkende',
      side: '999',
    })
    expect(filtre.merke).toEqual(['creed'])
    expect(filtre.pris).toEqual(['under-300'])
    expect(filtre.lager).toBe(true)
    expect(sortering).toBe('pris-synkende')
    expect(side).toBe(100)
    expect(antallAktive(filtre)).toBe(3)
  })
})

describe('filtrering og fasetter', () => {
  it('filtrerer på merke, lager, tilbud, pris og duftnote', () => {
    const alle = katalog.produkter
    expect(filtrer(alle, { ...TOMME_FILTRE, merke: ['creed'] }, katalog).map((x) => x.id)).toEqual([1, 2])
    expect(
      filtrer(alle, { ...TOMME_FILTRE, merke: ['creed'], lager: true }, katalog).map((x) => x.id),
    ).toEqual([1])
    expect(filtrer(alle, { ...TOMME_FILTRE, tilbud: true }, katalog).map((x) => x.id)).toEqual([3])
    expect(filtrer(alle, { ...TOMME_FILTRE, pris: ['over-2000'] }, katalog).map((x) => x.id)).toEqual([1])
    expect(filtrer(alle, { ...TOMME_FILTRE, note: 'vanilje' }, katalog).map((x) => x.id)).toEqual([1])
    expect(filtrer(alle, { ...TOMME_FILTRE, kategori: ['duft'] }, katalog).map((x) => x.id)).toEqual([1, 2])
  })

  it('teller hver fasett med de andre filtrene aktive', () => {
    const f = fasetter(
      katalog.produkter,
      { ...TOMME_FILTRE, merke: ['creed'] },
      katalog,
      katalog.kategorier.slice(1, 3),
    )
    expect(f.merke.find((m) => m.id === 'creed')).toMatchObject({ antall: 2, valgt: true })
    expect(f.merke.find((m) => m.id === 'lowengrip')).toMatchObject({ antall: 1, valgt: false })
    expect(f.kategori.map((k) => [k.id, k.antall])).toEqual([
      ['nisjeduft', 1],
      ['herreduft', 1],
    ])
    expect(f.lager).toBe(1)
  })
})

describe('sortering', () => {
  it('setter utsolgte sist i standardrekkefølgen', () => {
    expect(sorter(katalog.produkter, 'nyeste').map((x) => x.id)).toEqual([1, 3, 4, 2])
  })
  it('sorterer på pris', () => {
    expect(sorter(katalog.produkter, 'pris-stigende').map((x) => x.id)).toEqual([4, 3, 2, 1])
  })
})

describe('søk', () => {
  const indeks = lagSokeindeks(katalog)
  it('finner merker uten aksenter og krever at alle ord treffer', () => {
    expect(sok(indeks, 'lowengrip').map((x) => x.id)).toEqual([3])
    expect(sok(indeks, 'creed aventus').map((x) => x.id)).toEqual([1])
    expect(sok(indeks, 'creed tørrshampoo')).toEqual([])
  })
  it('forstår «parfyme» og setter varer på lager først', () => {
    expect(sok(indeks, 'creed').map((x) => x.id)).toEqual([1, 2])
    expect(sok(indeks, 'parfyme').map((x) => x.id)).toContain(1)
  })
  it('finner dufter etter oppgitt note', () => {
    expect(sok(indeks, 'vanilje').map((x) => x.id)).toEqual([1])
  })
  it('gir ingen treff på tomt søk', () => {
    expect(sok(indeks, '   ')).toEqual([])
  })
})
