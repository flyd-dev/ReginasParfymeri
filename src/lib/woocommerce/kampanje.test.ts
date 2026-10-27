import { describe, expect, it } from 'vitest'
import { erAktiv, gyldigKampanje } from './kampanje'

const k = {
  id: 1,
  tekst: 'Høstkampanje',
  lenke: '/tilbud/',
  lenketekst: 'Se tilbud',
  start: '2026-10-01T00:00:00+02:00',
  slutt: '2026-11-01T00:00:00+01:00',
}

describe('kampanjer forsvinner av seg selv', () => {
  it('er aktiv mellom start og slutt', () => {
    expect(erAktiv(k, new Date('2026-10-15T12:00:00Z'))).toBe(true)
  })
  it('er ikke aktiv før start eller etter slutt', () => {
    expect(erAktiv(k, new Date('2026-09-30T21:59:59Z'))).toBe(false)
    expect(erAktiv(k, new Date('2026-10-31T23:00:00Z'))).toBe(false)
  })
  it('godtar bare kampanjer med tekst, gyldige datoer og trygg lenke', () => {
    expect(gyldigKampanje(k)).toBe(true)
    expect(gyldigKampanje({ ...k, slutt: 'aldri' })).toBe(false)
    expect(gyldigKampanje({ ...k, tekst: ' ' })).toBe(false)
    expect(gyldigKampanje({ ...k, lenke: 'javascript:alert(1)' })).toBe(false)
    expect(gyldigKampanje({ ...k, lenke: null })).toBe(true)
  })
})
