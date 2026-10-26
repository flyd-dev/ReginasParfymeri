import type { Ore } from './katalog/typer'

const HELE = new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 })
const MED_ORE = new Intl.NumberFormat('nb-NO', {
  style: 'currency',
  currency: 'NOK',
  minimumFractionDigits: 2,
})

/** 264500 → «2 645 kr». Øre vises bare når beløpet ikke er helt. */
export function kroner(ore: Ore): string {
  if (!Number.isSafeInteger(ore)) throw new Error(`Beløp må være heltall øre: ${ore}`)
  return ore % 100 === 0 ? HELE.format(ore / 100) : MED_ORE.format(ore / 100)
}

export function antallTekst(antall: number, entall: string, flertall: string): string {
  return `${new Intl.NumberFormat('nb-NO').format(antall)} ${antall === 1 ? entall : flertall}`
}
