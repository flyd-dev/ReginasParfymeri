// Beløp regnes i heltall øre hele veien. WooCommerce REST API v3 vil ha prisen som tekst med to
// desimaler (`"949.00"`), så omformingen skjer først når nyttelasten bygges.

/** NOK som desimaltall (fra data/products.json) → heltall øre. Avviser mer enn to desimaler. */
export function kronerTilOre(kroner: number): number {
  if (!Number.isFinite(kroner) || kroner < 0) throw new Error(`Ugyldig beløp: ${kroner}`)
  const ore = Math.round(kroner * 100)
  if (Math.abs(ore - kroner * 100) > 1e-6) throw new Error(`Beløpet ${kroner} har mer enn to desimaler`)
  if (!Number.isSafeInteger(ore)) throw new Error(`Beløpet ${kroner} er for stort`)
  return ore
}

/** Store API-beløp i minste enhet (`"264500"`, `currency_minor_unit: 2`) → heltall øre. */
export function minsteEnhetTilOre(verdi: string, minsteEnhet: number): number {
  if (!/^\d+$/.test(verdi)) throw new Error(`Ugyldig beløp i minste enhet: «${verdi}»`)
  if (!Number.isInteger(minsteEnhet) || minsteEnhet < 0 || minsteEnhet > 6) {
    throw new Error(`Ugyldig currency_minor_unit: ${minsteEnhet}`)
  }
  const tall = Number(verdi)
  if (!Number.isSafeInteger(tall)) throw new Error(`Beløpet ${verdi} er for stort`)
  if (minsteEnhet === 2) return tall
  if (minsteEnhet < 2) return tall * 10 ** (2 - minsteEnhet)
  const deler = 10 ** (minsteEnhet - 2)
  if (tall % deler !== 0) throw new Error(`Beløpet ${verdi} kan ikke uttrykkes i hele øre`)
  return tall / deler
}

/** Heltall øre → WooCommerce-pris med to desimaler, f.eks. 94900 → `"949.00"`. */
export function oreTilPris(ore: number): string {
  if (!Number.isSafeInteger(ore) || ore < 0) throw new Error(`Ugyldig øre-beløp: ${ore}`)
  const kroner = Math.floor(ore / 100)
  const rest = ore % 100
  return `${kroner}.${String(rest).padStart(2, '0')}`
}

/** Pris fra WooCommerce (`"949"`, `"949.00"`, `""`) → øre, eller `null` når feltet er tomt. */
export function prisTilOre(pris: string | null | undefined): number | null {
  if (pris === null || pris === undefined || pris.trim() === '') return null
  const treff = /^(\d+)(?:[.,](\d+))?$/.exec(pris.trim())
  if (!treff) return null
  const heltall = Number(treff[1])
  const desimaler = (treff[2] ?? '').padEnd(3, '0')
  // Rund av på tredje desimal i tilfelle butikken lagrer flere enn to.
  const tidelsOre = Number(desimaler.slice(0, 3))
  return heltall * 100 + Math.round(tidelsOre / 10)
}

/** Norsk visning til rapporten, f.eks. 94900 → `949,00 kr`. */
export function visKroner(ore: number): string {
  return `${oreTilPris(ore).replace('.', ',')} kr`
}
