// Lokal handlekurv for prototypen (DATA_SOURCE=json): bare ID-er og antall i en cookie, alt annet
// slås opp i katalogen ved hver lesing. Pris og lager kan dermed aldri bli stående gamle i kurven.
// Ingen kall mot WooCommerce.

import type { Katalog, Produkt, Variant } from '@/lib/woocommerce/typer'
import type { Kurv, Kurvlinje, Kurvmelding, LeggTil } from './typer'

export interface LagretLinje {
  p: number
  v: number | null
  a: number
  /** Prisen kunden så da varen ble lagt i kurven (øre) – for å forklare prisendringer. */
  k: number
}

export const LOKAL_COOKIE = 'regina_kurv'
const MAKS_LINJER = 60

export function lesLagret(verdi: string | undefined): LagretLinje[] {
  if (!verdi) return []
  try {
    const data: unknown = JSON.parse(verdi)
    if (!Array.isArray(data)) return []
    return data
      .filter(
        (l): l is LagretLinje =>
          typeof l === 'object' &&
          l !== null &&
          Number.isSafeInteger((l as LagretLinje).p) &&
          ((l as LagretLinje).v === null || Number.isSafeInteger((l as LagretLinje).v)) &&
          Number.isSafeInteger((l as LagretLinje).a) &&
          Number.isSafeInteger((l as LagretLinje).k),
      )
      .slice(0, MAKS_LINJER)
  } catch {
    return []
  }
}

export function skrivLagret(linjer: LagretLinje[]): string {
  return JSON.stringify(linjer.slice(0, MAKS_LINJER))
}

const nokkel = (p: number, v: number | null) => `${p}:${v ?? 0}`

function finn(
  k: Katalog,
  l: { p: number; v: number | null },
): { produkt: Produkt; variant: Variant | null } | null {
  const produkt = k.produkter.find((p) => p.id === l.p)
  if (!produkt) return null
  if (produkt.type === 'enkel') return l.v === null ? { produkt, variant: null } : null
  const variant = produkt.varianter.find((v) => v.id === l.v && v.duplikatAv === null)
  return variant ? { produkt, variant } : null
}

function valgtekst(produkt: Produkt, variant: Variant | null): string {
  if (!variant) return ''
  return Object.entries(variant.valg)
    .map(([navn, slug]) => {
      const verdi = produkt.egenskaper.find((e) => e.navn === navn)?.verdier.find((x) => x.slug === slug)
      return `${navn}: ${verdi?.navn ?? slug}`
    })
    .join(', ')
}

function visningsnavn(produkt: Produkt): string {
  return [produkt.merke?.navn, produkt.visningsnavn].filter(Boolean).join(' – ')
}

/** Slår opp linjene i katalogen og kontrollerer pris, lager og antall. Returnerer kurven og det som ble rettet. */
export function kontroller(k: Katalog, lagret: LagretLinje[]): { kurv: Kurv; rettet: LagretLinje[] } {
  const linjer: Kurvlinje[] = []
  const meldinger: Kurvmelding[] = []
  const rettet: LagretLinje[] = []
  for (const l of lagret) {
    const treff = finn(k, l)
    if (!treff) {
      meldinger.push({ type: 'fjernet', navn: 'En vare' })
      continue
    }
    const { produkt, variant } = treff
    const navn = visningsnavn(produkt)
    const kjopbar = variant ? variant.kjopbar && produkt.kjopbar : produkt.kjopbar
    const maks = variant ? variant.maks : produkt.maks
    const pris = variant ? variant.pris : produkt.pris
    if (!kjopbar || maks < 1) {
      meldinger.push({ type: 'utsolgt', navn })
      continue
    }
    let antall = Math.max(1, l.a)
    if (antall > maks) {
      antall = maks
      meldinger.push({ type: 'antall-justert', navn, antall })
    }
    if (l.k !== pris.pris) meldinger.push({ type: 'pris-endret', navn, fra: l.k, til: pris.pris })
    rettet.push({ p: l.p, v: l.v, a: antall, k: pris.pris })
    linjer.push({
      nokkel: nokkel(l.p, l.v),
      produktId: produkt.id,
      variantId: variant?.id ?? null,
      antall,
      navn: produkt.visningsnavn,
      merke: produkt.merke?.navn ?? null,
      slug: produkt.slug,
      bilde: variant?.bilde ?? produkt.bilder[0]?.src ?? null,
      valg: valgtekst(produkt, variant),
      pris: pris.pris,
      ordinaer: pris.tilbud ? pris.ordinaer : null,
      maks,
    })
  }
  return {
    kurv: {
      modus: 'lokal',
      linjer,
      antall: linjer.reduce((s, l) => s + l.antall, 0),
      delsum: linjer.reduce((s, l) => s + l.antall * l.pris, 0),
      meldinger,
    },
    rettet,
  }
}

export class KurvFeil extends Error {
  constructor(
    melding: string,
    readonly status = 400,
  ) {
    super(melding)
    this.name = 'KurvFeil'
  }
}

/** Legger til en vare. Et variabelt produkt får aldri en variant valgt for seg. */
export function leggTil(k: Katalog, lagret: LagretLinje[], ny: LeggTil): LagretLinje[] {
  const produkt = k.produkter.find((p) => p.id === ny.produktId)
  if (!produkt) throw new KurvFeil('Fant ikke varen.', 404)
  if (produkt.type === 'variabel' && ny.variantId === null) throw new KurvFeil('Velg en variant først.')
  const treff = finn(k, { p: ny.produktId, v: ny.variantId })
  if (!treff) throw new KurvFeil('Varianten finnes ikke.', 404)
  const { variant } = treff
  const kjopbar = variant ? variant.kjopbar && produkt.kjopbar : produkt.kjopbar
  const maks = variant ? variant.maks : produkt.maks
  if (!kjopbar || maks < 1) throw new KurvFeil('Varen er dessverre utsolgt.', 409)
  const pris = (variant ?? produkt).pris.pris
  const antall = Math.max(1, Math.floor(ny.antall))
  const finnes = lagret.find((l) => l.p === ny.produktId && l.v === ny.variantId)
  if (finnes) {
    if (finnes.a + antall > maks) throw new KurvFeil(`Du kan ha høyst ${maks} av denne i kurven.`, 409)
    return lagret.map((l) => (l === finnes ? { ...l, a: l.a + antall, k: pris } : l))
  }
  if (antall > maks) throw new KurvFeil(`Du kan ha høyst ${maks} av denne i kurven.`, 409)
  return [...lagret, { p: ny.produktId, v: ny.variantId, a: antall, k: pris }]
}

export function endreAntall(lagret: LagretLinje[], linjenokkel: string, antall: number): LagretLinje[] {
  if (antall < 1) return fjern(lagret, linjenokkel)
  return lagret.map((l) => (nokkel(l.p, l.v) === linjenokkel ? { ...l, a: Math.floor(antall) } : l))
}

export function fjern(lagret: LagretLinje[], linjenokkel: string): LagretLinje[] {
  return lagret.filter((l) => nokkel(l.p, l.v) !== linjenokkel)
}
