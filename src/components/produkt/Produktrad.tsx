'use client'

// Vannrett rad med produkter: sveip på mobil, piler på store skjermer. Ingen automatisk rulling.

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Ikon } from '../Ikon'
import styles from './Produktrad.module.css'

export function Produktrad({ etikett, children }: { etikett: string; children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null)
  const [kant, setKant] = useState({ start: true, slutt: false })

  useEffect(() => {
    const liste = ref.current
    if (!liste) return
    const oppdater = () =>
      setKant({
        start: liste.scrollLeft <= 4,
        slutt: liste.scrollLeft + liste.clientWidth >= liste.scrollWidth - 4,
      })
    oppdater()
    liste.addEventListener('scroll', oppdater, { passive: true })
    window.addEventListener('resize', oppdater)
    return () => {
      liste.removeEventListener('scroll', oppdater)
      window.removeEventListener('resize', oppdater)
    }
  }, [])

  const bla = (retning: 1 | -1) => {
    const liste = ref.current
    if (!liste) return
    liste.scrollBy({ left: retning * liste.clientWidth * 0.85, behavior: 'smooth' })
  }

  return (
    <div className={styles.rad}>
      <div className={styles.piler}>
        <button
          type="button"
          className="ikonknapp"
          onClick={() => bla(-1)}
          disabled={kant.start}
          aria-label={`Forrige i ${etikett}`}
        >
          <Ikon navn="pilVenstre" />
        </button>
        <button
          type="button"
          className="ikonknapp"
          onClick={() => bla(1)}
          disabled={kant.slutt}
          aria-label={`Neste i ${etikett}`}
        >
          <Ikon navn="pil" />
        </button>
      </div>
      <ul ref={ref} className={styles.liste} role="list" aria-label={etikett}>
        {children}
      </ul>
    </div>
  )
}
