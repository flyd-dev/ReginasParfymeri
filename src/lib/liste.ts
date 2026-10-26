import type { Katalog, Kategori, Produkt } from './katalog/typer'
import type { Listetilstand } from './katalog/listeurl'
import {
  fasetter,
  filtrer,
  lesFiltre,
  side,
  sorter,
  type Fasetter,
  type Sokeparametre,
} from './katalog/sporring'
import { tilKort, type Kortdata } from './visning'

export interface Listeresultat {
  tilstand: Listetilstand
  fasetter: Fasetter
  produkter: Kortdata[]
  totalt: number
  flere: boolean
}

/** Filtrer, sorter og del opp en grunnmengde produkter etter parametrene i adressen. */
export function byggListe(
  k: Katalog,
  grunnlag: Produkt[],
  parametre: Sokeparametre,
  underkategorier: Kategori[],
  sokeord?: string,
): Listeresultat {
  const { filtre, sortering, side: nr } = lesFiltre(parametre, sokeord !== undefined ? 'relevans' : 'nyeste')
  const filtrert = filtrer(grunnlag, filtre, k)
  // «Mest relevant» beholder rekkefølgen fra søket.
  const sortert = sortering === 'relevans' ? filtrert : sorter(filtrert, sortering)
  const { elementer, flere } = side(sortert, nr)
  return {
    tilstand: { filtre, sortering, side: nr, sok: sokeord },
    fasetter: fasetter(grunnlag, filtre, k, underkategorier),
    produkter: elementer.map(tilKort),
    totalt: sortert.length,
    flere,
  }
}
