'use client'

import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import type { Nisjemerke } from '@/lib/forside'
import { merkeUrl } from '@/lib/lenker'
import { cn } from '@/lib/utils'

/**
 * Nisjemerkene som nummerert liste med forhåndsvisning: peker eller fokus på en rad viser merkets mest solgte
 * flaske i rammen ved siden av. Mønsteret er fra 21st.dev («Interactive List Preview», hyperiux, MIT, og
 * «Hover Image List», educalvolpz, MIT), bygget her uten gsap/motion – bare opacity og transform. Uten
 * JavaScript er lista vanlige lenker, og den første flasken står i rammen.
 */
export function Merkeliste({ merker }: { merker: Nisjemerke[] }) {
  const [aktiv, setAktiv] = useState(0)
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
      <ol className="border-t border-sand-200 lg:col-span-7">
        {merker.map((m, i) => (
          <li key={m.slug} className="border-b border-sand-200">
            <Link
              href={merkeUrl(m.slug)}
              onMouseEnter={() => setAktiv(i)}
              onFocus={() => setAktiv(i)}
              className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 py-5 md:grid-cols-[3.5rem_1fr_auto] md:py-7"
            >
              <span className="text-sm text-sand-ink tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <span
                className={cn(
                  'font-heading text-3xl leading-tight transition-transform duration-(--dur-base) ease-out group-hover:translate-x-3 md:text-5xl xl:text-6xl',
                  i === aktiv && 'lg:translate-x-3',
                )}
              >
                {m.navn}
              </span>
              <span className="flex items-center gap-3 text-sm text-sand-ink">
                <span className="hidden sm:inline">{m.antall} produkter</span>
                <ArrowRight
                  className="size-5 text-regina-plum transition-transform duration-(--dur-base) group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {/* Rammen er pynt for seende med peker: flaskene står også på merkesidene, så den skjules for skjermlesere. */}
      <div className="hidden lg:col-span-4 lg:col-start-9 lg:block" aria-hidden>
        <div className="sticky top-28">
          <div className="relative isolate aspect-[4/5] overflow-hidden border border-sand-200 bg-paper">
            {merker.map((m, i) =>
              m.produkt?.bilde ? (
                <Image
                  key={m.slug}
                  src={m.produkt.bilde}
                  alt=""
                  fill
                  sizes="30vw"
                  className={cn(
                    'object-contain p-[12%] mix-blend-multiply transition duration-(--dur-slow) ease-out',
                    i === aktiv ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0',
                  )}
                />
              ) : null,
            )}
          </div>
          <p className="mt-3 flex justify-between gap-4 text-sm text-sand-ink">
            <span>{merker[aktiv]?.produkt?.navn ?? merker[aktiv]?.navn}</span>
            <span className="tabular-nums">{merker[aktiv]?.produkt?.pris}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
