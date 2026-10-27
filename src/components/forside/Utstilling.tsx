'use client'

// Utstillingsvinduet for nisjeduft: én duft om gangen, med tekst til venstre og flasken i en stor bue
// til høyre. Oppsett og oppførsel er overført fra 21st.dev «Elegant Carousel» (dev.yadhakim) og skrevet
// om uten Tailwind: kryssfade mellom bildene, svak zoom på bildet som vises, fremdriftslinjer med navn,
// sveip på berøringsskjerm. Den skifter selv bare når det er trygt: aldri ved redusert bevegelse,
// aldri utenfor skjermen, og den stopper ved peker, fokus og pauseknapp (WCAG 2.2.2).
// Fremdriften er en CSS-animasjon; når den er ferdig, går vinduet videre. Bare transform og opacity.

import Link from 'next/link'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { kroner } from '@/lib/format'
import type { Bilde, Duftnoter, Ore } from '@/lib/katalog/typer'
import { Ikon } from '../Ikon'
import { Produktbilde } from '../produkt/Produktbilde'
import styles from './Utstilling.module.css'

export interface Utstillingsvare {
  id: number
  slug: string
  merke: string | null
  navn: string
  ingress: string
  noter: Duftnoter | null
  pris: Ore
  fra: boolean
  bilde: Bilde | null
  variantinfo: string | null
}

const REDUSERT = '(prefers-reduced-motion: reduce)'
function abonnerBevegelse(varsle: () => void) {
  const mq = window.matchMedia(REDUSERT)
  mq.addEventListener('change', varsle)
  return () => mq.removeEventListener('change', varsle)
}
const rolig = () => window.matchMedia(REDUSERT).matches
const roligServer = () => true

const NOTENIVAA = [
  ['topp', 'Topp'],
  ['hjerte', 'Hjerte'],
  ['bunn', 'Bunn'],
] as const

export function Utstilling({ varer }: { varer: Utstillingsvare[] }) {
  const [aktiv, setAktiv] = useState(0)
  const [stoppet, setStoppet] = useState(false)
  const [holdt, setHoldt] = useState(false)
  const [synlig, setSynlig] = useState(false)
  const redusert = useSyncExternalStore(abonnerBevegelse, rolig, roligServer)
  const rot = useRef<HTMLElement>(null)
  const sveip = useRef<number | null>(null)

  const antall = varer.length
  const roterer = !redusert && !stoppet && !holdt && synlig
  const gaTil = (n: number) => setAktiv(((n % antall) + antall) % antall)

  // Står stille når vinduet er utenfor skjermen.
  useEffect(() => {
    const el = rot.current
    if (!el) return
    const observator = new IntersectionObserver(([o]) => setSynlig(Boolean(o?.isIntersecting)), {
      threshold: 0.35,
    })
    observator.observe(el)
    return () => observator.disconnect()
  }, [])

  const vare = varer[aktiv]
  if (!vare) return null
  const noter = vare.noter
    ? NOTENIVAA.flatMap(([nokkel, etikett]) =>
        vare.noter && vare.noter[nokkel].length > 0
          ? [{ etikett, tekst: vare.noter[nokkel].slice(0, 3).join(', ') }]
          : [],
      )
    : []

  return (
    <section
      ref={rot}
      className={styles.utstilling}
      aria-roledescription="karusell"
      aria-label="Utvalgte nisjedufter"
      data-roterer={roterer || undefined}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHoldt(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHoldt(false)}
      onFocus={() => setHoldt(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHoldt(false)
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') gaTil(aktiv + 1)
        if (e.key === 'ArrowLeft') gaTil(aktiv - 1)
      }}
    >
      <div className={styles.innhold}>
        <div
          className={styles.tekst}
          // Skjermlesere får beskjed om nytt innhold bare når vinduet står stille.
          aria-live={roterer ? 'off' : 'polite'}
          role="group"
          aria-roledescription="lysbilde"
          aria-label={`${aktiv + 1} av ${antall}`}
        >
          <div key={vare.id} className={styles.tekstInn}>
            <p className={`${styles.nummer} tall`} aria-hidden="true">
              <span className={styles.nummerlinje} />
              {String(aktiv + 1).padStart(2, '0')} / {String(antall).padStart(2, '0')}
            </p>
            {vare.merke ? <p className={styles.merke}>{vare.merke}</p> : null}
            <h3 className={styles.navn}>{vare.navn}</h3>
            {vare.ingress ? <p className={styles.ingress}>{vare.ingress}</p> : null}
            {noter.length > 0 ? (
              <dl className={styles.noter}>
                {noter.map((n) => (
                  <div key={n.etikett}>
                    <dt>{n.etikett}</dt>
                    <dd>{n.tekst}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <p className={`${styles.pris} tall`}>
              {vare.fra ? <span className={styles.fra}>Fra </span> : null}
              {kroner(vare.pris)}
              {vare.variantinfo ? <span className={styles.variant}> · {vare.variantinfo}</span> : null}
            </p>
            <Link href={`/produkt/${vare.slug}`} className="knapp knapp--sekundar">
              Se duften <span className="skjult">{vare.navn}</span>
              <Ikon navn="pil" storrelse={18} data-pil />
            </Link>
          </div>
        </div>

        <div
          className={styles.bilder}
          onPointerDown={(e) => {
            sveip.current = e.clientX
          }}
          onPointerUp={(e) => {
            if (sveip.current === null) return
            const dx = e.clientX - sveip.current
            sveip.current = null
            if (Math.abs(dx) > 50) gaTil(aktiv + (dx < 0 ? 1 : -1))
          }}
        >
          <div className={styles.ramme}>
            <div className={styles.bue}>
              {varer.map((v, n) => (
                <div
                  key={v.id}
                  className={styles.lag}
                  data-aktiv={n === aktiv || undefined}
                  aria-hidden={n !== aktiv}
                >
                  <Produktbilde
                    bilde={v.bilde}
                    sizes="(min-width: 64rem) 40vw, 90vw"
                    storrelse="kort"
                    prioritet={false}
                    className={styles.plate}
                  />
                </div>
              ))}
            </div>
            <span className={`${styles.hjorne} ${styles.hjorneTopp}`} aria-hidden="true" />
            <span className={`${styles.hjorne} ${styles.hjorneBunn}`} aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className={styles.styring}>
        <div className={styles.piler}>
          <button
            type="button"
            className="ikonknapp"
            onClick={() => gaTil(aktiv - 1)}
            aria-label="Forrige duft"
          >
            <Ikon navn="pilVenstre" storrelse={20} />
          </button>
          <button
            type="button"
            className="ikonknapp"
            onClick={() => gaTil(aktiv + 1)}
            aria-label="Neste duft"
          >
            <Ikon navn="pil" storrelse={20} />
          </button>
          {redusert ? null : (
            <button
              type="button"
              className="ikonknapp"
              onClick={() => setStoppet((s) => !s)}
              aria-pressed={stoppet}
              aria-label={stoppet ? 'Start utstillingen' : 'Stopp utstillingen'}
            >
              <Ikon navn={stoppet ? 'spill' : 'pause'} storrelse={18} />
            </button>
          )}
        </div>
        <ol className={styles.fremdrift} role="list">
          {varer.map((v, n) => (
            <li key={v.id}>
              <button
                type="button"
                className={styles.fremdriftKnapp}
                onClick={() => gaTil(n)}
                aria-current={n === aktiv ? 'true' : undefined}
                aria-label={`Vis ${v.navn}${v.merke ? ` fra ${v.merke}` : ''}`}
              >
                <span className={styles.spor}>
                  <span
                    className={styles.fyll}
                    data-status={n === aktiv ? 'aktiv' : n < aktiv ? 'sett' : undefined}
                    onAnimationEnd={n === aktiv ? () => gaTil(aktiv + 1) : undefined}
                  />
                </span>
                <span className={styles.etikett}>{v.navn}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
