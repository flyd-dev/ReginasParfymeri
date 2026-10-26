import { describe, expect, it } from 'vitest'
import { kroner } from './format'

describe('kroner', () => {
  it('viser hele kroner uten øre og med norsk tusenskille', () => {
    expect(kroner(264500)).toBe('2 645 kr')
    expect(kroner(9900)).toBe('99 kr')
  })
  it('viser øre når beløpet ikke er helt', () => {
    expect(kroner(9950)).toBe('99,50 kr')
  })
  it('nekter beløp som ikke er heltall øre', () => {
    expect(() => kroner(99.5)).toThrow()
  })
})
