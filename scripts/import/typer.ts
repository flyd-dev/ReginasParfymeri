// Typer for importen til staging-WooCommerce: kildefilene slik de ligger i repoet, den normaliserte
// kilden, det som allerede finnes i staging (lest med GET), og planen som binder dem sammen.

// ---------------------------------------------------------------------------------------------
// Kildefilene (bare feltene importen bruker)
// ---------------------------------------------------------------------------------------------

export interface ProduktJson {
  id: number
  name: string
  slug: string
  brand: string | null
  brand_slug: string | null
  type: string
  sku: string | null
  price: number | null
  regular_price: number | null
  sale_price: number | null
  on_sale: boolean
  in_stock: boolean
  on_backorder?: boolean
  low_stock_remaining: number | null
  max_quantity: number
  stock_text: string
  short_description: string
  description: string
  categories: { slug: string; name: string; path: string[]; path_slugs: string[] }[]
  attributes: { name: string; options: string[]; option_slugs: string[]; variation: boolean }[]
  variations: VariasjonJson[]
  images: { src: string; thumbnail?: string; alt: string; name?: string }[]
  source_url: string
  date_created: string
  legacy_brand: { name: string; slug: string } | null
}

export interface VariasjonJson {
  id: number
  attributes: Record<string, string>
  attribute_labels: Record<string, string>
  sku: string | null
  price: number | null
  regular_price: number | null
  sale_price: number | null
  on_sale: boolean
  in_stock: boolean
  low_stock_remaining: number | null
  stock_text: string
  max_quantity: number
  description: string
  image: string | null
  duplicate_of?: number
}

/** Variasjon i Store API-format fra `raw/variations_raw.json` (nøkkel = variasjons-ID). */
export interface VariasjonRaa {
  id: number
  parent: number
  sku: string | null
  on_sale: boolean
  prices: {
    price: string
    regular_price: string
    sale_price: string
    currency_code: string
    currency_minor_unit: number
  }
  is_in_stock: boolean
  is_on_backorder: boolean
  low_stock_remaining: number | null
  stock_availability: { text: string }
  sold_individually: boolean
  add_to_cart: { maximum: number }
}

export interface KategoriJson {
  slug: string
  name: string
  path: string
  product_count: number
  children: KategoriJson[]
}

export interface MerkeJson {
  name: string
  slug: string
  product_count: number
}

export interface KildeFiler {
  produkter: ProduktJson[]
  variasjonerRaa: Record<string, VariasjonRaa>
  kategorier: KategoriJson[]
  merker: MerkeJson[]
}

// ---------------------------------------------------------------------------------------------
// Normalisert kilde
// ---------------------------------------------------------------------------------------------

export type Lagerstatus = 'instock' | 'outofstock' | 'onbackorder'

/**
 * Lageret slik vi kan beskrive det ærlig ut fra kilden:
 * - `antall`: kilden gir et faktisk antall → lagerstyring med det antallet.
 * - `status`: bare på lager / utsolgt er kjent → ingen lagerstyring, bare status.
 * - `variantene`: variabelt produkt – lageret ligger på variantene, WooCommerce avleder status.
 */
export type Lager =
  | { styring: 'antall'; antall: number; status: Lagerstatus; grunnlag: string }
  | { styring: 'status'; status: Lagerstatus; grunnlag: string }
  | { styring: 'variantene' }

export interface Kategori {
  slug: string
  navn: string
  forelderSlug: string | null
  dybde: number
}

export interface Merke {
  slug: string
  navn: string
}

export interface Term {
  slug: string
  navn: string
}

export interface Attributt {
  /** Taksonomien med prefiks, f.eks. `pa_storrelse`. */
  slug: string
  navn: string
  termer: Term[]
}

export interface ProduktAttributt {
  slug: string
  posisjon: number
  variasjon: boolean
  termer: Term[]
}

export interface Bilde {
  src: string
  alt: string
}

export interface Variasjon {
  kildeId: number
  forelderKildeId: number
  sku: string | null
  valg: { attributtSlug: string; term: Term }[]
  ordinaerOre: number
  tilbudOre: number | null
  lager: Lager
  beskrivelse: string
  bilde: string | null
  rekkefolge: number
  /** Satt når variasjonen har samme valg som en tidligere variasjon (WooCommerce bruker den første). */
  dobbeltAv: number | null
}

export interface Produkt {
  kildeId: number
  type: 'simple' | 'variable'
  navn: string
  slug: string
  sku: string | null
  merke: Merke | null
  pwbMerke: Merke | null
  kategoriSlugs: string[]
  beskrivelse: string
  kortBeskrivelse: string
  ordinaerOre: number | null
  tilbudOre: number | null
  lager: Lager
  attributter: ProduktAttributt[]
  bilder: Bilde[]
  variasjoner: Variasjon[]
  opprettet: string
  kildeUrl: string
}

export interface Melding {
  kode: string
  tekst: string
  kildeId?: number
  sku?: string | null
  navn?: string
}

export interface Kilde {
  /** Sortert slik at en forelder alltid kommer før barna sine. */
  kategorier: Kategori[]
  merker: Merke[]
  attributter: Attributt[]
  produkter: Produkt[]
  /** Avvik og merknader funnet i selve kilden (advarsler). */
  meldinger: Melding[]
  /** Feil i kilden; det berørte objektet importeres ikke. */
  feil: Melding[]
  antall: {
    produkter: number
    enkle: number
    variable: number
    variasjoner: number
    kategorier: number
    merker: number
  }
}

// ---------------------------------------------------------------------------------------------
// WooCommerce REST API v3 (det vi leser fra staging)
// ---------------------------------------------------------------------------------------------

export interface WooTerm {
  id: number
  name: string
  slug: string
  parent?: number
}

export interface WooAttributt {
  id: number
  name: string
  slug: string
}

export interface WooBilde {
  id: number
  src: string
  name?: string
  alt?: string
}

export interface WooProduktAttributt {
  id: number
  name: string
  position?: number
  visible?: boolean
  variation: boolean
  options: string[]
}

export interface WooProdukt {
  id: number
  name: string
  slug: string
  type: string
  status?: string
  sku: string
  regular_price: string
  sale_price: string
  description: string
  short_description: string
  categories: { id: number; name?: string; slug: string }[]
  brands?: { id: number; name?: string; slug: string }[]
  attributes: WooProduktAttributt[]
  manage_stock: boolean | 'parent'
  stock_quantity: number | null
  stock_status: string
  images: WooBilde[]
}

export interface WooVariasjon {
  id: number
  parent_id?: number
  sku: string
  regular_price: string
  sale_price: string
  description: string
  manage_stock: boolean | 'parent'
  stock_quantity: number | null
  stock_status: string
  attributes: { id: number; name?: string; option: string }[]
  image: WooBilde | null
  menu_order?: number
}

/** Det som finnes i staging før importen. `tomButikk()` brukes når vi kjører offline. */
export interface Eksisterende {
  kilde: 'tom' | 'staging'
  kategorier: WooTerm[]
  merker: WooTerm[]
  merkerStottes: boolean
  attributter: WooAttributt[]
  /** Termer per attributt-ID. */
  termer: Record<number, WooTerm[]>
  produkter: WooProdukt[]
  /** Variasjoner per produkt-ID (alle variable produkter i staging). */
  variasjoner: Record<number, WooVariasjon[]>
  /** WooCommerce-innstillinger importen forutsetter; `null` = kunne ikke leses. */
  innstillinger: Record<string, string | null>
}

// ---------------------------------------------------------------------------------------------
// Planen
// ---------------------------------------------------------------------------------------------

export type Handling = 'opprett' | 'oppdater' | 'uendret' | 'hopp_over'

export interface Post<T> {
  handling: Handling
  /** Stabil nøkkel for rapporten, f.eks. `sku:120991` eller `kategori:unisex`. */
  nokkel: string
  /** ID i staging når objektet finnes der. */
  id: number | null
  onske: T
  /** Feltgruppene som endres ved `oppdater`. */
  endringer: string[]
  grunn?: string
  /** For produkter: send bilder (ved opprettelse, eller når staging-produktet ikke har noen). */
  sendBilder?: boolean
}

export interface TermOnske extends Term {
  attributtSlug: string
}

export interface Avstemmingslinje {
  type: string
  iKilden: number
  hoppesOver: number
  forventet: number
  opprett: number
  oppdater: number
  uendret: number
  stemmer: boolean
  merknad?: string
}

export interface Plan {
  kategorier: Post<Kategori>[]
  merker: Post<Merke>[]
  attributter: Post<Attributt>[]
  termer: Post<TermOnske>[]
  produkter: Post<Produkt>[]
  variasjoner: Post<Variasjon>[]
  advarsler: Melding[]
  feil: Melding[]
  /** Forhold som stopper `--apply` før noe skrives. */
  blokkerende: string[]
  /** Objekter som bare finnes i staging. Importen sletter aldri noe. */
  bareIStaging: {
    kategorier: WooTerm[]
    merker: WooTerm[]
    produkter: { id: number; sku: string; navn: string }[]
    variasjoner: { id: number; forelderId: number; sku: string }[]
  }
  avstemming: Avstemmingslinje[]
}
