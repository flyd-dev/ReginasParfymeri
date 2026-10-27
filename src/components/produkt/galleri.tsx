// Bygget etter «Thumbnail image viewer» (ibrandify, MIT) på 21st.dev – https://21st.dev/@ibrandify/components/thumbnail-image-viewer. Egen kode; ingen kode er kopiert.
// Fremdriftslinjen på mobil er bygget etter «Scroll Progress» (Julien Thibeaut / ibelick, MIT) på 21st.dev – https://21st.dev/@ibelick/components/scroll-progress. Egen kode; ingen kode er kopiert.
'use client'

import './overganger.css'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  ViewTransition,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'
import type { Bilde } from '@/lib/woocommerce/typer'
import { MORFKLASSE, morfnavn } from './morfnavn'
import { Produktbilde } from './produktbilde'

const tosifret = (n: number) => String(n).padStart(2, '0')
const ingenAbonnement = () => () => {}

/**
 * Produktgalleri (opptil 8 bilder): stort bilde på papirflate med teller «01 / 04», bildetekst, forrige/neste
 * over bildet og en nummerert miniatyrrad der valgt bilde har en tynn ramme.
 *
 * Uten JavaScript er bildene en rad med scroll-snap, og miniatyrene er lenker til hvert bilde (#bilde-2 …), så
 * alle bildene kan nås. Teller og bildetekst hører til hvert bilde og stemmer derfor også da. Med JavaScript
 * tones bildene over i hverandre på stor skjerm, og det nye bildet legger seg på plass fra en svak forstørrelse;
 * mobilen beholder sveipingen og får en tynn linje som følger fingeren.
 *
 * Det første bildet er målet for overgangen fra produktkortet (morf.tsx): samme navn, så kortbildet glir hit.
 */
export function Galleri({ bilder, navn, produktId }: { bilder: Bilde[]; navn: string; produktId: number }) {
  const liste = bilder.slice(0, 8)
  const antall = liste.length
  const flere = antall > 1
  const [aktiv, setAktiv] = useState(0)
  // Overtoningen slås på først når kunden blar. Ellers toner bildene bak ut rett etter hydrering, og tallmerket
  // deres står halvgjennomsiktig et øyeblikk (axe måler kontrasten på det).
  const [blaet, setBlaet] = useState(false)
  // Sann etter hydrering. Før det, og uten JavaScript, er galleriet bare raden med bilder og lenker.
  const klar = useSyncExternalStore(
    ingenAbonnement,
    () => true,
    () => false,
  )
  const spor = useRef<HTMLUListElement>(null)
  const miniatyrer = useRef<HTMLOListElement>(null)
  const fremdrift = useRef<HTMLSpanElement>(null)

  // Mobil: miniatyrraden ruller selv så valgt bilde alltid synes, også når man sveiper i bildet.
  useEffect(() => {
    const rad = miniatyrer.current
    const valgt = rad?.children[aktiv]
    if (!rad || !(valgt instanceof HTMLElement) || rad.scrollWidth <= rad.clientWidth) return
    const venstre = valgt.offsetLeft - (rad.clientWidth - valgt.offsetWidth) / 2
    const fart = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    rad.scrollTo({ left: venstre, behavior: fart })
  }, [aktiv])

  if (antall === 0) {
    return (
      <div className="grid aspect-square min-w-0 place-items-center bg-paper text-sand-ink">
        Bilde mangler for {navn}
      </div>
    )
  }

  const gaaTil = (i: number) => {
    const neste = (i + antall) % antall
    setBlaet(true)
    setAktiv(neste)
    // På mobil ruller raden; på stor skjerm er den ikke rullbar, og kallet gjør ingenting.
    const el = spor.current
    if (!el) return
    const fart = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    el.scrollTo({ left: neste * el.clientWidth, behavior: fart })
  }

  const piltaster = (e: KeyboardEvent) => {
    if (!flere || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return
    e.preventDefault()
    gaaTil(aktiv + (e.key === 'ArrowRight' ? 1 : -1))
  }

  // Trykk gir et lite søkk (transform), og pilen dytter i retningen ved peker.
  const knapp =
    'group/pil grid size-11 place-items-center border border-sand-200 bg-paper text-regina-plum transition-[border-color,transform] duration-(--dur-fast) ease-out hover:border-regina-plum active:scale-95'
  const pil = 'size-4 transition-transform duration-(--dur-fast) ease-out'

  return (
    // min-w-0: radene med bilder og miniatyrer skal rulle, ikke gjøre rutenettkolonnen bredere.
    <div onKeyDown={piltaster} className="min-w-0">
      <div className="relative">
        <ul
          ref={spor}
          id="galleri-bilder"
          tabIndex={flere ? 0 : undefined}
          aria-label={`Bilder av ${navn}`}
          onScroll={(e) => {
            const el = e.currentTarget
            if (el.clientWidth === 0) return
            setAktiv(Math.min(antall - 1, Math.round(el.scrollLeft / el.clientWidth)))
            // Linjen følger fingeren direkte (ingen re-render): andelen av raden som er rullet.
            const andel = el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth)
            fremdrift.current?.style.setProperty('--andel', String(Math.min(1, Math.max(0, andel))))
          }}
          className={cn(
            'flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            klar && 'md:grid md:overflow-hidden',
          )}
        >
          {liste.map((b, i) => (
            <li
              key={b.src}
              id={`bilde-${i + 1}`}
              className={cn(
                // scroll-mt: uten JavaScript hopper miniatyrlenken hit, og bildet skal ikke havne under toppen.
                'w-full shrink-0 snap-center scroll-mt-28 md:scroll-mt-36',
                klar && 'md:[grid-area:1/1]',
                klar && blaet && 'md:transition-opacity md:duration-(--dur-slow) md:ease-out',
                klar && (i === aktiv ? 'md:opacity-100' : 'md:pointer-events-none md:opacity-0'),
              )}
            >
              <figure>
                <Morfmal produktId={produktId} aktiv={i === 0}>
                  <div className="relative isolate aspect-square overflow-hidden bg-paper">
                    <Image
                      src={b.src}
                      alt={i === 0 ? b.alt : `${b.alt} – bilde ${i + 1} av ${antall}`}
                      fill
                      priority={i === 0}
                      sizes="(min-width: 1536px) 770px, (min-width: 768px) 55vw, 100vw"
                      className={cn(
                        'object-contain p-[6%] mix-blend-multiply',
                        // Stor skjerm: det nye bildet legger seg på plass mens det toner inn.
                        klar &&
                          blaet &&
                          'md:transition-transform md:duration-(--dur-inn) md:ease-(--ease-ut)',
                        klar && i !== aktiv && 'md:scale-[1.04]',
                      )}
                    />
                    {flere && (
                      <p
                        className="absolute top-3 right-3 border border-sand-200 bg-paper px-2.5 py-1 text-sm leading-none tabular-nums"
                        aria-hidden
                      >
                        <span className="font-medium">{tosifret(i + 1)}</span>
                        <span className="text-sand-ink"> / {tosifret(antall)}</span>
                      </p>
                    )}
                  </div>
                </Morfmal>
                {flere && (
                  <figcaption className="flex h-12 items-center text-sm">
                    <span className="truncate">
                      {navn} <span className="text-sand-ink">· bilde {i + 1}</span>
                    </span>
                  </figcaption>
                )}
              </figure>
            </li>
          ))}
        </ul>

        {flere && klar && (
          // Nede til høyre i bildeflaten: bildeteksten under er h-12, pluss 0,75rem luft.
          <div className="absolute right-3 bottom-15 flex gap-2">
            <button
              type="button"
              onClick={() => gaaTil(aktiv - 1)}
              className={knapp}
              aria-label="Forrige bilde"
              aria-controls="galleri-bilder"
            >
              <ChevronLeft className={cn(pil, 'group-hover/pil:-translate-x-0.5')} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => gaaTil(aktiv + 1)}
              className={knapp}
              aria-label="Neste bilde"
              aria-controls="galleri-bilder"
            >
              <ChevronRight className={cn(pil, 'group-hover/pil:translate-x-0.5')} aria-hidden />
            </button>
          </div>
        )}

        {flere && klar && (
          // Mobil: tynn linje i underkanten av bildet som følger sveipingen. Andelen (--andel) settes i onScroll.
          <span
            className="pointer-events-none absolute inset-x-0 bottom-12 h-0.5 bg-sand-200 md:hidden"
            aria-hidden
          >
            <span
              ref={fremdrift}
              className="block h-full bg-regina-plum"
              style={{
                width: `${100 / antall}%`,
                transform: `translateX(calc(var(--andel, 0) * ${antall - 1} * 100%))`,
              }}
            />
          </span>
        )}
      </div>

      {flere && (
        <ol
          ref={miniatyrer}
          className="relative -m-1 flex gap-2 overflow-x-auto p-1 [scrollbar-width:none] md:grid md:grid-cols-6 md:gap-3 lg:grid-cols-8 [&::-webkit-scrollbar]:hidden"
          aria-label="Velg bilde"
        >
          {liste.map((b, i) => (
            <li key={b.src} className="shrink-0">
              <a
                href={`#bilde-${i + 1}`}
                aria-current={klar && i === aktiv ? 'true' : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  gaaTil(i)
                }}
                className="group/miniatyr relative block size-16 after:pointer-events-none after:absolute after:-inset-[3px] after:border after:border-transparent after:transition-colors after:duration-(--dur-fast) hover:after:border-sand-200 aria-[current=true]:after:border-regina-plum md:size-auto"
              >
                <Produktbilde src={b.src} alt="" sizes="80px" />
                <span className="sr-only">
                  Vis bilde {i + 1} av {antall}
                </span>
                <span
                  className="absolute bottom-1 left-1.5 text-xs leading-none text-sand-ink tabular-nums group-aria-[current=true]/miniatyr:font-medium group-aria-[current=true]/miniatyr:text-regina-plum"
                  aria-hidden
                >
                  {tosifret(i + 1)}
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

/** Det første bildet bærer navnet til overgangen fra produktkortet. Det står fast, så navnet er unikt på siden. */
function Morfmal({ produktId, aktiv, children }: { produktId: number; aktiv: boolean; children: ReactNode }) {
  if (!aktiv) return children
  return (
    <ViewTransition name={morfnavn(produktId)} enter={MORFKLASSE} default="none">
      {children}
    </ViewTransition>
  )
}
