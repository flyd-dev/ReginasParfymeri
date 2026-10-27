// Holder paletten innenfor WCAG 2.1 AA. Et nytt par av tekst og bakgrunn skal inn her før det tas i bruk.

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

const TEKST = 4.5 // brødtekst og små knappetekster
const STOR = 3 // stor tekst (24px+, eller 19px+ fet), ikoner og kanter på skjemafelt

// [forgrunn, bakgrunn, krav, hvor]
const PAR: [string, string, number, string][] = [
  ['regina-plum', 'sand-50', TEKST, 'standard tekst'],
  ['regina-plum', 'sand-100', TEKST, 'tekst i seksjoner, kort og footer'],
  ['regina-plum', 'sand-200', TEKST, 'valgt filter, hover på rader'],
  ['regina-plum', 'paper', TEKST, 'tekst i skuffer, dialoger og menyer'],
  ['sand-ink', 'sand-50', TEKST, 'metadata på hovedbakgrunnen'],
  ['sand-ink', 'paper', TEKST, 'metadata i skuffer og dialoger'],
  ['sand-ink-deep', 'sand-50', TEKST, 'shadcn muted-foreground'],
  ['sand-ink-deep', 'sand-100', TEKST, 'sekundærtekst i seksjoner og footer'],
  ['sand-ink-deep', 'paper', TEKST, 'shadcn muted-foreground i popover'],
  ['regina-pink-strong', 'sand-50', TEKST, 'rosa lenker og tekst'],
  ['regina-pink-strong', 'paper', TEKST, 'rosa lenker i skuffer'],
  ['white', 'regina-pink-strong', TEKST, 'rosa knapp med hvit tekst'],
  ['white', 'regina-plum', TEKST, 'primærknapp'],
  ['sand-50', 'regina-plum', TEKST, 'lys tekst på plum (toppstripe)'],
  ['sand-100', 'regina-plum', TEKST, 'dempet lys tekst på plum'],
  ['regina-pink', 'sand-50', STOR, 'store rosa overskrifter og ikoner'],
  ['regina-pink', 'paper', STOR, 'rosa merker på produktbilder (stor/fet tekst)'],
  ['white', 'regina-pink', STOR, 'hvit stor tekst på ren rosa'],
  ['regina-pink', 'regina-plum', STOR, 'rosa kursiv i store overskrifter på plum'],
  ['regina-pink', 'sand-100', STOR, 'rosa kursiv i store overskrifter i seksjoner'],
  ['sand-ink', 'sand-50', STOR, 'kant på skjemafelt'],
  ['sand-ink', 'paper', STOR, 'kant på skjemafelt i skuffer'],
  ['regina-pink-strong', 'sand-50', STOR, 'fokusring'],
  ['regina-pink-strong', 'sand-100', STOR, 'fokusring i seksjoner'],
  ['status-ok', 'sand-50', TEKST, 'på lager'],
  ['status-ok', 'paper', TEKST, 'på lager i kurven'],
  ['status-varsel', 'sand-50', TEKST, 'få igjen'],
  ['status-varsel', 'paper', TEKST, 'få igjen i kurven'],
  ['status-feil', 'sand-50', TEKST, 'utsolgt og feil'],
  ['status-feil', 'paper', TEKST, 'feil i skjema'],
  ['white', 'status-feil', STOR, 'ikon i feilvarsel (handlekurven)'],
  ['white', 'status-varsel', STOR, 'ikon i varsel om oppdatert handlekurv'],
]

describe('kontrast i paletten', () => {
  it.each(PAR)('%s på %s holder %d:1 (%s)', (forgrunn, bakgrunn, krav) => {
    expect(kontrast(forgrunn, bakgrunn)).toBeGreaterThanOrEqual(krav)
  })

  it('oppdragets målte verdier stemmer', () => {
    expect(kontrast('regina-pink', 'sand-50')).toBeCloseTo(3.65, 1)
    expect(kontrast('white', 'regina-pink')).toBeCloseTo(4.24, 1)
    expect(kontrast('regina-pink-strong', 'sand-50')).toBeCloseTo(5.03, 1)
    expect(kontrast('white', 'regina-pink-strong')).toBeCloseTo(5.84, 1)
    expect(kontrast('regina-plum', 'sand-50')).toBeCloseTo(13.45, 1)
  })

  it('ren rosa holder ikke for brødtekst – derfor regina-pink-strong', () => {
    expect(kontrast('regina-pink', 'sand-50')).toBeLessThan(TEKST)
    expect(kontrast('white', 'regina-pink')).toBeLessThan(TEKST)
  })

  it('sand-ink og regina-pink-strong holder ikke på sand-100 – derfor sand-ink-deep og plum der', () => {
    expect(kontrast('sand-ink', 'sand-100')).toBeLessThan(TEKST)
    expect(kontrast('regina-pink-strong', 'sand-100')).toBeLessThan(TEKST)
  })
})
