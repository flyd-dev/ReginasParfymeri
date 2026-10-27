'use client'

import { Minus, Plus } from 'lucide-react'

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
      className="inline-flex h-10 items-stretch border border-input"
      role="group"
      aria-label={`Antall av ${navn}`}
    >
      <button
        type="button"
        className="grid w-10 place-items-center disabled:opacity-40"
        onClick={() => onEndre(antall - 1)}
        disabled={deaktivert || antall <= 1}
        aria-label="Én mindre"
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <span className="grid min-w-8 place-items-center text-sm tabular-nums" aria-live="polite">
        {antall}
      </span>
      <button
        type="button"
        className="grid w-10 place-items-center disabled:opacity-40"
        onClick={() => onEndre(antall + 1)}
        disabled={deaktivert || antall >= maks}
        aria-label="Én til"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  )
}
