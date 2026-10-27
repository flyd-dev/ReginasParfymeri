'use client'

import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { Inn } from '@/components/bevegelse/inn'
import type { Visningsprodukt } from '@/lib/forside'
import { produktUrl } from '@/lib/lenker'
import { cn } from '@/lib/utils'

type Tilstand = 'aktiv' | 'forrige' | 'av'

/** Hvor langt (px) fingeren må dra sidelengs før det regnes som et sveip. */
const SVEIP = 48

/**
 * Tekstlinje som glir inn forskjøvet når duften blir aktiv, og tones raskt ut når den går.
 * `k` er plassen i rekken (forsinkelse k × --stagger etter at teppet har begynt).
 */
const linje = (t: Tilstand) =>
  t === 'aktiv'
    ? 'translate-y-0 opacity-100 transition-[opacity,translate] delay-[calc(var(--k)*var(--stagger)_+_180ms)] duration-(--dur-inn) ease-ut'
    : t === 'forrige'
      ? 'opacity-0 transition-opacity duration-(--dur-fast) ease-out'
      : 'translate-y-6 opacity-0 transition-none'

/**
 * Utstillingsvinduet: én nisjeduft om gangen, stort bilde på papirflate og produktets egen tekst. Ingen
 * automatisk skifting – kunden blar selv med faner, piler eller ved å sveipe sidelengs på mobil. Uten
 * JavaScript vises den første.
 *
 * Bytte: papirflaten med den nye flasken stiger opp over den forrige som et teppe (flasken står i ro mens kanten
 * går opp, og skaleres svakt ned), og tekstlinjene glir inn én og én. Den forrige blir liggende under til den er
 * dekket. Bare transform og opacity; ved redusert bevegelse skjer byttet med en gang. Papiret ligger på flaten
 * som animeres, så multiply alltid har papir under seg.
 */
export function Utstillingsvindu({ produkter }: { produkter: Visningsprodukt[] }) {
  const [{ aktiv, forrige }, setVis] = useState({ aktiv: 0, forrige: -1 })
  const faner = useRef<HTMLOListElement>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const sveipet = useRef(false)
  const n = produkter.length

  const velg = (neste: number) => setVis((v) => (neste === v.aktiv ? v : { aktiv: neste, forrige: v.aktiv }))
  const ga = (steg: number) => velg((aktiv + steg + n) % n)

  // Fanen til duften som er valgt, skal synes i fanelisten (den rulles sidelengs på mobil) – uten å rulle siden.
  useEffect(() => {
    const ol = faner.current
    const li = ol?.children[aktiv]
    if (forrige < 0 || !ol || !(li instanceof HTMLElement)) return
    if (li.offsetLeft >= ol.scrollLeft && li.offsetLeft + li.offsetWidth <= ol.scrollLeft + ol.clientWidth)
      return
    const fart = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    ol.scrollTo({ left: li.offsetLeft, behavior: fart })
  }, [aktiv, forrige])

  if (n === 0) return null

  const tilstand = (i: number): Tilstand => (i === aktiv ? 'aktiv' : i === forrige ? 'forrige' : 'av')

  // Sveip med finger eller penn. Musen bruker pilene og fanene.
  const ned = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' || n < 2) return
    start.current = { x: e.clientX, y: e.clientY }
    sveipet.current = false
  }
  const opp = (e: PointerEvent) => {
    const s = start.current
    start.current = null
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (Math.abs(dx) < SVEIP || Math.abs(dx) < Math.abs(dy) * 1.5) return
    sveipet.current = true
    ga(dx < 0 ? 1 : -1)
  }

  return (
    <div className="relative">
      <div
        className="grid touch-pan-y touch-pinch-zoom"
        onPointerDown={ned}
        onPointerUp={opp}
        onPointerCancel={() => {
          start.current = null
        }}
        onClickCapture={(e) => {
          // Et sveip over bildet skal ikke åpne produktet.
          if (!sveipet.current) return
          sveipet.current = false
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        {produkter.map((p, i) => {
          const t = tilstand(i)
          return (
            <article
              key={p.slug}
              className={cn(
                'col-start-1 row-start-1 grid gap-8 md:grid-cols-12 md:items-center',
                t === 'aktiv' ? 'z-10' : 'pointer-events-none',
                t === 'av' && 'invisible',
              )}
              aria-hidden={t !== 'aktiv'}
              inert={t !== 'aktiv'}
            >
              {/* Inngang når vinduet kommer til syne: hele flaten stiger opp bak et teppe. */}
              <Inn variant="teppe" className="relative aspect-square md:col-span-6 lg:col-span-5">
                <Link
                  href={produktUrl(p.slug)}
                  className="teppe group absolute inset-0 block"
                  draggable={false}
                >
                  <span
                    className={cn(
                      'absolute inset-0 overflow-hidden',
                      // Aktiv og forrige har samme overgang: blir det byttet igjen før teppet er oppe, fullfører
                      // den forrige sin bevegelse under den nye i stedet for å hoppe.
                      t === 'av'
                        ? 'translate-y-full transition-none'
                        : 'translate-y-0 transition-transform duration-(--dur-lang) ease-ut',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute inset-0 bg-paper',
                        t === 'av'
                          ? '-translate-y-full scale-[1.06] transition-none'
                          : 'translate-y-0 scale-100 transition-transform duration-(--dur-lang) ease-ut',
                      )}
                    >
                      {p.bilde && (
                        <Image
                          src={p.bilde}
                          alt={p.alt}
                          fill
                          draggable={false}
                          sizes="(min-width: 1024px) 38vw, (min-width: 768px) 50vw, 100vw"
                          className="object-contain p-[10%] mix-blend-multiply transition-transform duration-(--dur-slow) ease-out group-hover:scale-[1.04]"
                        />
                      )}
                    </span>
                  </span>
                </Link>
              </Inn>
              <Inn i={2} className="text-sand-50 md:col-span-6 lg:col-span-6 lg:col-start-7">
                {p.merke && (
                  <p
                    className={cn('text-sm tracking-[0.18em] text-sand-100 uppercase', linje(t))}
                    style={{ '--k': 0 } as CSSProperties}
                  >
                    {p.merke}
                  </p>
                )}
                <h3
                  className={cn('mt-3 text-4xl leading-[1.05] md:text-5xl xl:text-6xl', linje(t))}
                  style={{ '--k': 1 } as CSSProperties}
                >
                  {p.navn}
                </h3>
                {p.utdrag && (
                  <p
                    className={cn('mt-6 max-w-xl text-lg text-sand-100', linje(t))}
                    style={{ '--k': 2 } as CSSProperties}
                  >
                    {p.utdrag}
                  </p>
                )}
                <p
                  className={cn('mt-6 text-xl tabular-nums', linje(t))}
                  style={{ '--k': 3 } as CSSProperties}
                >
                  {p.pris}
                </p>
                <p className={linje(t)} style={{ '--k': 4 } as CSSProperties}>
                  <Link
                    href={produktUrl(p.slug)}
                    className="mt-6 inline-flex min-h-11 items-center gap-2 border-b border-regina-pink pb-1 text-sand-50 transition-colors duration-(--dur-fast) hover:border-sand-50"
                  >
                    Se duften <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </p>
              </Inn>
            </article>
          )
        })}
      </div>
      {n > 1 && (
        <div className="mt-10 flex items-end gap-6 border-t border-white/15">
          {/* Faner med nummer og merke, som i «Elegant Carousel» på 21st.dev – men uten automatisk skifting. */}
          <ol
            ref={faner}
            className="relative -mb-px grid flex-1 gap-x-3 overflow-x-auto [scrollbar-width:none]"
            style={{ gridTemplateColumns: `repeat(${n}, minmax(7rem, 1fr))` }}
          >
            {produkter.map((p, i) => (
              <li key={p.slug}>
                <button
                  type="button"
                  onClick={() => velg(i)}
                  aria-pressed={i === aktiv}
                  className="group relative block min-h-11 w-full pt-4 pb-1 text-left text-sm text-sand-100"
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
