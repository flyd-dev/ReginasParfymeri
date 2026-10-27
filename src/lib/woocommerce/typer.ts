// Domenemodellen for katalogen. Flaten ser bare disse typene – aldri products.json eller Store API-formatet.
// Kildene (json-kilde.ts og store-kilde.ts) gjør om til denne modellen.

/** Beløp i øre (NOK inkl. mva.), alltid heltall – aldri flyttall i flaten. */
export type Ore = number

export interface Pris {
  /** Det kunden betaler nå. */
  pris: Ore
  /** Ordinær pris. Lik `pris` når varen ikke er på tilbud. */
  ordinaer: Ore
  /** Sant bare når WooCommerce sier at varen er på tilbud og prisen faktisk er lavere. */
  tilbud: boolean
}

export type Lagerstatus = 'pa-lager' | 'fa-igjen' | 'utsolgt'

export interface Lager {
  status: Lagerstatus
  /** Antall når WooCommerce oppgir lav beholdning, ellers null. */
  antall: number | null
  /** WooCommerces egen tekst, f.eks. «1 på lager». */
  tekst: string
}

export interface Bilde {
  src: string
  alt: string
}

export interface Egenskapsverdi {
  /** Verdien slik variasjonen lagrer den, f.eks. `50ml`. */
  slug: string
  /** Visningsnavnet, f.eks. `50ml`. */
  navn: string
}

export interface Egenskap {
  navn: string
  verdier: Egenskapsverdi[]
  /** Sant når egenskapen brukes til å velge variant (Størrelse, Farge). */
  variasjon: boolean
}

export interface Variant {
  id: number
  /** Egenskapsnavn → slug, f.eks. `{ Størrelse: '50ml' }`. */
  valg: Record<string, string>
  sku: string
  pris: Pris
  lager: Lager
  kjopbar: boolean
  /** Høyeste antall WooCommerce tillater i én handlekurv. */
  maks: number
  bilde: string | null
  /** Settes når en tidligere variasjon har samme valg. WooCommerce bruker den første. */
  duplikatAv: number | null
}

export interface MerkeRef {
  navn: string
  slug: string
}

export interface Merke extends MerkeRef {
  antall: number
}

export interface KategoriRef {
  slug: string
  navn: string
  /** Slugene fra toppen, f.eks. `['duft', 'nisjeduft']` → `/produktkategori/duft/nisjeduft/`. */
  sti: string[]
}

export interface Kategori extends KategoriRef {
  antall: number
  barn: Kategori[]
}

export type Produkttype = 'enkel' | 'variabel'

export interface Produkt {
  id: number
  slug: string
  /** Navnet slik det står i WooCommerce. */
  navn: string
  /** Navnet uten merkeprefiks og med rolig versalbruk – brukes i flaten sammen med merket. */
  visningsnavn: string
  merke: MerkeRef | null
  type: Produkttype
  sku: string
  /** Enkle produkter: prisen. Variable: laveste pris blant kjøpbare varianter. */
  pris: Pris
  /** Variable produkter med ulik pris: fra–til. */
  prisspenn: { fra: Ore; til: Ore } | null
  lager: Lager
  kjopbar: boolean
  maks: number
  kortBeskrivelse: string
  /** Ren tekst; avsnitt skilt med tom linje. Tom når WooCommerce ikke har beskrivelse. */
  beskrivelse: string
  kategorier: KategoriRef[]
  /** Den dypeste kategorien – brukes i brødsmuler og «relaterte produkter». */
  hovedkategori: KategoriRef | null
  egenskaper: Egenskap[]
  varianter: Variant[]
  bilder: Bilde[]
  /** Produktsiden i dagens butikk (for 301 og kanonisk URL). */
  kildeUrl: string
  /** Publiseringsdato i WooCommerce (ISO), når den er kjent. */
  opprettet: string | null
  /** Plass i WooCommerces «popularitet» (total_sales), 1 er mest solgt. */
  popularitet: number | null
}

export interface Katalog {
  produkter: Produkt[]
  kategorier: Kategori[]
  merker: Merke[]
  kilde: 'json' | 'woocommerce'
  /** Når dataene ble hentet (ISO). */
  hentet: string
}
