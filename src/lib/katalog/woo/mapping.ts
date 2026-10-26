// WooCommerce Store API → domenemodellen. Rene funksjoner uten nettverk, så de kan testes.
// Her ligger reglene som avgjør pris, variant og lager i flaten – endres de, skal testene i
// `mapping.test.ts` vise at riktig variant får riktig pris.

import type {
  Bilde,
  Bildebakgrunn,
  Egenskap,
  Kategori,
  Lager,
  Merke,
  MerkeRef,
  Ore,
  Pris,
  Produkt,
  Variant,
} from '../typer'
import { finnDuftnoter, lagInnhold, tilLinjer } from '../innhold'
import { dekodHtml, lagVisningsnavn, normaliserMal, rensTekst } from '../tekst'
import { kategorinavn } from '../kategorinavn'
import { merkenavn } from '../merkenavn'
import type { WooKategori, WooMerke, WooPriser, WooProdukt } from './storeApi'

export interface Bildeanalyse {
  bakgrunn: Bildebakgrunn
  flate: string | null
}

/** Store API oppgir beløp i valutaens minste enhet som tekst. Vi lagrer øre som heltall. */
export function tilOre(verdi: string | null | undefined, minsteEnhet: number): Ore {
  if (verdi === null || verdi === undefined || verdi === '') return 0
  if (!/^-?\d+$/.test(verdi)) throw new Error(`Ugyldig beløp fra Store API: «${verdi}»`)
  const tall = Number.parseInt(verdi, 10)
  const faktor = 10 ** (2 - minsteEnhet)
  return Math.round(tall * faktor)
}

export function lagPris(priser: WooPriser, paTilbud: boolean): Pris {
  const pris = tilOre(priser.price, priser.currency_minor_unit)
  const ordinaer = tilOre(priser.regular_price || priser.price, priser.currency_minor_unit)
  return {
    pris,
    ordinaer: Math.max(ordinaer, pris),
    // Tilbud bare når WooCommerce sier det OG prisen faktisk er lavere.
    tilbud: paTilbud && ordinaer > pris,
    valuta: priser.currency_code,
  }
}

type Lagerfelter = Pick<
  WooProdukt,
  'is_in_stock' | 'is_on_backorder' | 'low_stock_remaining' | 'stock_availability'
>

/** Antallet WooCommerce selv oppgir – i `low_stock_remaining` eller i teksten («4 på lager»). */
export function kjentBeholdning(p: Lagerfelter): number | null {
  if (typeof p.low_stock_remaining === 'number' && p.low_stock_remaining > 0) return p.low_stock_remaining
  const treff = /^(\d+)\s+på lager/i.exec(rensTekst(p.stock_availability?.text ?? ''))
  return treff?.[1] ? Number.parseInt(treff[1], 10) : null
}

export function lagLager(p: Lagerfelter): Lager {
  const tekst = rensTekst(p.stock_availability?.text ?? '')
  if (!p.is_in_stock) return { status: 'utsolgt', antall: 0, tekst: tekst || 'Utsolgt' }
  if (p.is_on_backorder) return { status: 'restordre', antall: null, tekst: tekst || 'Kan bestilles' }
  // «Få igjen» bare når WooCommerce selv melder lav beholdning.
  if (typeof p.low_stock_remaining === 'number' && p.low_stock_remaining > 0) {
    return { status: 'fa-igjen', antall: p.low_stock_remaining, tekst }
  }
  return { status: 'pa-lager', antall: kjentBeholdning(p), tekst }
}

/** Høyeste antall i én kurv: WooCommerces grense, «selges enkeltvis» og kjent beholdning. */
export function lagMaks(p: Pick<WooProdukt, 'add_to_cart' | 'sold_individually'> & Lagerfelter): number {
  let maks = p.add_to_cart?.maximum && p.add_to_cart.maximum > 0 ? p.add_to_cart.maximum : 99
  if (p.sold_individually) maks = 1
  const beholdning = kjentBeholdning(p)
  if (beholdning !== null) maks = Math.min(maks, beholdning)
  return Math.min(maks, 99)
}

export function lagBilder(
  p: Pick<WooProdukt, 'images' | 'name'>,
  analyse: (src: string) => Bildeanalyse | undefined,
): Bilde[] {
  const navn = rensTekst(p.name)
  return p.images.map((b) => {
    const a = analyse(b.src) ?? analyse(b.thumbnail)
    return {
      src: b.src,
      miniatyr: b.thumbnail || b.src,
      alt: rensTekst(b.alt) || navn,
      bakgrunn: a?.bakgrunn ?? 'ukjent',
      flate: a?.flate ?? null,
    }
  })
}

export function lagEgenskaper(p: Pick<WooProdukt, 'attributes'>): Egenskap[] {
  return p.attributes
    .filter((a) => a.has_variations)
    .map((a) => ({
      navn: dekodHtml(a.name),
      taksonomi: a.taxonomy,
      verdier: a.terms.map((t) => ({ verdi: t.slug, visning: normaliserMal(dekodHtml(t.name)) })),
    }))
}

/**
 * Lager en variant av en variasjon hentet fra Store API (`/products/{variasjons-id}`).
 * `valg` bygges fra forelderens variasjonsliste – den er fasit for hvilke verdier som hører sammen.
 */
export function lagVariant(
  variasjon: WooProdukt,
  valg: { name: string; value: string }[],
  egenskaper: Egenskap[],
): Variant {
  const tilValg: Record<string, string> = {}
  for (const v of valg) {
    const egenskap = egenskaper.find((e) => e.navn === dekodHtml(v.name))
    if (!egenskap) continue
    tilValg[egenskap.navn] = v.value
  }
  return {
    id: variasjon.id,
    valg: tilValg,
    beskrivelse: rensTekst(variasjon.description ?? ''),
    pris: lagPris(variasjon.prices, variasjon.on_sale),
    lager: lagLager(variasjon),
    kjopbar: variasjon.is_purchasable && variasjon.is_in_stock,
    sku: variasjon.sku,
    maks: lagMaks(variasjon),
  }
}

export interface Avvik {
  produkt: string
  type: 'dobbel-variant' | 'mangler-variasjonsdata'
  detaljer: string
}

export interface ProduktKontekst {
  merkeFor: (produktId: number) => MerkeRef | null
  analyse: (src: string) => Bildeanalyse | undefined
  /** Variasjonsdata hentet per variasjons-ID. Mangler den, regnes varianten som ukjent og vises ikke. */
  variasjon: (id: number) => WooProdukt | undefined
  rekkefolge: number
  /** Meldes når butikkens data er tvetydige, så Regina kan rette dem. */
  avvik?: (a: Avvik) => void
}

export function lagProdukt(p: WooProdukt, k: ProduktKontekst): Produkt {
  const navn = rensTekst(p.name)
  const merke = k.merkeFor(p.id)
  const egenskaper = lagEgenskaper(p)
  const varianter: Variant[] = []
  if (p.type === 'variable') {
    // To variasjoner med samme valg finnes i butikken. WooCommerce velger selv den første i
    // variasjonsrekkefølgen når kunden velger – vi gjør det samme og melder resten som avvik.
    const sett = new Map<string, number>()
    for (const v of p.variations) {
      const nokkel = JSON.stringify(v.attributes.map((a) => [dekodHtml(a.name), a.value]))
      const forrige = sett.get(nokkel)
      if (forrige !== undefined) {
        k.avvik?.({
          produkt: p.slug,
          type: 'dobbel-variant',
          detaljer: `Variasjon ${v.id} har samme valg som ${forrige} (${v.attributes.map((a) => `${a.name}: ${a.value}`).join(', ')}) og vises ikke.`,
        })
        continue
      }
      sett.set(nokkel, v.id)
      const data = k.variasjon(v.id)
      if (data) varianter.push(lagVariant(data, v.attributes, egenskaper))
      else
        k.avvik?.({
          produkt: p.slug,
          type: 'mangler-variasjonsdata',
          detaljer: `Variasjon ${v.id} ble ikke hentet.`,
        })
    }
  }
  const beskrivelseHtml = p.description || p.short_description || ''
  const duftnoter = finnDuftnoter(tilLinjer(beskrivelseHtml))
  const pris = lagPris(p.prices, p.on_sale)

  let prisspenn: Produkt['prisspenn'] = null
  if (varianter.length > 0) {
    const priser = varianter.map((v) => v.pris.pris)
    const fra = Math.min(...priser)
    const til = Math.max(...priser)
    if (fra !== til) prisspenn = { fra, til }
    pris.pris = fra
    pris.ordinaer = Math.max(pris.ordinaer, fra)
  } else if (p.prices.price_range) {
    const fra = tilOre(p.prices.price_range.min_amount, p.prices.currency_minor_unit)
    const til = tilOre(p.prices.price_range.max_amount, p.prices.currency_minor_unit)
    if (fra !== til) prisspenn = { fra, til }
  }

  // For variable produkter er produktet på lager når minst én variant er det.
  const lager =
    varianter.length > 0 && !varianter.some((v) => v.lager.status !== 'utsolgt')
      ? { status: 'utsolgt' as const, antall: 0, tekst: 'Utsolgt' }
      : lagLager(p)

  return {
    id: p.id,
    slug: p.slug,
    navn,
    visningsnavn: lagVisningsnavn(navn, merke?.navn ?? null),
    merke,
    type: p.type === 'variable' ? 'variabel' : 'enkel',
    kategorier: p.categories.map((c) => c.id),
    pris,
    prisspenn,
    lager,
    kjopbar: p.is_purchasable && lager.status !== 'utsolgt',
    maks: lagMaks(p),
    sku: p.sku,
    bilder: lagBilder(p, k.analyse),
    beskrivelse: lagInnhold(beskrivelseHtml, duftnoter !== null),
    duftnoter,
    egenskaper,
    varianter,
    rekkefolge: k.rekkefolge,
    lenke: p.permalink,
  }
}

export function lagKategori(k: WooKategori): Kategori {
  return {
    id: k.id,
    navn: kategorinavn(k.slug, rensTekst(k.name)),
    slug: k.slug,
    forelder: k.parent > 0 ? k.parent : null,
    antall: k.count,
  }
}

export function lagMerke(m: WooMerke, antall: number): Merke {
  return { id: m.id, navn: merkenavn(m.slug, rensTekst(m.name)), slug: m.slug, antall }
}
