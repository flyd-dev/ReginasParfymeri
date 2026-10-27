import { beforeAll, describe, expect, it } from 'vitest'
import { FORSIDE } from '@/content/forside'
import { lesJsonKatalog } from '@/lib/woocommerce/json-kilde'
import type { Katalog } from '@/lib/woocommerce/typer'
import { finnKategori } from '@/lib/katalog/sporring'
import {
  antallNisjedufter,
  baandmerker,
  heroprodukt,
  innganger,
  nisjemerker,
  nyttINisjeduft,
  ovrigeKategorier,
  utdrag,
  utstilling,
} from './forside'

let k: Katalog
beforeAll(async () => {
  k = await lesJsonKatalog()
})

describe('forsidens redaksjonelle valg', () => {
  it('alle valgte produkter finnes og kan kjøpes nå', () => {
    for (const slug of [FORSIDE.hero, ...FORSIDE.utstilling, ...FORSIDE.innganger.map((i) => i.produkt)]) {
      expect(k.produkter.find((p) => p.slug === slug)?.kjopbar, slug).toBe(true)
    }
  })
  it('gir hero, utstilling og fire innganger', () => {
    expect(heroprodukt(k)?.slug).toBe(FORSIDE.hero)
    expect(utstilling(k)).toHaveLength(5)
    expect(innganger(k).map((i) => i.navn)).toEqual(['Nisjeduft', 'Hudpleie', 'Makeup', 'Herre'])
  })
  it('nytt i nisjeduft er bare duft, nyeste først', () => {
    const nytt = nyttINisjeduft(k, 10)
    expect(nytt).toHaveLength(10)
    expect(nytt.every((p) => p.kategorier.some((c) => c.sti[0] === 'duft'))).toBe(true)
    const datoer = nytt.slice(0, 5).map((p) => p.opprettet ?? '')
    expect(datoer).toEqual([...datoer].sort().reverse())
  })
  it('utdraget kuttes ved setningsslutt og finner aldri på tekst', () => {
    expect(utdrag('Kort tekst.')).toBe('Kort tekst.')
    const lang = 'Første setning er her. ' + 'Ord '.repeat(80)
    expect(utdrag(lang, 40)).toBe('Første setning er her.')
    expect(utdrag(lang, 120).endsWith(' …')).toBe(true)
    expect(utdrag('')).toBe('')
  })
})

describe('nisjemerker og øvrige kategorier', () => {
  it('slår opp merkene Regina nevner, med merkets mest solgte vare', () => {
    const merker = nisjemerker(k)
    expect(merker.length).toBeGreaterThanOrEqual(5)
    for (const m of merker) {
      expect(k.merker.some((x) => x.slug === m.slug)).toBe(true)
      if (m.produkt) expect(k.produkter.find((p) => p.slug === m.produkt?.slug)?.merke?.slug).toBe(m.slug)
    }
  })
  it('lenkeraden har ikke kategoriene som har egen flis', () => {
    const navn = ovrigeKategorier(k).map((c) => c.navn)
    expect(navn).not.toContain('Hudpleie')
    expect(navn).toContain('Duft')
  })
})

describe('tall og merker i heroen og merkebåndet', () => {
  it('antall nisjedufter er WooCommerces telling for kategorien – ikke et påfunnet tall', () => {
    const antall = antallNisjedufter(k)
    expect(antall).toBe(finnKategori(k, ['duft', 'nisjeduft'])?.antall)
    expect(antall).toBeGreaterThan(0)
    expect(antallNisjedufter({ ...k, kategorier: [] })).toBeNull()
  })
  it('merkebåndet har de største merkene først og ingen merke i begge radene', () => {
    const [forste, andre] = baandmerker(k, 16)
    expect(forste).toHaveLength(16)
    expect(andre.length).toBeGreaterThan(0)
    const alle = [...forste, ...andre]
    expect(new Set(alle.map((m) => m.slug)).size).toBe(alle.length)
    expect(alle.map((m) => m.antall)).toEqual([...alle.map((m) => m.antall)].sort((a, b) => b - a))
    for (const m of alle) expect(k.merker).toContainEqual(m)
  })
})
