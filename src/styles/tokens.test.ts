// Holder paletten innenfor WCAG 2.2. Et nytt par av tekst og bakgrunn skal inn her.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(path.join(process.cwd(), 'src', 'styles', 'tokens.css'), 'utf8')

function token(navn: string): string {
  const treff = new RegExp(`--${navn}:\\s*(#[0-9a-f]{6})`, 'i').exec(css)
  if (!treff?.[1]) throw new Error(`Fant ikke --${navn}`)
  return treff[1]
}

function luminans(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = Number.parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function kontrast(a: string, b: string): number {
  const [l1, l2] = [luminans(token(a)), luminans(token(b))].sort((x, y) => y - x) as [number, number]
  return (l1 + 0.05) / (l2 + 0.05)
}

// [tekst, bakgrunn, krav]
const PAR: [string, string, number][] = [
  ['blekk', 'sand', 4.5],
  ['blekk', 'sand-lys', 4.5],
  ['blekk', 'sand-dyp', 4.5],
  ['blekk', 'sand-mork', 4.5],
  ['blekk', 'rosa-lys', 4.5],
  ['blekk', 'rosa-dus', 4.5],
  ['blekk-dempet', 'sand', 4.5],
  ['blekk-dempet', 'sand-lys', 4.5],
  ['blekk-dempet', 'sand-dyp', 4.5],
  ['rosa-tekst', 'sand', 4.5],
  ['rosa-tekst', 'sand-lys', 4.5],
  ['rosa-tekst', 'sand-dyp', 4.5],
  ['rosa-tekst', 'rosa-lys', 4.5],
  ['paa-rosa', 'rosa-knapp', 4.5],
  ['paa-rosa', 'rosa-knapp-hover', 4.5],
  ['paa-mork', 'plomme', 4.5],
  ['paa-mork-dempet', 'plomme', 4.5],
  ['rosa-paa-mork', 'plomme', 4.5],
  ['paa-mork', 'plomme-dyp', 4.5],
  ['paa-mork-dempet', 'plomme-dyp', 4.5],
  ['rosa-paa-mork', 'plomme-dyp', 4.5],
  // Ikonknapper med peker over på mørk flate.
  ['paa-mork', 'plomme-linje', 4.5],
  // Kategorikortene på rosa flater.
  ['blekk-dempet', 'rosa-lys', 4.5],
  ['blekk-dempet', 'rosa-dus', 4.5],
  ['ok', 'sand', 4.5],
  ['ok', 'sand-lys', 4.5],
  ['varsel', 'sand', 4.5],
  ['varsel', 'sand-lys', 4.5],
  ['feil', 'sand', 4.5],
  ['feil', 'sand-lys', 4.5],
  // Store titler og dekor i merkefargen.
  ['rosa', 'sand', 3],
  ['rosa', 'sand-lys', 3],
  // Kanter på skjemafelt og knapper (ikke-tekstlig kontrast).
  ['linje-sterk', 'sand', 3],
  ['linje-sterk', 'sand-lys', 3],
  ['rosa-knapp', 'sand', 3],
  // Pauseknappen i det rosa merkebåndet.
  ['plomme', 'rosa-knapp', 3],
]

describe('fargekontrast', () => {
  for (const [tekst, bakgrunn, krav] of PAR) {
    it(`${tekst} på ${bakgrunn} ≥ ${krav}:1`, () => {
      expect(kontrast(tekst, bakgrunn)).toBeGreaterThanOrEqual(krav)
    })
  }

  it('bruker Reginas faktiske rosa', () => {
    expect(token('rosa').toLowerCase()).toBe('#e9168c')
  })

  it('har ingen rent hvit flate', () => {
    for (const flate of ['sand', 'sand-lys', 'sand-dyp'])
      expect(token(flate).toLowerCase()).not.toBe('#ffffff')
  })
})
