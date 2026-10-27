'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, type ReactNode } from 'react'

/**
 * Produktkarusell som vanlig rad med scroll-snap: sveip på mobil, piler på stor skjerm. Virker uten
 * JavaScript (raden kan rulles), og knappene ruller bare – ingen automatisk bevegelse.
 */
export function Produktrad({ tittel, children }: { tittel: string; children: ReactNode }) {
  const rad = useRef<HTMLUListElement>(null)
  const rull = (retning: 1 | -1) => {
    const el = rad.current
    if (!el) return
    const fart = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    el.scrollBy({ left: retning * el.clientWidth * 0.8, behavior: fart })
  }
  return (
    <div className="relative">
      <div className="absolute -top-16 right-0 hidden gap-2 md:flex">
        <button
          type="button"
          onClick={() => rull(-1)}
          className="grid size-11 place-items-center border border-sand-200 hover:border-regina-plum"
          aria-label={`Forrige i ${tittel}`}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => rull(1)}
          className="grid size-11 place-items-center border border-sand-200 hover:border-regina-plum"
          aria-label={`Neste i ${tittel}`}
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
      <ul
        ref={rad}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:thin] md:mx-0 md:scroll-px-0 md:gap-6 md:px-0"
        aria-label={tittel}
      >
        {children}
      </ul>
    </div>
  )
}

export function Produktradelement({ children }: { children: ReactNode }) {
  return <li className="w-[62%] shrink-0 snap-start sm:w-[40%] md:w-[30%] lg:w-[23%]">{children}</li>
}
