'use client'

// Bygget etter «MapMarker» (mapcn, MIT) på 21st.dev – https://21st.dev/@mapcn/components/mapcn-map-marker. Egen kode; ingen kode er kopiert.

import { ArrowUpRight, Map as Kartikon } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { BILDER } from '@/content/bilder'
import { BUTIKK } from '@/content/butikk'
import { cn } from '@/lib/utils'

// Haraldsgata 138, Haugesund – koordinater fra OpenStreetMap Nominatim (node 2817037540), 27.10.2026.
// Utsnittet har markøren i midten, så OpenStreetMap sentrerer kartet på butikken.
const BBOX = '5.2647,59.4110,5.2737,59.4144'
const MARKOR = '59.412669,5.269193'

/**
 * Kartkort med markør og adressekort, som MapMarker fra mapcn – men uten maplibre-gl. Kartet lastes først når
 * kunden ber om det: OpenStreetMap-innbyggingen sender IP-adressen til en tredjepart, så ingenting hentes før
 * klikket (personvern). Før det står et rolig, skjematisk kart (bare dekor, ingen ekte gater) med markør i
 * plomme og adressekortet som «popup» over den.
 *
 * Etter klikket viser OpenStreetMap sin egen markør, fordi den følger kartet når man drar i det; vår markør kan
 * ikke det i en iframe. Adressekortet med «Veibeskrivelse» ligger over kartet (under kartet på mobil).
 */
export function Kart({ className }: { className?: string }) {
  const [vis, setVis] = useState(false)
  const ramme = useRef<HTMLIFrameElement>(null)

  // Knappen forsvinner ved klikk; fokus flyttes til kartet så tastaturbrukere ikke havner øverst på siden.
  useEffect(() => {
    if (vis) ramme.current?.focus()
  }, [vis])

  return (
    <div className="border border-sand-200 bg-paper">
      <div
        className={cn(
          'relative isolate aspect-[4/5] overflow-hidden bg-sand-100 sm:aspect-[16/9]',
          className,
        )}
      >
        {vis ? (
          <>
            <iframe
              ref={ramme}
              title={`Kart over ${BUTIKK.adresse.gate} i ${BUTIKK.adresse.sted}`}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${BBOX}&layer=mapnik&marker=${MARKOR}`}
              className="absolute inset-0 size-full"
              referrerPolicy="no-referrer"
            />
            <Adressekort className="absolute bottom-4 left-4 hidden w-72 border sm:block" />
          </>
        ) : (
          <>
            <Skisse />
            <Markor />
            {/* Adressekortet som popup over markøren, med en liten spiss ned mot den. */}
            <div className="absolute bottom-[calc(50%+1.75rem)] left-1/2 w-[min(18rem,calc(100%-2rem))] -translate-x-1/2">
              <Adressekort className="border" />
              <span
                className="absolute -bottom-[7px] left-1/2 -ml-1.5 size-3 rotate-45 border-r border-b border-sand-200 bg-paper"
                aria-hidden
              />
            </div>
          </>
        )}
      </div>
      {vis ? (
        <Adressekort className="border-t sm:hidden" />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-sand-200 px-4 py-3 md:px-5">
          <p className="max-w-md text-sand-ink">Kartet hentes fra OpenStreetMap når du ber om det.</p>
          <Button onClick={() => setVis(true)}>
            <Kartikon aria-hidden /> Vis kart
          </Button>
        </div>
      )}
    </div>
  )
}

/** Adressekortet: navn, adresse og veibeskrivelse (Google Maps-lenken fra Reginas egne sider). */
function Adressekort({ className }: { className?: string }) {
  return (
    <div className={cn('border-sand-200 bg-paper p-4', className)}>
      <div className="flex gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden bg-sand-100">
          <Image src={BILDER.fasade.bilde} alt="" fill sizes="64px" className="object-cover" />
        </div>
        <div className="min-w-0">
          <p className="font-heading text-xl leading-tight">{BUTIKK.navn}</p>
          <p className="mt-1 leading-snug text-sand-ink">
            {BUTIKK.adresse.gate}, {BUTIKK.adresse.postnr} {BUTIKK.adresse.sted}
          </p>
        </div>
      </div>
      <a
        href={BUTIKK.kart}
        rel="noopener"
        className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-regina-pink-strong underline-offset-4 hover:underline"
      >
        Veibeskrivelse <span className="sr-only">i Google Maps</span>
        <ArrowUpRight className="size-4" aria-hidden />
      </a>
    </div>
  )
}

/** Markøren: plomme med rosa prikk og en svak rosa ring – kantene følger tokens (0–2 px), derfor rombe. */
function Markor() {
  return (
    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden>
      <span className="absolute top-1/2 left-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-regina-pink/15" />
      <span className="relative grid size-5 rotate-45 place-items-center border-2 border-paper bg-regina-plum">
        <span className="size-1.5 bg-regina-pink" />
      </span>
    </span>
  )
}

/**
 * Skjematisk bykart i sandtoner: kvartaler, gater og et sund til venstre. Ikke et ekte kart – bare en rolig flate
 * før kunden velger å hente OpenStreetMap.
 */
function Skisse() {
  const langs = [
    { x: 300, b: 14 },
    { x: 600, b: 24 },
    { x: 860, b: 14 },
    { x: 1110, b: 12 },
  ]
  const tvers = [
    { y: -150, b: 10 },
    { y: 40, b: 12 },
    { y: 175, b: 10 },
    { y: 430, b: 12 },
    { y: 590, b: 10 },
    { y: 760, b: 12 },
  ]
  return (
    <svg
      className="absolute inset-0 size-full"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      focusable="false"
    >
      <g transform="rotate(-22 600 300)">
        <rect x="-500" y="-500" width="740" height="1600" className="fill-sand-200/70" />
        {tvers.map((g) => (
          <rect key={g.y} x="240" y={g.y} width="1500" height={g.b} className="fill-paper" />
        ))}
        {langs.map((g) => (
          <rect key={g.x} x={g.x - g.b / 2} y="-500" width={g.b} height="1600" className="fill-paper" />
        ))}
      </g>
    </svg>
  )
}
