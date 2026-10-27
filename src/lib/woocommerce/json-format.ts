// Formatet i data/products.json, data/categories.json og data/brands.json, slik scripts/build_catalog.py
// skriver dem. Beløp er NOK som desimaltall; de gjøres om til heltall øre i json-kilde.ts.

export interface VariantJson {
  id: number
  attributes: Record<string, string>
  attribute_labels: Record<string, string>
  sku?: string
  price?: number | null
  regular_price?: number | null
  sale_price?: number | null
  on_sale?: boolean
  in_stock?: boolean
  purchasable?: boolean
  low_stock_remaining?: number | null
  stock_text?: string
  max_quantity?: number | null
  description?: string
  image?: string | null
  duplicate_of?: number
}

export interface KategoriPaProduktJson {
  slug: string
  name: string
  path: string[]
  path_slugs: string[]
}

export interface ProduktJson {
  id: number
  name: string
  slug: string
  brand: string | null
  brand_slug: string | null
  type: 'simple' | 'variable' | string
  sku: string
  price: number | null
  regular_price: number | null
  sale_price: number | null
  price_min: number | null
  price_max: number | null
  currency: string
  on_sale: boolean
  in_stock: boolean
  low_stock_remaining: number | null
  short_description: string
  description: string
  categories: KategoriPaProduktJson[]
  primary_category_path: string[]
  attributes: { name: string; options: string[]; option_slugs?: string[]; variation: boolean }[]
  variation_ids: number[]
  variations: VariantJson[]
  max_quantity?: number | null
  stock_text?: string
  purchasable?: boolean
  on_backorder?: boolean
  date_created?: string | null
  popularity_rank?: number | null
  images: { src: string; thumbnail?: string | null; alt: string; name: string }[]
  source_url: string
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

export interface SideJson {
  slug: string
  title: string
  modified: string
  source_url: string
  blocks: SideBlokkJson[]
}

export interface TekstbitJson {
  text: string
  href?: string
  strong?: boolean
}

export type SideBlokkJson =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; runs: TekstbitJson[] }
  | { type: 'list'; items: TekstbitJson[][] }

export interface GammeltMerkeJson {
  slug: string
  name: string
  count: number
  url: string
  new_slug: string | null
}
