'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { kroner } from '@/lib/format'
import type { Kurv } from '@/lib/kurv/typer'
import { Kurvlinjer } from './handlekurv'
import { useKurv } from './kurv-provider'
import { Kurvmeldinger } from './kurvmeldinger'

/** Handlekurven som egen side (også målet for skjemaer uten JavaScript og for /kassen/ i dagens butikk). */
export function Kurvside({ feil, start }: { feil?: string; start?: Kurv }) {
  // Serveren sender kurven med, så siden viser varene også uten JavaScript.
  const kurv = useKurv().kurv ?? start ?? null
  if (!kurv) return <p className="text-sand-ink">Henter handlekurven …</p>
  const tom = kurv.linjer.length === 0
  return (
    <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
      <div>
        {feil && (
          <p role="alert" className="mb-6 border-l-2 border-status-feil bg-paper px-4 py-3 text-status-feil">
            {feil}
          </p>
        )}
        <Kurvmeldinger meldinger={kurv.meldinger} />
        {tom ? (
          <div className="py-10">
            <p className="font-heading text-2xl">Handlekurven er tom</p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/produktkategori/duft/nisjeduft/">Se nisjeduft</Link>
            </Button>
          </div>
        ) : (
          <Kurvlinjer kurv={kurv} />
        )}
      </div>
      {!tom && (
        <aside className="self-start border border-sand-200 bg-paper p-6" aria-label="Oppsummering">
          <dl className="flex items-baseline justify-between">
            <dt>
              Delsum ({kurv.antall} {kurv.antall === 1 ? 'vare' : 'varer'})
            </dt>
            <dd className="text-xl tabular-nums">{kroner(kurv.delsum)}</dd>
          </dl>
          <p className="mt-3 text-sm text-sand-ink">
            Prisene er inkl. mva. Frakt, rabatter og betaling med Vipps ordnes i kassen.
          </p>
          <form action="/api/kurv/til-kassen/" method="post" className="mt-6">
            <Button type="submit" size="lg" className="w-full">
              Gå til kassen
            </Button>
          </form>
        </aside>
      )}
    </div>
  )
}
