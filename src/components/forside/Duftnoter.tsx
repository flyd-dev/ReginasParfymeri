'use client'

// «Finn duften etter noter»: faner med noter som faktisk står oppgitt i produktbeskrivelsene.

import Link from 'next/link'
import { useRef, useState, type KeyboardEvent } from 'react'
import type { Kortdata } from '@/lib/visning'
import { Ikon } from '../Ikon'
import { Produktkort } from '../produkt/Produktkort'
import styles from './Seksjoner.module.css'

export interface Notegruppe {
  note: string
  antall: number
  produkter: Kortdata[]
}

export function Duftnoter({ grupper }: { grupper: Notegruppe[] }) {
  const [valgt, setValgt] = useState(0)
  const faner = useRef<(HTMLButtonElement | null)[]>([])
  const gruppe = grupper[valgt]

  function tast(e: KeyboardEvent, i: number) {
    const neste =
      e.key === 'ArrowRight'
        ? i + 1
        : e.key === 'ArrowLeft'
          ? i - 1
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? grupper.length - 1
              : null
    if (neste === null) return
    e.preventDefault()
    const n = (neste + grupper.length) % grupper.length
    setValgt(n)
    faner.current[n]?.focus()
  }

  if (!gruppe) return null

  return (
    <section className={`${styles.noter} seksjon`} aria-labelledby="noter-tittel">
      <div className="ramme">
        <div className={styles.noterHode}>
          <div className={styles.noterIntro}>
            <p className="kicker">Duftnoter</p>
            <h2 id="noter-tittel" className="t-1">
              Finn duften etter noten du liker
            </h2>
          </div>
          <p className={styles.noterForklaring}>
            Notene er hentet fra beskrivelsene til duftene i nettbutikken – slik merkene selv oppgir topp-,
            hjerte- og bunnoter.
          </p>
        </div>

        <div role="tablist" aria-label="Duftnoter" className={styles.faner}>
          {grupper.map((g, i) => (
            <button
              key={g.note}
              ref={(el) => {
                faner.current[i] = el
              }}
              type="button"
              role="tab"
              id={`note-${i}`}
              aria-selected={i === valgt}
              aria-controls="notepanel"
              tabIndex={i === valgt ? 0 : -1}
              className={styles.fane}
              onClick={() => setValgt(i)}
              onKeyDown={(e) => tast(e, i)}
            >
              {g.note} <span className="tall">{g.antall}</span>
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id="notepanel"
          aria-labelledby={`note-${valgt}`}
          className={styles.notepanel}
          key={gruppe.note}
        >
          <ul role="list" className={styles.notegrid}>
            {gruppe.produkter.map((p, i) => (
              <li key={p.id}>
                <Produktkort produkt={p} forsinkelse={i} sizes="(min-width: 64rem) 22vw, 46vw" />
              </li>
            ))}
          </ul>
          <Link
            href={`/kategori/duft?note=${encodeURIComponent(gruppe.note.toLocaleLowerCase('nb-NO'))}`}
            className="tekstlenke"
          >
            Alle dufter med {gruppe.note.toLocaleLowerCase('nb-NO')} ({gruppe.antall}){' '}
            <Ikon navn="pil" storrelse={16} data-pil />
          </Link>
        </div>
      </div>
    </section>
  )
}
