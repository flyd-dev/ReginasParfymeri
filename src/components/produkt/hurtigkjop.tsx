'use client'

import { ShoppingBag } from 'lucide-react'
import { useKurv } from '@/components/kurv/kurv-provider'

/** Raskt kjøp fra produktkortet – bare når valget er entydig (`hurtigkjop` i sporring.ts). */
export function Hurtigkjop({
  produktId,
  variantId,
  navn,
}: {
  produktId: number
  variantId: number | null
  navn: string
}) {
  const { leggTil, opptatt } = useKurv()
  return (
    <form
      action="/api/kurv/"
      method="post"
      onSubmit={(e) => {
        e.preventDefault()
        void leggTil({ produktId, variantId, antall: 1 })
      }}
    >
      <input type="hidden" name="produktId" value={produktId} />
      {variantId !== null && <input type="hidden" name="variantId" value={variantId} />}
      <button
        type="submit"
        disabled={opptatt}
        className="inline-flex size-11 items-center justify-center border border-regina-plum bg-paper text-regina-plum transition-colors duration-(--dur-fast) hover:bg-regina-plum hover:text-white disabled:opacity-50"
        aria-label={`Legg ${navn} i handlekurven`}
      >
        <ShoppingBag className="size-4" aria-hidden />
      </button>
    </form>
  )
}
