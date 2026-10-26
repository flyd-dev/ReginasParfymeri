'use client'

// Skuff (drawer) bygget på <dialog>: nettleseren gir fokusfelle, Escape, inert bakgrunn og
// tilbakeføring av fokus. Vi legger bare på åpne/lukke-bevegelsen.

import { useEffect, useRef, type ReactNode } from 'react'
import styles from './Skuff.module.css'

export function Skuff({
  apen,
  onLukk,
  side = 'hoyre',
  etikett,
  beskrevetAv,
  className,
  children,
}: {
  apen: boolean
  onLukk: () => void
  side?: 'hoyre' | 'venstre' | 'topp'
  etikett: string
  beskrevetAv?: string
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (apen && !d.open) {
      d.dataset.tilstand = 'lukket'
      d.showModal()
      // To rammer: først posisjonen utenfor, så overgangen inn.
      requestAnimationFrame(() => requestAnimationFrame(() => (d.dataset.tilstand = 'apen')))
      return
    }
    if (!apen && d.open) {
      d.dataset.tilstand = 'lukker'
      const varighet = Number.parseFloat(getComputedStyle(d).transitionDuration) * 1000 || 0
      const t = window.setTimeout(() => {
        d.close()
        d.dataset.tilstand = 'lukket'
      }, varighet)
      return () => window.clearTimeout(t)
    }
  }, [apen])

  useEffect(() => {
    const d = ref.current
    if (!d) return
    const avbryt = (e: Event) => {
      e.preventDefault()
      onLukk()
    }
    d.addEventListener('cancel', avbryt)
    return () => d.removeEventListener('cancel', avbryt)
  }, [onLukk])

  return (
    <dialog
      ref={ref}
      className={`${styles.skuff} ${styles[side]} ${className ?? ''}`}
      aria-label={etikett}
      aria-describedby={beskrevetAv}
      data-tilstand="lukket"
      onClick={(e) => {
        // Klikk på bakteppet (selve dialog-elementet utenfor innholdet) lukker.
        if (e.target === e.currentTarget) onLukk()
      }}
    >
      <div className={styles.innhold}>{children}</div>
    </dialog>
  )
}
