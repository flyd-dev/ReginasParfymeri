'use client'

import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import type { Visningsprodukt } from '@/lib/forside'
import { produktUrl } from '@/lib/lenker'
import { cn } from '@/lib/utils'

/**
 * Utstillingsvinduet: én nisjeduft om gangen, stort bilde på papirflate og produktets egen tekst. Ingen
 * automatisk skifting – kunden blar selv. Uten JavaScript vises den første.
 */
export function Utstillingsvindu({ produkter }: { produkter: Visningsprodukt[] }) {
  const [aktiv, setAktiv] = useState(0)
  const n = produkter.length
  if (n === 0) return null
  const ga = (steg: number) => setAktiv((a) => (a + steg + n) % n)

  return (
    <div className="relative">
      <div className="grid">
        {produkter.map((p, i) => (
          <article
            key={p.slug}
            className={cn(
              'col-start-1 row-start-1 grid gap-8 transition-opacity duration-(--dur-slow) md:grid-cols-12 md:items-center',
              i === aktiv ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
            aria-hidden={i !== aktiv}
            inert={i !== aktiv}
          >
            <Link
              href={produktUrl(p.slug)}
              className="group relative block aspect-square overflow-hidden bg-paper md:col-span-6 lg:col-span-5"
            >
              {p.bilde && (
                <Image
                  src={p.bilde}
                  alt={p.alt}
                  fill
                  sizes="(min-width: 1024px) 38vw, (min-width: 768px) 50vw, 100vw"
                  className="object-contain p-[10%] mix-blend-multiply transition-transform duration-(--dur-slow) ease-out group-hover:scale-[1.04]"
                />
              )}
            </Link>
            <div className="text-sand-50 md:col-span-6 lg:col-span-6 lg:col-start-7">
              {p.merke && <p className="text-sm tracking-[0.18em] text-sand-100 uppercase">{p.merke}</p>}
              <h3 className="mt-3 text-4xl leading-[1.05] md:text-5xl xl:text-6xl">{p.navn}</h3>
              {p.utdrag && <p className="mt-6 max-w-xl text-lg text-sand-100">{p.utdrag}</p>}
              <p className="mt-6 text-xl tabular-nums">{p.pris}</p>
              <Link
                href={produktUrl(p.slug)}
                className="mt-6 inline-flex items-center gap-2 border-b border-regina-pink pb-1 text-sand-50 transition-colors duration-(--dur-fast) hover:border-sand-50"
              >
                Se duften <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </article>
        ))}
      </div>
      {n > 1 && (
        <div className="mt-10 flex items-end gap-6 border-t border-white/15">
          {/* Faner med nummer og merke, som i «Elegant Carousel» på 21st.dev – men uten automatisk skifting. */}
          <ol
            className="-mb-px grid flex-1 gap-x-3 overflow-x-auto"
            style={{ gridTemplateColumns: `repeat(${n}, minmax(7rem, 1fr))` }}
          >
            {produkter.map((p, i) => (
              <li key={p.slug}>
                <button
                  type="button"
                  onClick={() => setAktiv(i)}
                  aria-pressed={i === aktiv}
                  className="group relative block w-full pt-4 pb-1 text-left text-sm text-sand-100"
                >
                  <span
                    className={cn(
                      'absolute top-0 left-0 h-0.5 w-full origin-left bg-regina-pink transition-transform duration-(--dur-slow) ease-out',
                      i === aktiv ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-25',
                    )}
                    aria-hidden
                  />
                  <span className="block tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <span className={cn('mt-1 block truncate', i === aktiv && 'text-sand-50')}>
                    {p.merke ?? p.navn}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <div className="hidden gap-2 pt-4 sm:flex">
            <button
              type="button"
              onClick={() => ga(-1)}
              className="grid size-11 place-items-center border border-white/25 text-sand-50 hover:border-sand-50"
              aria-label="Forrige duft"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => ga(1)}
              className="grid size-11 place-items-center border border-white/25 text-sand-50 hover:border-sand-50"
              aria-label="Neste duft"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
          <p className="sr-only" aria-live="polite">
            Duft {aktiv + 1} av {n}: {produkter[aktiv]?.navn}
          </p>
        </div>
      )}
    </div>
  )
}
