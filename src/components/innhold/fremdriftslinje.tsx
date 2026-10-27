'use client'

// Bygget etter «Growth Story Timeline» (ShadcnSpace, MIT) på 21st.dev – https://21st.dev/@shadcnspace/components/timeline-01. Egen kode; ingen kode er kopiert.

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * Linjen i tidslinjen fylles i plomme mens man ruller, med en rosa prikk i tuppen. Bare transform (scaleY og
 * translateY), satt direkte på elementene uten ny rendering. Uten JavaScript og ved redusert bevegelse står
 * linjen ferdig fylt og prikken vises ikke.
 */
export function Fremdriftslinje({ className }: { className?: string }) {
  const ramme = useRef<HTMLSpanElement>(null)
  const linje = useRef<HTMLSpanElement>(null)
  const prikk = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ramme.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let neste = 0
    const oppdater = () => {
      neste = 0
      const r = el.getBoundingClientRect()
      // Fylt til et punkt litt over midten av skjermen, som i demoen.
      const andel = Math.min(1, Math.max(0, (window.innerHeight * 0.55 - r.top) / Math.max(r.height, 1)))
      if (linje.current) linje.current.style.transform = `scaleY(${andel})`
      if (prikk.current) prikk.current.style.transform = `translateY(${andel * r.height}px)`
    }
    const planlegg = () => {
      if (!neste) neste = requestAnimationFrame(oppdater)
    }
    oppdater()
    if (prikk.current) prikk.current.style.opacity = '1'
    window.addEventListener('scroll', planlegg, { passive: true })
    window.addEventListener('resize', planlegg)
    return () => {
      cancelAnimationFrame(neste)
      window.removeEventListener('scroll', planlegg)
      window.removeEventListener('resize', planlegg)
    }
  }, [])

  return (
    <span ref={ramme} className={cn('pointer-events-none absolute inset-y-0 w-px', className)} aria-hidden>
      <span className="absolute inset-0 bg-sand-200" />
      <span ref={linje} className="absolute inset-0 origin-top bg-regina-plum" />
      <span ref={prikk} className="absolute top-0 left-1/2 -mt-1 -ml-1 size-2 bg-regina-pink opacity-0" />
    </span>
  )
}
