import { beforeAll, describe, expect, it } from 'vitest'
import { bestselgere, produkterIKategori } from '@/lib/katalog/sporring'
import { lesJsonKatalog } from '@/lib/woocommerce/json-kilde'
import type { Katalog } from '@/lib/woocommerce/typer'
import { FORSIDE } from '@/content/forside'
import { lagMeny, menybeskrivelse, menyutvalg } from './meny'

let k: Katalog
beforeAll(async () => {
  k = await lesJsonKatalog()
})

describe('megamenyen', () => {
  it('andrelinjen er underkategoriene eller antall produkter – ingen påfunnet tekst', () => {
    const duft = lagMeny(k).find((m) => m.sti[0] === 'duft')
    const nisje = duft?.barn.find((b) => b.sti[1] === 'nisjeduft')
    expect(nisje && menybeskrivelse(nisje)).toMatch(/^\d[\d\s]* produkter$/)
    const hudpleie = lagMeny(k).find((m) => m.sti[0] === 'hudpleie')
    const kropp = hudpleie?.barn.find((b) => b.barn.length > 0)
    expect(kropp && menybeskrivelse(kropp)).toBe(kropp?.barn.map((b) => b.navn).join(' · '))
    expect(menybeskrivelse({ navn: 'X', sti: ['x'], antall: 1, barn: [] })).toBe('1 produkt')
  })

  it('bildekolonnen viser Flyds valg eller kategoriens mest solgte vare – og sier hvilken', () => {
    const utvalg = menyutvalg(k)
    expect(Object.keys(utvalg).length).toBeGreaterThan(0)
    for (const [slug, valgt] of Object.entries(FORSIDE.meny)) {
      expect(utvalg[slug]).toMatchObject({ slug: valgt, kilde: 'utvalgt' })
    }
    for (const [slug, vare] of Object.entries(utvalg)) {
      if (vare.kilde === 'utvalgt') continue
      const forventet = bestselgere(
        produkterIKategori(k, [slug]).filter((p) => p.bilder.length > 0),
        1,
      )[0]
      expect(vare.slug).toBe(forventet?.slug)
      const p = k.produkter.find((x) => x.slug === vare.slug)
      expect(p?.kjopbar).toBe(true)
      expect(p?.popularitet).not.toBeNull()
      expect(vare.pris).toMatch(/^(fra\s)?kr\s\d/)
    }
  })
})
