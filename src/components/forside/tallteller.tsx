// Bygget etter «Number Ticker» (Magic UI, Dillion Verma, MIT) på 21st.dev – https://21st.dev/@dillionverma/components/number-ticker. Egen kode; ingen kode er kopiert.
'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/** Hvor lenge tellingen varer. Kurven bremser mot slutten, så de siste sifrene får tid. */
const VARIGHET = 1600

const formater = (n: number, aar: boolean) => (aar ? String(n) : new Intl.NumberFormat('nb-NO').format(n))

/** Står elementet alt synlig på skjermen (ferdig innfaset)? Da teller vi ikke – tallet ville hoppet tilbake. */
function alleredeSett(el: HTMLElement): boolean {
  const inn = el.closest<HTMLElement>('[data-inn]')
  return !inn || Number.parseFloat(getComputedStyle(inn).opacity) > 0.35
}

/**
 * Tall som teller opp når det kommer til syne, som «Number Ticker» i Magic UI. Bare ekte tall (årstall, antall
 * fra katalogen). Serveren skriver det ferdige tallet, så det står der uten JavaScript og ved redusert bevegelse.
 * Med bevegelse settes tallet til `fra` mens det ennå er usynlig (under bretten eller før inngangen), og telles
 * opp når det er i bildet. Bredden holdes av en usynlig kopi av sluttallet (ingen layoutskift), og skjermlesere
 * får bare sluttallet. Tallet som endres er unntaket fra «bare transform og opacity» (R-30).
 */
export function Tallteller({
  verdi,
  fra = 0,
  aar = false,
  i = 0,
  className,
}: {
  verdi: number
  /** Der tellingen starter. */
  fra?: number
  /** Årstall skrives uten mellomrom (1863, ikke 1 863). */
  aar?: boolean
  /** Forsinkelse i antall --stagger, så tellingen følger inngangen rundt. */
  i?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [vist, setVist] = useState(verdi)

  useEffect(() => {
    const el = ref.current
    if (!el || fra === verdi) return
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    let timer = 0
    let forste = true

    const tell = () => {
      const stagger = Number.parseFloat(getComputedStyle(el).getPropertyValue('--stagger')) || 0
      timer = window.setTimeout(() => {
        const t0 = performance.now()
        const steg = (naa: number) => {
          const t = Math.min(1, (naa - t0) / VARIGHET)
          const kurve = t === 1 ? 1 : 1 - 2 ** (-10 * t)
          setVist(Math.round(fra + (verdi - fra) * kurve))
          if (t < 1) raf = requestAnimationFrame(steg)
        }
        raf = requestAnimationFrame(steg)
      }, i * stagger)
    }

    const io = new IntersectionObserver(
      ([rad]) => {
        if (!rad) return
        if (forste) {
          forste = false
          if (rad.isIntersecting && alleredeSett(el)) {
            io.disconnect()
            return
          }
          setVist(fra)
        }
        if (rad.isIntersecting) {
          io.disconnect()
          tell()
        }
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [verdi, fra, i])

  return (
    <span className={cn('inline-grid tabular-nums', className)}>
      <span className="invisible col-start-1 row-start-1">{formater(verdi, aar)}</span>
      <span ref={ref} className="col-start-1 row-start-1" aria-hidden>
        {formater(vist, aar)}
      </span>
      <span className="sr-only">{formater(verdi, aar)}</span>
    </span>
  )
}
