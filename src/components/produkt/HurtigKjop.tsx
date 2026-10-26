'use client'

// Raskt kjøp fra produktkortet. Vises bare når valget er entydig (se `hurtigkjop` i lib/handlekurv).

import { useState } from 'react'
import type { NyLinje } from '@/lib/handlekurv/kurv'
import { Ikon } from '../Ikon'
import { useKurv } from '../kurv/KurvProvider'
import styles from './HurtigKjop.module.css'

export function HurtigKjop({ linje, navn, className }: { linje: NyLinje; navn: string; className?: string }) {
  const { leggTil } = useKurv()
  const [lagt, setLagt] = useState(false)

  return (
    <button
      type="button"
      className={`${styles.knapp} ${className ?? ''}`}
      data-lagt={lagt || undefined}
      onClick={(e) => {
        const bilde = e.currentTarget.closest('article')?.querySelector<HTMLElement>('[data-produktbilde]')
        leggTil(linje, 1, bilde)
        setLagt(true)
        window.setTimeout(() => setLagt(false), 1600)
      }}
      aria-label={`Legg ${navn}${linje.variantTekst ? `, ${linje.variantTekst}` : ''} i handlekurven`}
    >
      <span className={styles.ikon} aria-hidden="true">
        <Ikon navn={lagt ? 'sjekk' : 'pluss'} storrelse={18} />
      </span>
      <span className={styles.tekst}>{lagt ? 'Lagt i kurven' : 'Legg i handlekurven'}</span>
    </button>
  )
}
