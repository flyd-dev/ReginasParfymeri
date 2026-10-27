// Menyen bygges fra kategoritreet i WooCommerce, så nye kategorier dukker opp av seg selv.
// Bare det menyen trenger sendes til nettleseren.

import { antallTekst, fraKroner, kroner } from '@/lib/format'
import { bestselgere, produkterIKategori } from '@/lib/katalog/sporring'
import type { Kategori, Katalog } from '@/lib/woocommerce/typer'

export interface Menypunkt {
  navn: string
  sti: string[]
  antall: number
  barn: Menypunkt[]
}

/** Én vare i megamenyens bildekolonne. */
export interface Menyprodukt {
  slug: string
  merke: string | null
  navn: string
  bilde: string
  pris: string
}

/** Rekkefølgen i hovedmenyen. Nisjeduft er butikkens profil, derfor Duft først. Ukjente kategorier kommer sist. */
const REKKEFOLGE = ['duft', 'hudpleie', 'makeup', 'har', 'herre', 'tilbehor', 'accessories']

function punkt(k: Kategori, dybde: number): Menypunkt {
  return {
    navn: k.navn,
    sti: k.sti,
    antall: k.antall,
    barn: dybde > 1 ? k.barn.filter((b) => b.antall > 0).map((b) => punkt(b, dybde - 1)) : [],
  }
}

export function lagMeny(k: Katalog): Menypunkt[] {
  const plass = (slug: string) => {
    const i = REKKEFOLGE.indexOf(slug)
    return i === -1 ? REKKEFOLGE.length : i
  }
  return [...k.kategorier]
    .filter((c) => c.antall > 0)
    .sort((a, b) => plass(a.slug) - plass(b.slug) || b.antall - a.antall)
    .map((c) => punkt(c, 3))
}

/**
 * Andrelinjen under et menypunkt: underkategoriene når de finnes, ellers antall produkter. Bare data fra
 * kategoritreet – ingen beskrivelser vi har funnet på.
 */
export function menybeskrivelse(p: Menypunkt): string {
  if (p.barn.length > 0) return p.barn.map((b) => b.navn).join(' · ')
  return antallTekst(p.antall, 'produkt', 'produkter')
}

/**
 * Hovedkategoriens mest solgte vare som kan kjøpes og har bilde – fra WooCommerces popularitet (total_sales),
 * aldri et redaksjonelt valg. Nøkkelen er kategoriens slug. Kategorier uten tall for popularitet får ingen vare.
 */
export function mestSolgtIMenyen(k: Katalog): Record<string, Menyprodukt> {
  const ut: Record<string, Menyprodukt> = {}
  for (const c of k.kategorier) {
    const [p] = bestselgere(
      produkterIKategori(k, [c.slug]).filter((p) => p.bilder.length > 0),
      1,
    )
    const bilde = p?.bilder[0]?.src
    if (!p || !bilde) continue
    ut[c.slug] = {
      slug: p.slug,
      merke: p.merke?.navn ?? null,
      navn: p.visningsnavn,
      bilde,
      pris: p.prisspenn ? fraKroner(p.prisspenn.fra) : kroner(p.pris.pris),
    }
  }
  return ut
}
