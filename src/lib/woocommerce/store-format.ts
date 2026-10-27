// De delene av WooCommerce Store API-formatet (/wp-json/wc/store/v1) som flaten bruker.
// Beløp er tekst i minste enhet («264500» med currency_minor_unit 2).

export interface StorePriser {
  price: string
  regular_price: string
  sale_price: string
  price_range: { min_amount: string; max_amount: string } | null
  currency_code: string
  currency_minor_unit: number
}

export interface StoreBilde {
  id: number
  src: string
  thumbnail?: string
  alt: string
  name: string
}

export interface StoreKategoriPaProdukt {
  id: number
  name: string
  slug: string
  link: string
}

export interface StoreEgenskap {
  id: number
  name: string
  taxonomy: string | null
  has_variations: boolean
  terms: { id: number; name: string; slug: string }[]
}

export interface StoreProdukt {
  id: number
  name: string
  slug: string
  parent: number
  type: string
  permalink: string
  sku: string
  short_description: string
  description: string
  on_sale: boolean
  prices: StorePriser
  images: StoreBilde[]
  categories: StoreKategoriPaProdukt[]
  brands?: { id: number; name: string; slug: string }[]
  attributes: StoreEgenskap[]
  variations: { id: number; attributes: { name: string; value: string }[] }[]
  is_purchasable: boolean
  is_in_stock: boolean
  is_on_backorder: boolean
  low_stock_remaining: number | null
  stock_availability?: { text: string; class: string }
  add_to_cart?: { maximum: number; minimum: number }
}

export interface StoreKategori {
  id: number
  name: string
  slug: string
  parent: number
  count: number
}

export interface WpProduktMeta {
  id: number
  date?: string
  'pwb-brand'?: number[]
}

export interface PwbMerke {
  id: number
  name: string
  slug: string
  count: number
}
