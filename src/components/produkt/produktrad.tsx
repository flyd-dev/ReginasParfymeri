// Bygget etter «Gallery 6» (Shadcnblocks.com, lisens ikke oppgitt) på 21st.dev – https://21st.dev/@shadcnblockscom/components/gallery6. Egen kode; ingen kode er kopiert – bare idéen er brukt.
'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const ingenAbonnement = () => () => {}

/**
 * Produktkarusell som «hylle»: raden løper ut til skjermkanten, og pilene står til høyre på høyde med
 * seksjonsoverskriften over (som i Gallery 6). Vanlig rad med scroll-snap: sveip på mobil, piler på stor skjerm,
 * og en pil blir svak når raden er ved enden. Virker uten JavaScript (raden kan rulles, rullefeltet vises), og
 * knappene ruller bare – ingen automatisk bevegelse.
 */
export function Produktrad({ tittel, children }: { tittel: string; children: ReactNode }) {
  const rad = useRef<HTMLUListElement>(null)
  const [kant, setKant] = useState({ start: true, slutt: false })
  const klar = useSyncExternalStore(
    ingenAbonnement,
    () => true,
    () => false,
  )

  useEffect(() => {
    const el = rad.current
    if (!el) return
    const mal = () => {
      const start = el.scrollLeft <= 4
      const slutt = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
      setKant((k) => (k.start === start && k.slutt === slutt ? k : { start, slutt }))
    }
    mal()
    el.addEventListener('scroll', mal, { passive: true })
    const observator = new ResizeObserver(mal)
    observator.observe(el)
    return () => {
      el.removeEventListener('scroll', mal)
      observator.disconnect()
    }
  }, [])

  // Blar så mange hele kort som får plass; scroll-snap legger raden på et kort.
  const rull = (retning: 1 | -1) => {
    const el = rad.current
    const forste = el?.firstElementChild
    if (!el || !(forste instanceof HTMLElement)) return
    const stil = getComputedStyle(el)
    const steg = forste.offsetWidth + (Number.parseFloat(stil.columnGap) || 0)
    const synlig = el.clientWidth - Number.parseFloat(stil.paddingLeft) - Number.parseFloat(stil.paddingRight)
    const antall = Math.max(1, Math.floor((synlig + 1) / steg))
    const fart = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    el.scrollBy({ left: retning * antall * steg, behavior: fart })
  }

  const knapp =
    'group/pil grid size-11 place-items-center border border-sand-200 text-regina-plum transition-[border-color,opacity] duration-(--dur-fast) hover:border-regina-plum aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:border-sand-200'
  const ikon = 'size-4 transition-transform duration-(--dur-fast) ease-out'

  return (
    // flow-root: radens negative toppmarg skal ikke flytte pilene.
    <div className="relative flow-root">
      {/* Pilene kommer først med JavaScript; uten det rulles raden med rullefeltet. */}
      <div className={cn('absolute -top-16 right-0 hidden gap-2', klar && 'md:flex')}>
        <button
          type="button"
          onClick={() => !kant.start && rull(-1)}
          aria-disabled={kant.start || undefined}
          className={knapp}
          aria-label={`Forrige i ${tittel}`}
        >
          <ArrowLeft className={cn(ikon, !kant.start && 'group-hover/pil:-translate-x-0.5')} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => !kant.slutt && rull(1)}
          aria-disabled={kant.slutt || undefined}
          className={knapp}
          aria-label={`Neste i ${tittel}`}
        >
          <ArrowRight className={cn(ikon, !kant.slutt && 'group-hover/pil:translate-x-0.5')} aria-hidden />
        </button>
      </div>
      <ul
        ref={rad}
        className={cn(
          // Løper ut i sidemargen på begge sider (px-4/px-6 er seksjonens egen marg), kortene snapper til kanten.
          // Luft over og under så fokusrammen rundt kortene ikke klippes.
          '-mx-4 -mt-2 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto overscroll-x-contain px-4 pt-2 pb-4 md:-mx-6 md:scroll-px-6 md:gap-6 md:px-6',
          '[scrollbar-color:var(--sand-ink)_transparent] [scrollbar-width:thin]',
          // Med JavaScript tar pilene over på stor skjerm, og rullefeltet skjules der.
          klar && 'md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden',
        )}
        aria-label={tittel}
      >
        {children}
      </ul>
    </div>
  )
}

export function Produktradelement({ children, stor = false }: { children: ReactNode; stor?: boolean }) {
  return (
    <li
      className={
        stor
          ? 'w-[78%] shrink-0 snap-start sm:w-[46%] md:w-[38%] lg:w-[30%]'
          : 'w-[62%] shrink-0 snap-start sm:w-[40%] md:w-[30%] lg:w-[23%]'
      }
    >
      {children}
    </li>
  )
}
