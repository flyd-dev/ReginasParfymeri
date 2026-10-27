// Kilde for DATA_SOURCE=json: leser data/products.json, categories.json og brands.json fra disk.
// Prototypen kan dermed vises uten staging-WooCommerce. Filene lages av scripts/build_catalog.py.

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { lagVisningsnavn } from '@/lib/tekst'
import type { KategoriJson, MerkeJson, ProduktJson, VariantJson } from './json-format'
import {
  kategorinavn,
  lagLager,
  lagMaks,
  lagPris,
  sammenstillVarianter,
  tilOre,
  velgHovedkategori,
} from './mapping'
import type { Egenskap, Kategori, KategoriRef, Katalog, Merke, Produkt, Variant } from './typer'

function fraVariantJson(v: VariantJson): Variant {
  const paaLager = v.in_stock ?? false
  const pris = tilOre(v.price ?? 0)
  return {
    id: v.id,
    valg: v.attributes,
    sku: v.sku ?? '',
    pris: lagPris(pris, v.regular_price != null ? tilOre(v.regular_price) : null, v.on_sale ?? false),
    lager: lagLager(paaLager, v.low_stock_remaining, v.stock_text),
    kjopbar: paaLager && (v.purchasable ?? true) && pris > 0,
    maks: lagMaks(v.max_quantity, paaLager),
    bilde: v.image ?? null,
    duplikatAv: v.duplicate_of ?? null,
  }
}

export function fraProduktJson(p: ProduktJson): Produkt {
  const merke = p.brand && p.brand_slug ? { navn: p.brand, slug: p.brand_slug } : null
  const visningsnavn = lagVisningsnavn(p.name, p.brand)
  const kategorier: KategoriRef[] = p.categories.map((k) => ({
    slug: k.slug,
    navn: kategorinavn(k.name),
    sti: k.path_slugs,
  }))
  const egenskaper: Egenskap[] = p.attributes.map((a) => ({
    navn: a.name,
    variasjon: a.variation,
    verdier: a.options.map((navn, i) => ({ navn, slug: a.option_slugs?.[i] ?? navn })),
  }))
  const felles = {
    id: p.id,
    slug: p.slug,
    navn: p.name,
    visningsnavn,
    merke,
    sku: p.sku,
    kortBeskrivelse: p.short_description,
    beskrivelse: p.description,
    kategorier,
    hovedkategori: velgHovedkategori(kategorier),
    egenskaper,
    bilder: p.images.map((b) => ({
      src: b.src,
      // Alt-tekst fra WooCommerce, ellers produktnavnet (oppdraget §8).
      alt: b.alt?.trim() || [p.brand, visningsnavn].filter(Boolean).join(' – '),
    })),
    kildeUrl: p.source_url,
    opprettet: p.date_created ?? null,
    popularitet: p.popularity_rank ?? null,
  }

  if (p.type === 'variable') {
    const varianter = p.variations.map(fraVariantJson)
    const samlet = sammenstillVarianter(varianter)
    const reserve = tilOre(p.price_min ?? p.price ?? 0)
    return {
      ...felles,
      type: 'variabel',
      varianter,
      pris: samlet.pris ?? lagPris(reserve, null, false),
      prisspenn: samlet.prisspenn,
      lager: samlet.lager,
      kjopbar: (p.purchasable ?? true) && samlet.kjopbar,
      maks: samlet.maks,
    }
  }

  const pris = tilOre(p.price ?? 0)
  return {
    ...felles,
    type: 'enkel',
    varianter: [],
    pris: lagPris(pris, p.regular_price != null ? tilOre(p.regular_price) : null, p.on_sale),
    prisspenn: null,
    lager: lagLager(p.in_stock, p.low_stock_remaining, p.stock_text),
    kjopbar: p.in_stock && (p.purchasable ?? true) && pris > 0,
    maks: lagMaks(p.max_quantity, p.in_stock),
  }
}

export function fraKategoriJson(k: KategoriJson): Kategori {
  return {
    slug: k.slug,
    navn: kategorinavn(k.name),
    sti: k.path.split('/'),
    antall: k.product_count,
    barn: k.children.map(fraKategoriJson),
  }
}

export function fraMerkeJson(m: MerkeJson): Merke {
  return { navn: m.name, slug: m.slug, antall: m.product_count }
}

async function lesJson<T>(fil: string): Promise<T> {
  return JSON.parse(await readFile(path.join(process.cwd(), 'data', fil), 'utf8')) as T
}

export async function lesJsonKatalog(): Promise<Katalog> {
  const [produkter, kategorier, merker, meta] = await Promise.all([
    lesJson<ProduktJson[]>('products.json'),
    lesJson<KategoriJson[]>('categories.json'),
    lesJson<MerkeJson[]>('brands.json'),
    lesJson<{ fetched: string }>('meta.json'),
  ])
  return {
    produkter: produkter.map(fraProduktJson),
    kategorier: kategorier.map(fraKategoriJson),
    merker: merker.map(fraMerkeJson).sort((a, b) => a.navn.localeCompare(b.navn, 'nb')),
    kilde: 'json',
    hentet: meta.fetched,
  }
}
