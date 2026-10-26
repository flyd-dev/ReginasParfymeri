'use client'

// Den rosa løperen, lagt på tvers: et bånd med merkene som glir rolig forbi.
// Bevegelsen er overført fra 21st.dev «Logo Marquee» (ddoemonn) og bygget om uten Tailwind og Motion:
// farten bygges opp og ned mykt, båndet står stille når pekeren eller fokus er på det, når det er
// utenfor skjermen og ved redusert bevegelse (da kan det rulles for hånd). I tillegg har det en
// synlig pauseknapp, siden innhold som beveger seg av seg selv skal kunne stoppes (WCAG 2.2.2).
// Bare transform på sporet – ingen layout per bilde.

import Link from 'next/link'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Ikon } from '../Ikon'
import styles from './Merkebaand.module.css'

const OPPBYGGING = 0.22
const MAKS_KOPIER = 12
const REDUSERT = '(prefers-reduced-motion: reduce)'

function abonnerBevegelse(varsle: () => void) {
  const mq = window.matchMedia(REDUSERT)
  mq.addEventListener('change', varsle)
  return () => mq.removeEventListener('change', varsle)
}
const rolig = () => window.matchMedia(REDUSERT).matches
const roligServer = () => false

export interface Merkelenke {
  navn: string
  href: string
}

export function Merkebaand({ merker, fart = 38 }: { merker: Merkelenke[]; fart?: number }) {
  const vindu = useRef<HTMLDivElement>(null)
  const spor = useRef<HTMLDivElement>(null)
  const gruppe = useRef<HTMLUListElement>(null)

  const [kopier, setKopier] = useState(3)
  const [holdt, setHoldt] = useState(false)
  const [stoppet, setStoppet] = useState(false)
  const [synlig, setSynlig] = useState(false)
  const redusert = useSyncExternalStore(abonnerBevegelse, rolig, roligServer)

  const skalBevege = !holdt && !stoppet && !redusert
  const beveger = useRef(false)
  const forskyvning = useRef(0)
  const takt = useRef(0)
  const lengde = useRef(0)

  useEffect(() => {
    beveger.current = skalBevege
  }, [skalBevege])

  const tegn = useCallback(() => {
    const s = spor.current
    if (s) s.style.transform = `translate3d(${forskyvning.current.toFixed(2)}px, 0, 0)`
  }, [])

  // Mål én gruppe og vinduet; lag nok kopier til at båndet alltid er fullt.
  useLayoutEffect(() => {
    const v = vindu.current
    const g = gruppe.current
    if (!v || !g) return
    const mal = () => {
      const bredde = g.getBoundingClientRect().width
      lengde.current = bredde
      if (bredde > 0) forskyvning.current = -(Math.abs(forskyvning.current) % bredde)
      tegn()
      const rom = v.getBoundingClientRect().width
      const neste = bredde > 0 ? Math.min(Math.max(Math.ceil(rom / bredde) + 1, 2), MAKS_KOPIER) : 2
      setKopier((forrige) => (forrige === neste ? forrige : neste))
    }
    mal()
    const observator = new ResizeObserver(mal)
    observator.observe(v)
    observator.observe(g)
    return () => observator.disconnect()
  }, [tegn])

  // Ingen animasjon når båndet er utenfor skjermen.
  useEffect(() => {
    const v = vindu.current
    if (!v) return
    const observator = new IntersectionObserver(
      (oppforinger) => {
        const siste = oppforinger[oppforinger.length - 1]
        if (siste) setSynlig(siste.isIntersecting)
      },
      { rootMargin: '96px' },
    )
    observator.observe(v)
    return () => observator.disconnect()
  }, [])

  useEffect(() => {
    if (redusert) {
      forskyvning.current = 0
      tegn()
      return
    }
    if (!synlig) return
    let ramme = 0
    let forrige = 0
    const steg = (na: number) => {
      ramme = requestAnimationFrame(steg)
      const dt = forrige ? Math.min((na - forrige) / 1000, 0.05) : 0
      forrige = na
      const l = lengde.current
      if (l <= 0) return
      takt.current += ((beveger.current ? 1 : 0) - takt.current) * (1 - Math.exp(-dt / OPPBYGGING))
      // Farten bygges ned mot null, men når den aldri helt: står båndet, står det helt stille.
      if (!beveger.current && takt.current < 0.002) {
        takt.current = 0
        return
      }
      let x = forskyvning.current - fart * takt.current * dt
      if (x <= -l) x += l
      if (x > 0) x -= l
      forskyvning.current = x
      tegn()
    }
    ramme = requestAnimationFrame(steg)
    return () => cancelAnimationFrame(ramme)
  }, [redusert, synlig, fart, tegn])

  // Slipp grepet hvis vinduet mister fokus midt i et trykk.
  useEffect(() => {
    const slipp = () => setHoldt(false)
    window.addEventListener('blur', slipp)
    return () => window.removeEventListener('blur', slipp)
  }, [])

  // Et merke som får fokus med tastaturet, flyttes helt inn i vinduet.
  const visFram = (node: HTMLElement) => {
    const v = vindu.current
    const l = lengde.current
    if (!v || redusert || l <= 0) return
    const vr = v.getBoundingClientRect()
    const nr = node.getBoundingClientRect()
    const marg = 24
    let delta = 0
    if (nr.left < vr.left + marg) delta = vr.left + marg - nr.left
    else if (nr.right > vr.right - marg) delta = vr.right - marg - nr.right
    if (delta === 0) return
    forskyvning.current = Math.min(0, Math.max(-l, forskyvning.current + delta))
    tegn()
  }

  const grupper = redusert ? 1 : kopier

  return (
    <section className={styles.baand} aria-label="Utvalgte merker" data-redusert={redusert || undefined}>
      <div
        ref={vindu}
        className={styles.vindu}
        // Ved redusert bevegelse står båndet stille og kan rulles med tastatur og fingre i stedet.
        role={redusert ? 'region' : undefined}
        aria-label={redusert ? 'Merkene, rull sideveis' : undefined}
        tabIndex={redusert ? 0 : undefined}
        onPointerEnter={(e) => {
          if (e.pointerType !== 'touch') setHoldt(true)
        }}
        onPointerLeave={() => setHoldt(false)}
        onPointerDown={() => setHoldt(true)}
        onPointerUp={(e) => {
          if (e.pointerType === 'touch') setHoldt(false)
        }}
        onPointerCancel={() => setHoldt(false)}
        onFocus={(e) => {
          setHoldt(true)
          visFram(e.target as HTMLElement)
        }}
        onBlur={() => setHoldt(false)}
      >
        <div ref={spor} className={styles.spor}>
          {Array.from({ length: grupper }, (_, kopi) => (
            <ul
              key={kopi}
              ref={kopi === 0 ? gruppe : undefined}
              role="list"
              className={styles.gruppe}
              aria-hidden={kopi === 0 ? undefined : true}
            >
              {merker.map((m) => (
                <li key={m.href} className={styles.punkt}>
                  {kopi === 0 ? (
                    <Link href={m.href} className={styles.merke}>
                      {m.navn}
                    </Link>
                  ) : (
                    <span className={styles.merke}>{m.navn}</span>
                  )}
                  <svg className={styles.skille} viewBox="0 0 12 16" aria-hidden="true">
                    <path d="M1 16V6a5 5 0 0 1 10 0v10z" />
                  </svg>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      {redusert ? null : (
        <button
          type="button"
          className={styles.pause}
          aria-pressed={stoppet}
          aria-label={stoppet ? 'Start merkebåndet' : 'Stopp merkebåndet'}
          onClick={() => setStoppet((s) => !s)}
        >
          <Ikon navn={stoppet ? 'spill' : 'pause'} storrelse={18} />
        </button>
      )}
    </section>
  )
}
