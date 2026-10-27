import { beforeAll, describe, expect, it } from 'vitest'
import { lesJsonKatalog } from '@/lib/woocommerce/json-kilde'
import type { Katalog } from '@/lib/woocommerce/typer'
import {
  TOMME_FILTRE,
  bestselgere,
  erNyhet,
  fasetter,
  filtrer,
  finnKategori,
  hurtigkjop,
  kategorikjede,
  lagSokeindeks,
  lesListetilstand,
  listeUrl,
  produkterIKategori,
  relaterte,
  sok,
  sokKategorier,
  sokMerker,
  sorter,
  variantverdi,
} from './sporring'

let k: Katalog
beforeAll(async () => {
  k = await lesJsonKatalog()
})

describe('kategorier', () => {
  it('finner kategori etter sti og gir kjeden til brødsmuler', () => {
    expect(finnKategori(k, ['duft', 'nisjeduft'])?.navn).toBe('Nisjeduft')
    expect(kategorikjede(k, ['duft', 'nisjeduft']).map((c) => c.navn)).toEqual(['Duft', 'Nisjeduft'])
    expect(finnKategori(k, ['duft', 'finnes-ikke'])).toBeUndefined()
  })
  it('tar med underkategorier i en hovedkategori', () => {
    expect(produkterIKategori(k, ['duft']).length).toBe(207)
    expect(produkterIKategori(k, ['duft', 'nisjeduft']).length).toBe(161)
  })
})

describe('filtre i adressen', () => {
  it('leser og skriver de samme filtrene', () => {
    const t = lesListetilstand({
      merke: 'creed,initio',
      pris: '1000-2000',
      lager: '1',
      sorter: 'nyeste',
      storrelse: '50-ml',
    })
    expect(t.filtre.merke).toEqual(['creed', 'initio'])
    expect(listeUrl('/produktkategori/duft/', t)).toBe(
      '/produktkategori/duft/?merke=creed%2Cinitio&pris=1000-2000&storrelse=50-ml&lager=1&sorter=nyeste',
    )
  })
  it('avviser ukjente prisintervaller og rare verdier', () => {
    const t = lesListetilstand({ pris: 'gratis', merke: '<script>' })
    expect(t.filtre.pris).toEqual([])
    expect(t.filtre.merke).toEqual([])
  })
  it('starter på side 1 når filtrene endres', () => {
    const t = lesListetilstand({ side: '3' })
    expect(listeUrl('/x/', t, { filtre: { ...t.filtre, lager: true } })).toBe('/x/?lager=1')
  })
})

describe('filtrering og fasetter', () => {
  it('filtrerer på merke, lager og størrelse og teller fasetter med de andre filtrene', () => {
    const base = produkterIKategori(k, ['duft'])
    const f = { ...TOMME_FILTRE, merke: ['creed'], lager: true }
    const treff = filtrer(base, f, ['duft'])
    expect(treff.length).toBeGreaterThan(0)
    expect(treff.every((p) => p.merke?.slug === 'creed' && p.lager.status !== 'utsolgt')).toBe(true)
    const fas = fasetter(base, f, k, finnKategori(k, ['duft'])?.barn ?? [], ['duft'])
    expect(fas.merke.find((m) => m.id === 'creed')?.valgt).toBe(true)
    expect(fas.storrelse.map((s) => s.navn.replace(/\u00a0/g, ' '))).toContain('50 ml')
    const femti = filtrer(base, { ...TOMME_FILTRE, storrelse: [variantverdi('50ml').id] }, ['duft'])
    expect(femti.length).toBeGreaterThan(0)
  })
  it('filtrerer på underkategori relativt til der listen står', () => {
    const base = produkterIKategori(k, ['duft'])
    expect(filtrer(base, { ...TOMME_FILTRE, kategori: ['nisjeduft'] }, ['duft']).length).toBe(161)
  })
  it('sorterer utsolgte sist og etter pris', () => {
    const s = sorter(produkterIKategori(k, ['duft']), 'populare')
    const forsteUtsolgt = s.findIndex((p) => p.lager.status === 'utsolgt')
    expect(s.slice(forsteUtsolgt).every((p) => p.lager.status === 'utsolgt')).toBe(true)
    const pris = sorter(produkterIKategori(k, ['duft']), 'pris-stigende').map((p) => p.pris.pris)
    expect(pris).toEqual([...pris].sort((a, b) => a - b))
  })
})

describe('hurtigkjøp', () => {
  it('bare når valget er entydig', () => {
    const enkel = k.produkter.find((p) => p.type === 'enkel' && p.kjopbar)
    const flere = k.produkter.find(
      (p) => p.type === 'variabel' && p.varianter.filter((v) => v.kjopbar).length > 1,
    )
    const utsolgt = k.produkter.find((p) => !p.kjopbar)
    expect(enkel && hurtigkjop(enkel)).toEqual({ variantId: null })
    expect(flere && hurtigkjop(flere)).toBeNull()
    expect(utsolgt && hurtigkjop(utsolgt)).toBeNull()
  })
})

describe('nyheter, bestselgere og relaterte', () => {
  it('kaller bare noe nyhet når WooCommerce-datoen er ny nok', () => {
    const p = k.produkter.find((x) => x.opprettet)
    expect(p && erNyhet(p, new Date(p.opprettet ?? ''), 60)).toBe(true)
    expect(p && erNyhet(p, new Date('2100-01-01'), 60)).toBe(false)
  })
  it('bestselgere følger WooCommerces popularitet og er kjøpbare', () => {
    const b = bestselgere(produkterIKategori(k, ['duft', 'nisjeduft']), 8)
    expect(b).toHaveLength(8)
    expect(b.every((p) => p.kjopbar)).toBe(true)
  })
  it('relaterte deler merke eller kategori og er aldri produktet selv', () => {
    const p = k.produkter.find((x) => x.merke?.slug === 'creed')
    if (!p) throw new Error('mangler Creed')
    const r = relaterte(k, p)
    expect(r.length).toBeGreaterThan(0)
    expect(r.some((x) => x.id === p.id)).toBe(false)
  })
})

describe('søk', () => {
  const indeks = () => lagSokeindeks(k)
  it('finner merke + produktnavn', () => {
    const treff = sok(indeks(), 'creed aventus')
    expect(treff[0]?.merke?.slug).toBe('creed')
    expect(treff[0]?.visningsnavn.toLowerCase()).toContain('aventus')
  })
  it('tåler aksenter og store bokstaver', () => {
    expect(sok(indeks(), 'LOWENGRIP').length).toBeGreaterThan(0)
    expect(sokMerker(k, 'löwen')[0]?.navn).toBe('Löwengrip')
  })
  it('finner kategorier', () => {
    expect(sokKategorier(k, 'nisje')[0]?.navn).toBe('Nisjeduft')
  })
  it('gir tomt svar på tomt søk', () => {
    expect(sok(indeks(), '   ')).toEqual([])
  })
})
