// Trykket og ikonbyttet er bygget etter «Add to Cart Button» (bidyut10, MIT) på 21st.dev – https://21st.dev/@bidyut10/components/add-to-cart-button. Egen kode; ingen kode er kopiert.
'use client'

import { Check, ShoppingBag } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useKurv } from '@/components/kurv/kurv-provider'
import { cn } from '@/lib/utils'

/** Hvor lenge haken står før knappen er tilbake som handlepose. */
const HAKE_MS = 2000

/**
 * Raskt kjøp fra produktkortet – bare når valget er entydig (`hurtigkjop` i sporring.ts). En rund knapp i lys rosa
 * over hjørnet av bildebrønnen (R-32); ved peker fylles den med Reginas rosa, og når varen er lagt i kurven, står
 * den plum med en hake – samme par som primærknappen (hvit på rosa, hvit på plum).
 *
 * Som i forbildet synker knappen litt når den trykkes, og når varen er lagt i kurven, vrir handleposen seg ut og
 * en hake inn (bare transform og opacity) før knappen går tilbake av seg selv. Navnet til knappen er det samme hele
 * tiden; beskjeden «Lagt i handlekurven» leses opp av kurven (aria-live). Uten JavaScript poster skjemaet til
 * /api/kurv/ som før.
 */
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
  const [lagt, setLagt] = useState(false)
  const tidtaker = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (tidtaker.current) clearTimeout(tidtaker.current)
    },
    [],
  )

  const ikon = 'size-4 transition-[opacity,transform] duration-(--dur-base) ease-out'

  return (
    <form
      action="/api/kurv/"
      method="post"
      onSubmit={(e) => {
        e.preventDefault()
        void leggTil({ produktId, variantId, antall: 1 }).then((ok) => {
          if (!ok) return
          setLagt(true)
          if (tidtaker.current) clearTimeout(tidtaker.current)
          tidtaker.current = setTimeout(() => setLagt(false), HAKE_MS)
        })
      }}
    >
      <input type="hidden" name="produktId" value={produktId} />
      {variantId !== null && <input type="hidden" name="variantId" value={variantId} />}
      <button
        type="submit"
        disabled={opptatt}
        className={cn(
          'relative inline-flex size-11 items-center justify-center rounded-full border transition-[color,background-color,border-color,transform] duration-(--dur-fast) ease-out active:scale-90 disabled:opacity-50',
          lagt
            ? 'border-regina-plum bg-regina-plum text-white'
            : 'border-regina-pink-100 bg-regina-pink-50 text-regina-plum hover:border-regina-pink-strong hover:bg-regina-pink-strong hover:text-white',
        )}
        aria-label={`Legg ${navn} i handlekurven`}
      >
        <ShoppingBag className={cn(ikon, lagt && '-rotate-45 scale-50 opacity-0')} aria-hidden />
        <Check
          className={cn(
            ikon,
            'absolute',
            lagt ? 'scale-100 rotate-0 opacity-100' : 'rotate-45 scale-50 opacity-0',
          )}
          aria-hidden
        />
      </button>
    </form>
  )
}
