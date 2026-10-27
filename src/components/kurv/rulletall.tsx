// Bygget etter «Number Flow» (Maxwell Barvian, MIT) på 21st.dev – https://21st.dev/@barvian/components/number-flow. Egen kode; ingen kode er kopiert.
//
// Fra forbildet: når et tall endres, ruller det nye inn og det gamle ut – opp når tallet øker, ned når det minker.
// Her ruller hele verdien (ikke siffer for siffer), med CSS (rulletall.module.css), bare transform og opacity.
'use client'

import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import stil from './rulletall.module.css'

type Visning = { verdi: number; forrige: number | null; n: number }

/**
 * Viser et tall som ruller når det endres. Første visning står stille. Det gamle tallet er skjult for skjermlesere
 * og fjernes når det har rullet ut, så teksten i DOM-en er den samme som før.
 */
export function Rulletall({
  verdi,
  vis = String,
  className,
}: {
  verdi: number
  /** Formatet tallet vises i, f.eks. `kroner`. */
  vis?: (verdi: number) => ReactNode
  className?: string
}) {
  const [v, setV] = useState<Visning>({ verdi, forrige: null, n: 0 })
  // Ny verdi fra forelderen: husk den gamle til den har rullet ut (justering under render, ikke i en effekt).
  if (v.verdi !== verdi) setV({ verdi, forrige: v.verdi, n: v.n + 1 })
  const ned = v.forrige !== null && verdi < v.forrige
  return (
    <span className={cn(stil.tall, ned && stil.ned, className)}>
      {v.forrige !== null && (
        <span
          key={`ut-${v.n}`}
          className={stil.ut}
          aria-hidden
          onAnimationEnd={() => setV((naa) => (naa.n === v.n ? { ...naa, forrige: null } : naa))}
        >
          {vis(v.forrige)}
        </span>
      )}
      <span key={`inn-${v.n}`} className={v.n > 0 ? stil.inn : undefined}>
        {vis(verdi)}
      </span>
    </span>
  )
}

/** Klassen som får et merke til å sprette (handlekurvknappen). Settes på et element med ny `key` ved endring. */
export const popKlasse = stil.pop
