// Bygget etter «Vertical Cut Reveal» (danielpetho, MIT) på 21st.dev – https://21st.dev/@danielpetho/components/vertical-cut-reveal. Egen kode; ingen kode er kopiert.

import { Fragment, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** En del av teksten: vanlig tekst, eller et ord/uttrykk med egen stil (f.eks. rosa kursiv). */
export type Tekstdel = string | { tekst: string; className?: string; som?: 'em' | 'span' }

/**
 * Overskrift der ordene glir opp bak en maske, ett og ett, når den kommer til syne – bygget med CSS i stedet for
 * framer-motion (globals.css, data-inn="ord"). Uten JavaScript eller ved
 * redusert bevegelse står teksten der som vanlig. Ordene ligger i vanlige spenn, så skjermlesere leser hele
 * setningen.
 */
export function AvdekkTekst({
  som: Element = 'h2',
  deler,
  i = 0,
  className,
  id,
}: {
  som?: ElementType
  deler: Tekstdel[]
  /** Forsinkelse før første ord, i antall --stagger. */
  i?: number
  className?: string
  id?: string
}) {
  let teller = 0
  const ord = (tekst: string, stil?: string, Omslag: 'em' | 'span' = 'span'): ReactNode[] =>
    tekst
      .split(/(\s+)/)
      .filter((d) => d.length > 0)
      .map((d, n) => {
        if (/^\s+$/.test(d)) return <Fragment key={`m${teller}-${n}`}> </Fragment>
        const j = teller++
        const innhold = (
          <span className="ord-maske">
            <span className="ord" style={{ '--j': j } as CSSProperties}>
              {d}
            </span>
          </span>
        )
        return stil || Omslag === 'em' ? (
          <Omslag key={`o${j}`} className={stil}>
            {innhold}
          </Omslag>
        ) : (
          <Fragment key={`o${j}`}>{innhold}</Fragment>
        )
      })

  return (
    <Element
      id={id}
      data-inn="ord"
      className={cn(className)}
      style={{ '--i': i } as CSSProperties}
      suppressHydrationWarning
    >
      {deler.map((d, n) =>
        typeof d === 'string' ? (
          <Fragment key={n}>{ord(d)}</Fragment>
        ) : (
          <Fragment key={n}>{ord(d.tekst, d.className, d.som ?? 'span')}</Fragment>
        ),
      )}
    </Element>
  )
}
