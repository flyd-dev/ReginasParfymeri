import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

/**
 * Fargeflate som feies inn fra en kant når den kommer til syne – store flater, 1100 ms (R-30). Pynt (aria-hidden).
 *
 * Ytre span er plassert av `className` og observeres av BevegelseSkript (data-inn="flate"); den står stille, så
 * IntersectionObserver ser hele flaten. Indre span bærer fargen og skaleres fra 0 langs x-aksen. Den skjulte
 * tilstanden gjelder bare med [data-bevegelse] på <html> (se «Inngang» i globals.css): uten JavaScript og ved
 * redusert bevegelse står flaten der fra start. Bare transform.
 */
export function Flate({
  className,
  farge = 'bg-regina-plum',
  fra = 'hoyre',
  i = 0,
}: {
  className?: string
  farge?: string
  fra?: 'hoyre' | 'venstre'
  /** Plass i rekken: forsinkelsen er i × --stagger. */
  i?: number
}) {
  return (
    <span
      data-inn="flate"
      className={className}
      style={{ '--i': i } as CSSProperties}
      aria-hidden
      suppressHydrationWarning
    >
      <span
        className={cn(
          'absolute inset-0 transition-transform delay-[calc(var(--i,0)*var(--stagger))] duration-(--dur-lang) ease-ut',
          '[[data-bevegelse]_[data-inn]:not([data-synlig])>&]:[transform:scaleX(0)]',
          fra === 'hoyre' ? 'origin-right' : 'origin-left',
          farge,
        )}
      />
    </span>
  )
}
