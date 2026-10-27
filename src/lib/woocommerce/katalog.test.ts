// Tester begge kildene mot ekte data i repoet: data/products.json (json) og raw/*.json (Store API-format).
// Samme produkt skal gi samme pris, lager og varianter uansett kilde.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { lesJsonKatalog } from './json-kilde'
import { lagLager, lagPris, sammenstillVarianter, tilOre, kategorinavn } from './mapping'
import { belop, byggKatalog, rensBeskrivelse, stiFraLenke, type StoreRaadata } from './store-kilde'
import type { StoreProdukt } from './store-format'
import type { Katalog, Variant } from './typer'

const rot = process.cwd()
const les = <T>(fil: string): T => JSON.parse(readFileSync(path.join(rot, fil), 'utf8')) as T

let json: Katalog
let store: Katalog

beforeAll(async () => {
  json = await lesJsonKatalog()
  const variasjoner = les<Record<string, StoreProdukt>>('raw/variations_raw.json')
  const raa: StoreRaadata = {
    produkter: les<StoreProdukt[]>('raw/all_products_raw.json'),
    variasjoner: Object.values(variasjoner),
    kategorier: [],
    popularitet: les<number[]>('raw/popularity_raw.json'),
    produktmeta: les('raw/product_meta_raw.json'),
    pwbMerker: les('raw/pwb_brands_raw.json'),
  }
  store = byggKatalog(raa, '2026-10-27T00:00:00Z')
})

describe('reglene i mapping.ts', () => {
  it('gjør kroner om til hele øre uten flyttallsfeil', () => {
    expect(tilOre(949)).toBe(94900)
    expect(tilOre(0.1 + 0.2)).toBe(30)
    expect(tilOre(2645.5)).toBe(264550)
  })
  it('regner tilbud bare når prisen faktisk er lavere', () => {
    expect(lagPris(28000, 84000, true)).toEqual({ pris: 28000, ordinaer: 84000, tilbud: true })
    expect(lagPris(9900, 9900, true)).toEqual({ pris: 9900, ordinaer: 9900, tilbud: false })
    expect(lagPris(9900, 12900, false)).toEqual({ pris: 9900, ordinaer: 9900, tilbud: false })
  })
  it('skiller utsolgt, få igjen og på lager', () => {
    expect(lagLager(false, null).status).toBe('utsolgt')
    expect(lagLager(true, 1, '1 på lager')).toEqual({ status: 'fa-igjen', antall: 1, tekst: '1 på lager' })
    expect(lagLager(true, null).status).toBe('pa-lager')
  })
  it('ser bort fra doble variasjoner i pris og lager', () => {
    const v = (id: number, pris: number, kjopbar: boolean, duplikatAv: number | null = null): Variant => ({
      id,
      valg: {},
      sku: '',
      pris: lagPris(pris, null, false),
      lager: lagLager(kjopbar, null),
      kjopbar,
      maks: kjopbar ? 5 : 0,
      bilde: null,
      duplikatAv,
    })
    const samlet = sammenstillVarianter([v(1, 50000, true), v(2, 10000, true, 1), v(3, 90000, false)])
    expect(samlet.pris?.pris).toBe(50000)
    expect(samlet.prisspenn).toBeNull()
    expect(samlet.kjopbar).toBe(true)
  })
  it('viser kategorinavn i normal skrift', () => {
    expect(kategorinavn('NISJEDUFT')).toBe('Nisjeduft')
    expect(kategorinavn('ØYE OG LEPPEPRODUKTER')).toBe('Øye og leppeprodukter')
    expect(kategorinavn('BODY LOTION & OLJE')).toBe('Body lotion & olje')
  })
})

describe('json-kilden (data/products.json)', () => {
  it('har alle 1 082 produktene, 7 hovedkategorier og 78 merker', () => {
    expect(json.produkter).toHaveLength(1082)
    expect(json.kategorier).toHaveLength(7)
    expect(json.merker).toHaveLength(78)
  })
  it('har bare heltall øre og positive priser', () => {
    for (const p of json.produkter) {
      expect(Number.isSafeInteger(p.pris.pris), p.slug).toBe(true)
      expect(p.pris.pris, p.slug).toBeGreaterThan(0)
      for (const v of p.varianter) expect(Number.isSafeInteger(v.pris.pris), `${p.slug} ${v.id}`).toBe(true)
    }
  })
  it('gir variable produkter varianter med egen pris og lager', () => {
    const variable = json.produkter.filter((p) => p.type === 'variabel')
    expect(variable).toHaveLength(101)
    expect(variable.flatMap((p) => p.varianter)).toHaveLength(240)
    const sideEffect = json.produkter.find((p) => p.slug.includes('side-effect'))
    expect(sideEffect?.varianter.length).toBeGreaterThan(1)
  })
  it('merker de fem doble variasjonene', () => {
    expect(json.produkter.flatMap((p) => p.varianter).filter((v) => v.duplikatAv !== null)).toHaveLength(5)
  })
  it('teller utsolgte og tilbud som WooCommerce, med lager for variable produkter fra variantene', () => {
    // WooCommerce melder 124 utsolgte. Én av dem (Martinelia Little Dinosaur) er variabel med begge
    // variantene på lager – foreldrestatusen er utdatert. Variantene avgjør (meldt i docs/data-issues.md).
    expect(json.produkter.filter((p) => p.lager.status === 'utsolgt')).toHaveLength(123)
    expect(json.produkter.find((p) => p.id === 4545)?.kjopbar).toBe(true)
    expect(json.produkter.filter((p) => p.pris.tilbud)).toHaveLength(5)
  })
  it('bruker merkefeltet, ikke prefikset i navnet', () => {
    const p = json.produkter.find(
      (x) => x.navn.startsWith('PARFUMES DE MARLEY') || x.navn.startsWith('FUGUAZZI'),
    )
    expect(p?.merke?.navn).toMatch(/Parfums de Marly|Fugazzi/)
    expect(p?.visningsnavn).not.toMatch(/MARLEY|FUGUAZZI/)
  })
  it('gir alle bilder en alt-tekst', () => {
    for (const p of json.produkter) for (const b of p.bilder) expect(b.alt.length, p.slug).toBeGreaterThan(0)
  })
})

describe('Store API-kilden gir det samme som json-kilden', () => {
  it('har like mange produkter', () => {
    expect(store.produkter).toHaveLength(json.produkter.length)
  })
  it('gir samme pris, lager, varianter og kategoristi for hvert produkt', () => {
    const perId = new Map(json.produkter.map((p) => [p.id, p]))
    for (const s of store.produkter) {
      const j = perId.get(s.id)
      expect(j, String(s.id)).toBeDefined()
      if (!j) continue
      expect(s.pris, s.slug).toEqual(j.pris)
      expect(s.prisspenn, s.slug).toEqual(j.prisspenn)
      expect(s.lager.status, s.slug).toBe(j.lager.status)
      expect(s.kjopbar, s.slug).toBe(j.kjopbar)
      expect(s.varianter.map((v) => [v.id, v.pris.pris, v.kjopbar, v.duplikatAv])).toEqual(
        j.varianter.map((v) => [v.id, v.pris.pris, v.kjopbar, v.duplikatAv]),
      )
      expect(s.hovedkategori?.sti, s.slug).toEqual(j.hovedkategori?.sti)
      expect(s.bilder.map((b) => b.src)).toEqual(j.bilder.map((b) => b.src))
    }
  })
})

describe('hjelpere for Store API', () => {
  it('leser beløp i minste enhet', () => {
    expect(belop('264500', 2)).toBe(264500)
    expect(belop('2645', 0)).toBe(264500)
    expect(belop(undefined, 2)).toBe(0)
  })
  it('leser kategoristien fra lenken', () => {
    expect(stiFraLenke('https://nettbutikk.reginaparfymeri.no/produktkategori/duft/nisjeduft/')).toEqual([
      'duft',
      'nisjeduft',
    ])
  })
  it('gjør beskrivelses-HTML om til ren tekst uten tagger', () => {
    expect(rensBeskrivelse('<p>En &amp; to</p><p>Tre<br/>fire</p><script>x</script>')).toBe(
      'En & to\nTre\nfire\nx',
    )
  })
})
