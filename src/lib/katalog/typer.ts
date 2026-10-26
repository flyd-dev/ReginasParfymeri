// Domenemodellen for katalogen. Alt UI-et ser, går gjennom disse typene –
// aldri rå WooCommerce-format. Mappingen ligger i `woo/mapping.ts`.

/** Beløp i minste enhet (øre), alltid heltall. */
export type Ore = number

export interface Pris {
  /** Prisen kunden betaler nå (inkl. mva., slik WooCommerce viser den). */
  pris: Ore
  /** Ordinær pris. Lik `pris` når varen ikke er på tilbud. */
  ordinaer: Ore
  /** Sant bare når WooCommerce selv sier at varen er på tilbud. */
  tilbud: boolean
  valuta: string
}

/**
 * Hvordan produktbildet er tatt. Måles i bildet ved henting (`scripts/hent-katalog.ts`),
 * slik at hvite pakkebilder kan vises på en flate i bildets egen farge – uten filter
 * som endrer fargen på produktet.
 */
export type Bildebakgrunn = 'hvit' | 'transparent' | 'flat' | 'foto' | 'ukjent'

export interface Bilde {
  src: string
  /** Mindre utgave fra WooCommerce (300 px). */
  miniatyr: string
  alt: string
  bakgrunn: Bildebakgrunn
  /** Målt bakgrunnsfarge (#rrggbb) for `hvit` og `flat`. */
  flate: string | null
}

export type Lagerstatus = 'pa-lager' | 'fa-igjen' | 'utsolgt' | 'restordre'

export interface Lager {
  status: Lagerstatus
  /** Antall på lager når WooCommerce oppgir det (bare ved lav beholdning). */
  antall: number | null
  /** WooCommerces egen tekst, f.eks. «1 på lager». Tom når butikken ikke viser antall. */
  tekst: string
}

export interface Egenskapsverdi {
  /** Verdien slik variasjonen lagrer den (slug), f.eks. `50ml`. */
  verdi: string
  /** Pent navn for visning, f.eks. `50 ml`. */
  visning: string
}

export interface Egenskap {
  navn: string
  taksonomi: string
  verdier: Egenskapsverdi[]
}

export interface Variant {
  id: number
  /** Én verdi per variantegenskap, i samme rekkefølge som produktets egenskaper. */
  valg: Record<string, string>
  beskrivelse: string
  pris: Pris
  lager: Lager
  kjopbar: boolean
  sku: string
  /** Høyeste antall WooCommerce tillater i én handlekurv. */
  maks: number
}

export interface Duftnoter {
  topp: string[]
  hjerte: string[]
  bunn: string[]
}

export type Innholdsblokk =
  | { type: 'avsnitt'; tekst: string }
  | { type: 'overskrift'; tekst: string }
  | { type: 'liste'; punkter: string[] }

export interface MerkeRef {
  id: number
  navn: string
  slug: string
}

export interface Merke extends MerkeRef {
  antall: number
}

export interface Kategori {
  id: number
  navn: string
  slug: string
  forelder: number | null
  antall: number
}

export type Produkttype = 'enkel' | 'variabel'

export interface Produkt {
  id: number
  slug: string
  /** Navnet slik det står i WooCommerce (dekodet). */
  navn: string
  /** Navn uten merkeprefiks og med rolig versalbruk – brukes i flaten. */
  visningsnavn: string
  merke: MerkeRef | null
  type: Produkttype
  kategorier: number[]
  /** Pris for enkle produkter; laveste pris for variable. */
  pris: Pris
  /** For variable produkter med ulik pris: spennet. */
  prisspenn: { fra: Ore; til: Ore } | null
  lager: Lager
  kjopbar: boolean
  maks: number
  sku: string
  bilder: Bilde[]
  beskrivelse: Innholdsblokk[]
  duftnoter: Duftnoter | null
  egenskaper: Egenskap[]
  varianter: Variant[]
  /** Rekkefølgen i Store API-ets standardsortering (nyeste først). */
  rekkefolge: number
  /** Produktet i dagens nettbutikk. */
  lenke: string
}

export interface Katalog {
  produkter: Produkt[]
  kategorier: Kategori[]
  merker: Merke[]
  meta: Katalogmeta
}

export interface Katalogmeta {
  kilde: 'utdrag' | 'live'
  butikk: string
  hentet: string
  antallProdukter: number
}
