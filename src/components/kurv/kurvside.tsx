// Bygget etter «Sheet with Scrollable Content» (ShadcnSpace, MIT) på 21st.dev – https://21st.dev/@shadcnspace/components/sheet-02. Egen kode; ingen kode er kopiert.
// Siden deler varelinjene og summen med skuffen (handlekurv.tsx), så de to ser like ut.

'use client'

import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { Kurv } from '@/lib/kurv/typer'
import { Kassedel, Kurvlinjer } from './handlekurv'
import { useKurv } from './kurv-provider'
import { Kurvmeldinger } from './kurvmeldinger'

/**
 * Handlekurven som egen side (også målet for skjemaer uten JavaScript og for /kassen/ i dagens butikk). Samme
 * varelinjer og samme sum som skuffen (handlekurv.tsx): linjene på et hvitt kort og summen i en lys rosa boks,
 * begge med runde hjørner (R-32).
 */
export function Kurvside({ feil, start }: { feil?: string; start?: Kurv }) {
  // Serveren sender kurven med, så siden viser varene også uten JavaScript.
  const kurv = useKurv().kurv ?? start ?? null
  if (!kurv) return <p className="text-sand-ink">Henter handlekurven …</p>
  const tom = kurv.linjer.length === 0
  return (
    <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
      <div className="min-w-0">
        {feil && (
          <p
            role="alert"
            className="mb-6 rounded-xl border border-status-feil bg-paper px-5 py-3 text-status-feil"
          >
            {feil}
          </p>
        )}
        {kurv.meldinger.length > 0 && (
          <div className="mb-6">
            <Kurvmeldinger meldinger={kurv.meldinger} />
          </div>
        )}
        {tom ? (
          <div className="flex flex-col items-start py-10">
            <span className="grid size-16 place-items-center rounded-full bg-regina-pink-50" aria-hidden>
              <ShoppingBag className="size-7 text-regina-pink" strokeWidth={1.5} />
            </span>
            <p className="mt-6 font-heading text-2xl">Handlekurven er tom</p>
            <p className="mt-2 text-sand-ink">Kanskje du finner noe blant nisjeduftene?</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/produktkategori/duft/nisjeduft/">Se nisjeduft</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-paper">
                <Link href="/merker/">Se alle merker</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-sand-200 bg-paper px-5 md:px-6">
            <Kurvlinjer kurv={kurv} />
          </div>
        )}
      </div>
      {!tom && (
        <aside
          className="self-start rounded-2xl bg-regina-pink-50 p-6 lg:sticky lg:top-36"
          aria-label="Oppsummering"
        >
          <Kassedel kurv={kurv} />
        </aside>
      )}
    </div>
  )
}
