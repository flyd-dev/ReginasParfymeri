// Menyen bygges fra kategoritreet i WooCommerce, så nye kategorier dukker opp av seg selv.
// Bare det menyen trenger sendes til nettleseren.

import type { Kategori, Katalog } from '@/lib/woocommerce/typer'

export interface Menypunkt {
  navn: string
  sti: string[]
  antall: number
  barn: Menypunkt[]
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
