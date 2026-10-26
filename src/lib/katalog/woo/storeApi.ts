// Formatet fra WooCommerce Store API (wc/store/v1), bare feltene vi bruker.
// Verifisert mot nettbutikk.reginaparfymeri.no 26.10.2026 (WooCommerce 10.6.2).
// Store API-et er offentlig for lesing og krever ingen nøkkel. Vi gjør bare GET.

export interface WooPriser {
  price: string
  regular_price: string
  sale_price: string
  price_range: { min_amount: string; max_amount: string } | null
  currency_code: string
  currency_minor_unit: number
}

export interface WooBilde {
  id: number
  src: string
  thumbnail: string
  srcset: string
  alt: string
  name: string
}

export interface WooProdukt {
  id: number
  name: string
  slug: string
  parent: number
  type: string
  variation: string
  permalink: string
  sku: string
  short_description: string
  description: string
  on_sale: boolean
  prices: WooPriser
  images: WooBilde[]
  categories: { id: number; name: string; slug: string }[]
  attributes: {
    id: number
    name: string
    taxonomy: string
    has_variations: boolean
    terms: { id: number; name: string; slug: string }[]
  }[]
  variations: { id: number; attributes: { name: string; value: string }[] }[]
  is_purchasable: boolean
  is_in_stock: boolean
  is_on_backorder: boolean
  low_stock_remaining: number | null
  stock_availability: { text: string; class: string }
  sold_individually: boolean
  add_to_cart: { maximum: number; minimum: number; multiple_of: number }
}

export interface WooKategori {
  id: number
  name: string
  slug: string
  parent: number
  count: number
}

/** Perfect WooCommerce Brands (wp/v2/pwb-brand) – merkene slik butikken har registrert dem. */
export interface WooMerke {
  id: number
  name: string
  slug: string
  count: number
}

/** wp/v2/product?_fields=id,pwb-brand – koblingen mellom produkt og merke. */
export interface WooProduktMerke {
  id: number
  'pwb-brand': number[]
}
