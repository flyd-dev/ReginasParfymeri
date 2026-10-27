'use client'

import { Minus, Plus } from 'lucide-react'
import { Rulletall } from './rulletall'

// Knappene er 44 px og gir et lite trykk (skalering) på telefon; tallet ruller opp eller ned når det endres
// (Rulletall).
const knapp =
  'grid w-11 place-items-center transition-[color,scale] duration-(--dur-fast) ease-out hover:text-regina-pink-strong active:scale-90 disabled:opacity-40 disabled:hover:text-current'

export function Antallvelger({
  antall,
  maks,
  onEndre,
  deaktivert,
  navn,
}: {
  antall: number
  maks: number
  onEndre: (antall: number) => void
  deaktivert?: boolean
  navn: string
}) {
  return (
    <div
      className="inline-flex h-11 items-stretch border border-input"
      role="group"
      aria-label={`Antall av ${navn}`}
    >
      <button
        type="button"
        className={knapp}
        onClick={() => onEndre(antall - 1)}
        disabled={deaktivert || antall <= 1}
        aria-label="Én mindre"
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <span className="grid min-w-8 place-items-center text-sm tabular-nums" aria-live="polite">
        <Rulletall verdi={antall} />
      </span>
      <button
        type="button"
        className={knapp}
        onClick={() => onEndre(antall + 1)}
        disabled={deaktivert || antall >= maks}
        aria-label="Én til"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  )
}
