'use client'

// Produktbildet på en flate i bildets egen bakgrunnsfarge (målt ved henting), så hvite pakkebilder
// glir inn uten filter som endrer fargen på produktet. Gjennomsiktige bilder står på sand.
// Mangler bildet eller feiler det, vises en rolig plassholder – aldri et brutt bilde.

import Image from 'next/image'
import { useState } from 'react'
import type { Bilde } from '@/lib/katalog/typer'
import { Ikon } from '../Ikon'
import styles from './Produktbilde.module.css'

export function flatefarge(bilde: Bilde | null): string | undefined {
  if (!bilde) return undefined
  if ((bilde.bakgrunn === 'hvit' || bilde.bakgrunn === 'flat') && bilde.flate) return bilde.flate
  if (bilde.bakgrunn === 'ukjent') return '#ffffff'
  return undefined
}

export function Produktbilde({
  bilde,
  bilde2,
  sizes,
  prioritet = false,
  storrelse = 'kort',
  className,
}: {
  bilde: Bilde | null
  bilde2?: Bilde | null
  sizes: string
  prioritet?: boolean
  storrelse?: 'kort' | 'stor' | 'mini'
  className?: string
}) {
  const [feil, setFeil] = useState(false)
  const [feil2, setFeil2] = useState(false)
  const flate = flatefarge(bilde)

  return (
    <div
      className={`${styles.plate} ${styles[storrelse]} ${className ?? ''}`}
      data-bakgrunn={bilde && !feil ? bilde.bakgrunn : 'mangler'}
      style={flate && !feil ? { backgroundColor: flate } : undefined}
      data-produktbilde
    >
      {bilde && !feil ? (
        <Image
          src={bilde.src}
          alt={bilde.alt}
          fill
          sizes={sizes}
          preload={prioritet}
          loading={prioritet ? 'eager' : undefined}
          className={styles.bilde}
          onError={() => setFeil(true)}
        />
      ) : (
        <div className={styles.mangler} role="img" aria-label="Bilde mangler">
          <Ikon navn="bilde" storrelse={28} />
          <span>Bilde kommer</span>
        </div>
      )}
      {bilde2 && !feil && !feil2 ? (
        <Image
          src={bilde2.src}
          alt=""
          fill
          sizes={sizes}
          className={`${styles.bilde} ${styles.bilde2}`}
          style={{ backgroundColor: flatefarge(bilde2) ?? 'var(--sand-dyp)' }}
          data-bakgrunn={bilde2.bakgrunn}
          onError={() => setFeil2(true)}
        />
      ) : null}
    </div>
  )
}
