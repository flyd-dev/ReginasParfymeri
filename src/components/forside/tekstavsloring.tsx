// Bygget etter «Text Reveal» (Magic UI, Dillion Verma, MIT) på 21st.dev – https://21st.dev/@dillionverma/components/text-reveal. Egen kode; ingen kode er kopiert.
'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'

/** Hvor mange ord overgangen fra svak til full tekst strekker seg over. */
const RAMPE = 3

/**
 * Sitat der ordene går fra svake til fulle mens kunden ruller gjennom seksjonen, som «Text Reveal» i Magic UI –
 * men uten klistret høy seksjon og uten rullestyrte CSS-animasjoner (usikker støtte i Safari på iPhone).
 *
 * Et passivt rullelytter-kall med requestAnimationFrame regner ut hvor langt sitatet har kommet gjennom
 * skjermen (0–1) og setter én CSS-variabel, --fremdrift, på blockquote. Hvert ord regner sin egen opacity fra
 * den og sin plass (--w). Uten JavaScript og ved redusert bevegelse er variabelen ikke satt (standard 1), og
 * hele teksten står der med full farge. Lytteren er bare på mens sitatet er nær skjermen. Bare opacity.
 */
export function Tekstavsloring({ tekst, className }: { tekst: string; className?: string }) {
  const ref = useRef<HTMLQuoteElement>(null)
  const ord = tekst.split(/\s+/).filter(Boolean)

  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const mal = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const h = window.innerHeight
      // 0 når toppen av sitatet er nederst på skjermen, 1 når bunnen er godt over midten.
      const start = h * 0.88
      const slutt = h * 0.5 - r.height
      const p = Math.min(1, Math.max(0, (start - r.top) / (start - slutt)))
      el.style.setProperty('--fremdrift', p.toFixed(3))
    }
    const planlegg = () => {
      if (!raf) raf = requestAnimationFrame(mal)
    }
    const lytt = (pa: boolean) => {
      if (pa) {
        window.addEventListener('scroll', planlegg, { passive: true })
        window.addEventListener('resize', planlegg)
      } else {
        window.removeEventListener('scroll', planlegg)
        window.removeEventListener('resize', planlegg)
      }
    }
    mal()
    const io = new IntersectionObserver(
      ([rad]) => {
        lytt(Boolean(rad?.isIntersecting))
        planlegg()
      },
      { rootMargin: '20% 0px' },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      lytt(false)
      cancelAnimationFrame(raf)
      el.style.removeProperty('--fremdrift')
    }
  }, [])

  return (
    <blockquote
      ref={ref}
      className={cn(
        // opacity = (fremdrift × (antall ord + rampe) − plass) / rampe, holdt mellom 0,2 og 1.
        '[&>span]:[opacity:clamp(0.2,calc((var(--fremdrift,1)_*_(var(--n)_+_var(--rampe))_-_var(--w))_/_var(--rampe)),1)]',
        '[&>span]:transition-opacity [&>span]:duration-(--dur-fast) [&>span]:ease-linear',
        className,
      )}
      style={{ '--n': ord.length, '--rampe': RAMPE } as CSSProperties}
    >
      {ord.map((o, w) => (
        <span key={w} style={{ '--w': w } as CSSProperties}>
          {o}
          {w < ord.length - 1 ? ' ' : ''}
        </span>
      ))}
    </blockquote>
  )
}
