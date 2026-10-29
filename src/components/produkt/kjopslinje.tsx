'use client'

import { useEffect, useState, useSyncExternalStore, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ingenAbonnement = () => () => {}

/** Høyden på den faste toppen på mobil (header-klient.tsx, h-16): kjøpsboksen er «forbi» når den er under den. */
const TOPP = 64

/**
 * Kjøpslinje på mobil (R-31): når kjøpsboksen er rullet forbi, glir en linje opp nederst med navn, pris og knappen,
 * innen rekkevidde for tommelen. Knappen gjør det samme som i kjøpsboksen – eller, for et variabelt produkt uten
 * valg, ruller den til variantvalget og setter fokus der (kunden velger selv). Linjen trekker seg unna når
 * kjøpsboksen eller bunnen av siden er i bildet.
 *
 * Linjen er en flytende pille i lys rosa med luft til kantene og over hjemmelinjen (safe area), som knappene på
 * flyd.no (R-32). Ingen skygge: en tynn rosa kant skiller den fra innholdet under.
 *
 * Bare med JavaScript og bare under md; uten JavaScript er kjøpsboksen et vanlig skjema. Når linjen er ute av
 * bildet, er den aria-hidden og inert, så den ikke finnes for skjermlesere og tastatur (og ikke gir to knapper med
 * samme navn). Ingen 21st.dev-komponent med lisens passet; mønsteret er vanlig i nettbutikker og koden er vår egen.
 */
export function Kjopslinje({
  mal,
  navn,
  prislinje,
  knapp,
  opptatt,
}: {
  /** Kjøpsboksen: linjen vises når den er rullet forbi. */
  mal: RefObject<HTMLElement | null>
  navn: string
  prislinje: string
  knapp: { tekst: string; handling: () => void }
  opptatt: boolean
}) {
  const klar = useSyncExternalStore(
    ingenAbonnement,
    () => true,
    () => false,
  )
  const [forbi, setForbi] = useState(false)
  const [bunn, setBunn] = useState(false)

  useEffect(() => {
    const el = mal.current
    if (!klar || !el) return
    const boks = new IntersectionObserver(
      ([rad]) => {
        if (!rad) return
        // Forbi = over toppen av vinduet. Under vinduet (før kunden har rullet ned) vises ikke linjen.
        setForbi(!rad.isIntersecting && rad.boundingClientRect.bottom <= (rad.rootBounds?.top ?? TOPP))
      },
      { rootMargin: `-${TOPP}px 0px 0px 0px` },
    )
    boks.observe(el)
    // Ved bunnen av siden ville linjen dekke lenkene i footeren.
    const footer = [...document.querySelectorAll('footer')].at(-1)
    const slutt = new IntersectionObserver(([rad]) => setBunn(Boolean(rad?.isIntersecting)))
    if (footer) slutt.observe(footer)
    return () => {
      boks.disconnect()
      slutt.disconnect()
    }
  }, [klar, mal])

  if (!klar) return null
  const synlig = forbi && !bunn

  return createPortal(
    <div
      className={cn(
        'fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 rounded-full border border-regina-pink-100 bg-regina-pink-50 transition-transform duration-(--dur-slow) ease-(--ease-ut) md:hidden',
        synlig ? 'translate-y-0' : 'translate-y-[calc(100%+1.5rem+env(safe-area-inset-bottom))]',
      )}
      aria-hidden={!synlig}
      inert={!synlig}
    >
      <div className="flex items-center gap-3 py-1.5 pr-1.5 pl-5">
        <div className="min-w-0 flex-1 leading-snug">
          <p className="truncate font-medium">{navn}</p>
          <p className="truncate text-sand-ink-deep tabular-nums">{prislinje}</p>
        </div>
        <Button type="button" size="lg" className="shrink-0 px-5" disabled={opptatt} onClick={knapp.handling}>
          {knapp.tekst}
        </Button>
      </div>
    </div>,
    document.body,
  )
}
