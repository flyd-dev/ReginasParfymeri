// Felles regler for å gjøre WooCommerce-data om til domenemodellen. Brukes av begge kildene, så
// pris, lager og varianter oppfører seg likt enten data kommer fra products.json eller Store API.

import type { KategoriRef, Lager, Ore, Pris, Variant } from './typer'

/** Kroner som desimaltall → heltall øre. Avrunder bort flyttallsstøy (949.0000001 → 94900). */
export function tilOre(kroner: number): Ore {
  return Math.round(kroner * 100)
}

/** Pris fra nåpris, ordinærpris og WooCommerces tilbudsflagg. Tilbud bare når prisen faktisk er lavere. */
export function lagPris(pris: Ore, ordinaer: Ore | null, paaTilbud: boolean): Pris {
  const ord = ordinaer && ordinaer > 0 ? ordinaer : pris
  const tilbud = paaTilbud && pris < ord
  return { pris, ordinaer: tilbud ? ord : pris, tilbud }
}

/** Lagerstatus slik WooCommerce melder den: utsolgt, få igjen (lav beholdning) eller på lager. */
export function lagLager(paaLager: boolean, lavBeholdning: number | null | undefined, tekst?: string): Lager {
  if (!paaLager) return { status: 'utsolgt', antall: null, tekst: tekst?.trim() || 'Utsolgt' }
  if (typeof lavBeholdning === 'number' && lavBeholdning > 0) {
    return { status: 'fa-igjen', antall: lavBeholdning, tekst: tekst?.trim() || `${lavBeholdning} på lager` }
  }
  return { status: 'pa-lager', antall: null, tekst: tekst?.trim() ?? '' }
}

/** WooCommerce oppgir 9999 når beholdningen ikke styres. Flaten trenger ikke mer enn dette i én kurv. */
export const MAKS_I_KURV = 20

export function lagMaks(maks: number | null | undefined, paaLager: boolean): number {
  if (!paaLager) return 0
  if (typeof maks !== 'number' || maks <= 0) return MAKS_I_KURV
  return Math.min(maks, MAKS_I_KURV)
}

/**
 * Samlet pris, prisspenn og lager for et variabelt produkt. Doble variasjoner (`duplikatAv`) teller ikke –
 * WooCommerce bruker den første med samme valg.
 */
export function sammenstillVarianter(varianter: Variant[]): {
  pris: Pris | null
  prisspenn: { fra: Ore; til: Ore } | null
  lager: Lager
  kjopbar: boolean
  maks: number
} {
  const gyldige = varianter.filter((v) => v.duplikatAv === null)
  const kjopbare = gyldige.filter((v) => v.kjopbar)
  const grunnlag = kjopbare.length > 0 ? kjopbare : gyldige
  if (grunnlag.length === 0) {
    return { pris: null, prisspenn: null, lager: lagLager(false, null), kjopbar: false, maks: 0 }
  }
  const billigste = grunnlag.reduce((a, b) => (b.pris.pris < a.pris.pris ? b : a))
  const priser = grunnlag.map((v) => v.pris.pris)
  const fra = Math.min(...priser)
  const til = Math.max(...priser)
  const lager: Lager =
    kjopbare.length > 0 ? { status: 'pa-lager', antall: null, tekst: '' } : lagLager(false, null)
  return {
    pris: billigste.pris,
    prisspenn: fra !== til ? { fra, til } : null,
    lager,
    kjopbar: kjopbare.length > 0,
    maks: Math.max(0, ...kjopbare.map((v) => v.maks)),
  }
}

/** Kategorinavn står i VERSALER i WooCommerce. I flaten vises de i normal skrift; slugen beholdes. */
export function kategorinavn(navn: string): string {
  const ren = navn.trim()
  if (/\p{Ll}/u.test(ren)) return ren
  const liten = ren.toLocaleLowerCase('nb-NO')
  return liten.charAt(0).toLocaleUpperCase('nb-NO') + liten.slice(1)
}

/** Den dypeste kategorien (lengst sti); ved likhet den første. */
export function velgHovedkategori(kategorier: KategoriRef[]): KategoriRef | null {
  return kategorier.reduce<KategoriRef | null>(
    (beste, k) => (!beste || k.sti.length > beste.sti.length ? k : beste),
    null,
  )
}
