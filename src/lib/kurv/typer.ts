// Handlekurven slik flaten ser den – lik for lokal kurv (prototype) og WooCommerce-kurv (Store API).

import type { Ore } from '@/lib/woocommerce/typer'

export type Kurvmodus = 'lokal' | 'woocommerce'

export interface Kurvlinje {
  /** Lokal: `produktId:variantId`. WooCommerce: varelinjens nøkkel i Store API. */
  nokkel: string
  produktId: number
  variantId: number | null
  antall: number
  navn: string
  merke: string | null
  slug: string
  bilde: string | null
  /** Valgt variant i klartekst, f.eks. «Størrelse: 50 ml». */
  valg: string
  /** Pris per stk. nå (øre). */
  pris: Ore
  /** Ordinær pris per stk. når varen er på tilbud. */
  ordinaer: Ore | null
  maks: number
}

export type Kurvmelding =
  | { type: 'pris-endret'; navn: string; fra: Ore; til: Ore }
  | { type: 'utsolgt'; navn: string }
  | { type: 'antall-justert'; navn: string; antall: number }
  | { type: 'fjernet'; navn: string }
  /** Melding fra WooCommerce (f.eks. at en vare er utsolgt), slik WooCommerce skriver den. */
  | { type: 'tekst'; tekst: string }

export interface Kurv {
  modus: Kurvmodus
  linjer: Kurvlinje[]
  antall: number
  /** Sum varer inkl. mva. Frakt og rabatter regnes av WooCommerce i kassen. */
  delsum: Ore
  meldinger: Kurvmelding[]
}

export interface LeggTil {
  produktId: number
  variantId: number | null
  antall: number
}
