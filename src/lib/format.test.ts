import { describe, expect, it } from 'vitest'
import { antallTekst, desimalkroner, fraKroner, kroner } from './format'

const nb = (s: string) => s.replace(/[  ]/g, ' ')

describe('kroner', () => {
  it('viser hele kroner uten desimaler, med kr foran', () => {
    expect(nb(kroner(94900))).toBe('kr 949')
    expect(nb(kroner(264500))).toBe('kr 2 645')
  })
  it('viser øre når beløpet ikke er helt', () => {
    expect(nb(kroner(94950))).toBe('kr 949,50')
  })
  it('viser fra-pris for varianter', () => {
    expect(nb(fraKroner(264500))).toBe('fra kr 2 645')
  })
  it('bryter ikke linjen mellom kr og beløpet', () => {
    expect(kroner(94900)).toContain('kr ')
  })
  it('avviser beløp som ikke er heltall øre', () => {
    expect(() => kroner(949.5)).toThrow()
  })
  it('gir desimalbeløp til strukturerte data', () => {
    expect(desimalkroner(94900)).toBe('949.00')
  })
  it('bøyer antall', () => {
    expect(antallTekst(1, 'produkt', 'produkter')).toBe('1 produkt')
    expect(nb(antallTekst(1082, 'produkt', 'produkter'))).toBe('1 082 produkter')
  })
})
