import type { Ore } from '@/lib/woocommerce/typer'

const TALL = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 })
const MED_ORE = new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** 94900 → «kr 949», 264500 → «kr 2 645». Øre vises bare når beløpet ikke er helt (oppdraget §6). */
export function kroner(ore: Ore): string {
  if (!Number.isSafeInteger(ore)) throw new Error(`Beløp må være heltall øre: ${ore}`)
  const tall = ore % 100 === 0 ? TALL.format(ore / 100) : MED_ORE.format(ore / 100)
  return `kr ${tall}`
}

/** «fra kr 2 645» for varianter med ulik pris. */
export function fraKroner(ore: Ore): string {
  return `fra ${kroner(ore)}`
}

/** Beløp for skjermlesere og strukturerte data: «949.00». */
export function desimalkroner(ore: Ore): string {
  return (ore / 100).toFixed(2)
}

export function antallTekst(antall: number, entall: string, flertall: string): string {
  return `${TALL.format(antall)} ${antall === 1 ? entall : flertall}`
}

const DATO = new Intl.DateTimeFormat('nb-NO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Oslo',
})

export function dato(iso: string): string {
  return DATO.format(new Date(iso))
}
