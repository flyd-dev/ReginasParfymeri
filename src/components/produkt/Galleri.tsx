'use client'

// Bildegalleri: stort bilde med miniatyrer på store skjermer, sveip med teller på mobil.

import { useEffect, useRef, useState } from 'react'
import type { Bilde } from '@/lib/katalog/typer'
import { Produktbilde } from './Produktbilde'
import styles from './Galleri.module.css'

export function Galleri({ bilder, navn }: { bilder: Bilde[]; navn: string }) {
  const [aktiv, setAktiv] = useState(0)
  const spor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const s = spor.current
    if (!s) return
    const vedRulling = () => {
      const i = Math.round(s.scrollLeft / Math.max(s.clientWidth, 1))
      setAktiv((a) => (a === i ? a : i))
    }
    s.addEventListener('scroll', vedRulling, { passive: true })
    return () => s.removeEventListener('scroll', vedRulling)
  }, [])

  const velg = (i: number) => {
    setAktiv(i)
    const s = spor.current
    if (s && s.scrollWidth > s.clientWidth + 4) s.scrollTo({ left: i * s.clientWidth, behavior: 'smooth' })
  }

  if (bilder.length === 0) {
    return (
      <div className={styles.galleri}>
        <Produktbilde bilde={null} sizes="(min-width: 64rem) 50vw, 100vw" storrelse="stor" />
      </div>
    )
  }

  return (
    <div className={styles.galleri} data-produktgalleri>
      <div ref={spor} className={styles.spor} aria-label={`Bilder av ${navn}`} role="group">
        {bilder.map((b, i) => (
          <div
            key={b.src}
            className={styles.lysbilde}
            data-aktiv={i === aktiv || undefined}
            aria-hidden={i !== aktiv}
          >
            <Produktbilde
              bilde={b}
              sizes="(min-width: 64rem) 50vw, 100vw"
              storrelse="stor"
              prioritet={i === 0}
            />
          </div>
        ))}
      </div>
      {bilder.length > 1 ? (
        <>
          <p className={`${styles.teller} tall`} aria-hidden="true">
            {aktiv + 1} / {bilder.length}
          </p>
          <ul role="list" className={styles.miniatyrer} aria-label="Velg bilde">
            {bilder.map((b, i) => (
              <li key={b.src}>
                <button
                  type="button"
                  className={styles.miniatyr}
                  aria-label={`Vis bilde ${i + 1} av ${bilder.length}`}
                  aria-current={i === aktiv || undefined}
                  onClick={() => velg(i)}
                >
                  <Produktbilde bilde={b} sizes="96px" storrelse="mini" />
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}
