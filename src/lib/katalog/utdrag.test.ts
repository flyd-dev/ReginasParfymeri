// Kontroll av det lagrede utdraget i data/katalog. Feiler en ny henting her, skal den ikke sjekkes inn.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Katalog } from './typer'

const katalog = JSON.parse(
  readFileSync(path.join(process.cwd(), 'data', 'katalog', 'katalog.json'), 'utf8'),
) as Katalog

describe('katalogutdraget', () => {
  it('har metadata om kilde og tidspunkt', () => {
    expect(katalog.meta.kilde).toBe('utdrag')
    expect(katalog.meta.butikk).toMatch(/^https:\/\//)
    expect(Number.isNaN(Date.parse(katalog.meta.hentet))).toBe(false)
    expect(katalog.meta.antallProdukter).toBe(katalog.produkter.length)
  })

  it('har unike produkt-ID-er og slugger', () => {
    expect(new Set(katalog.produkter.map((p) => p.id)).size).toBe(katalog.produkter.length)
    expect(new Set(katalog.produkter.map((p) => p.slug)).size).toBe(katalog.produkter.length)
  })

  it('har bare heltallsbeløp i øre', () => {
    for (const p of katalog.produkter) {
      expect(Number.isSafeInteger(p.pris.pris), p.slug).toBe(true)
      for (const v of p.varianter) expect(Number.isSafeInteger(v.pris.pris), `${p.slug}/${v.id}`).toBe(true)
    }
  })

  it('har varianter med verdier som finnes i produktets egenskaper', () => {
    for (const p of katalog.produkter.filter((x) => x.type === 'variabel')) {
      expect(p.varianter.length, p.slug).toBeGreaterThan(0)
      for (const v of p.varianter) {
        for (const [navn, verdi] of Object.entries(v.valg)) {
          const egenskap = p.egenskaper.find((e) => e.navn === navn)
          expect(egenskap, `${p.slug}: ${navn}`).toBeDefined()
          expect(
            egenskap?.verdier.map((x) => x.verdi),
            `${p.slug}: ${verdi}`,
          ).toContain(verdi)
        }
      }
      // To varianter med samme valg ville gjort valget i flaten tvetydig.
      const nokler = p.varianter.map((v) => JSON.stringify(v.valg))
      expect(new Set(nokler).size, p.slug).toBe(nokler.length)
    }
  })

  it('peker bare på kategorier og merker som finnes', () => {
    const kategorier = new Set(katalog.kategorier.map((k) => k.id))
    const merker = new Set(katalog.merker.map((m) => m.id))
    for (const p of katalog.produkter) {
      for (const k of p.kategorier) expect(kategorier.has(k), p.slug).toBe(true)
      if (p.merke) expect(merker.has(p.merke.id), p.slug).toBe(true)
    }
  })
})
