'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { Menydata, Menypost } from '@/lib/visning'
import { Ikon } from '../Ikon'
import { useKurv } from '../kurv/KurvProvider'
import { Logo } from '../Logo'
import { Megapanel, Merkepanel } from './Megapanel'
import { Mobilmeny } from './Mobilmeny'
import { Sokedialog } from './Sokedialog'
import styles from './Header.module.css'

const APNE_FORSINKELSE = 110
const LUKKE_FORSINKELSE = 180

export function Header({ meny }: { meny: Menydata }) {
  const { antall, apne, klar } = useKurv()
  const [aktiv, setAktiv] = useState<string | null>(null)
  const [mobil, setMobil] = useState(false)
  const [sok, setSok] = useState(false)
  const [scrollet, setScrollet] = useState(false)
  const pathname = usePathname()
  const timer = useRef<number | undefined>(undefined)
  const navRef = useRef<HTMLElement>(null)

  // Lukk alt når siden byttes (justert under rendring, ikke i en effekt).
  const [forrigeSti, setForrigeSti] = useState(pathname)
  if (pathname !== forrigeSti) {
    setForrigeSti(pathname)
    setAktiv(null)
    setMobil(false)
    setSok(false)
  }

  useEffect(() => {
    const vedScroll = () => setScrollet(window.scrollY > 8)
    vedScroll()
    window.addEventListener('scroll', vedScroll, { passive: true })
    return () => window.removeEventListener('scroll', vedScroll)
  }, [])

  useEffect(() => {
    if (!aktiv) return
    const vedTast = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const knapp = document.getElementById(`menyknapp-${aktiv}`)
      setAktiv(null)
      knapp?.focus()
    }
    document.addEventListener('keydown', vedTast)
    return () => document.removeEventListener('keydown', vedTast)
  }, [aktiv])

  const planlegg = useCallback((neste: string | null, forsinkelse: number) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setAktiv(neste), forsinkelse)
  }, [])

  const lukkSok = useCallback(() => setSok(false), [])
  const lukkMobil = useCallback(() => setMobil(false), [])

  const poster: { id: string; etikett: string; post?: Menypost }[] = [
    { id: 'merker', etikett: 'Merker' },
    ...meny.poster.map((p) => ({ id: p.id, etikett: p.etikett, post: p })),
  ]

  function tastPaKnapp(e: KeyboardEvent<HTMLButtonElement>, id: string) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAktiv(id)
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`#panel-${id} a`)?.focus())
    }
  }

  return (
    <>
      <header
        className={styles.header}
        data-scrollet={scrollet || undefined}
        data-meny-apen={aktiv ? '' : undefined}
        onPointerLeave={(e) => e.pointerType === 'mouse' && planlegg(null, LUKKE_FORSINKELSE)}
      >
        <div className={`${styles.rad} ramme`}>
          <div className={styles.venstre}>
            <button
              type="button"
              className={`ikonknapp ${styles.bareMobil}`}
              onClick={() => setMobil(true)}
              aria-haspopup="dialog"
              aria-expanded={mobil}
              aria-label="Meny"
            >
              <Ikon navn="meny" storrelse={22} />
            </button>
            <button
              type="button"
              className={styles.sokefelt}
              onClick={() => setSok(true)}
              aria-haspopup="dialog"
              aria-expanded={sok}
            >
              <Ikon navn="sok" storrelse={18} />
              <span className={styles.sokeplassholder}>
                Søk blant {meny.antallProdukter.toLocaleString('nb-NO')} produkter
              </span>
              <span className="skjult">: merke, produkt eller duftnote</span>
            </button>
          </div>

          <Link href="/" className={styles.logo} aria-label="Regina Parfymeri – til forsiden">
            <Logo />
          </Link>

          <div className={styles.hoyre}>
            <Link href="/om-regina#besok" className={styles.butikklenke}>
              <Ikon navn="sted" storrelse={18} />
              <span>Butikken i Haraldsgata</span>
            </Link>
            <button
              type="button"
              className={`ikonknapp ${styles.bareMobil}`}
              onClick={() => setSok(true)}
              aria-haspopup="dialog"
              aria-label="Søk"
            >
              <Ikon navn="sok" storrelse={22} />
            </button>
            <button
              type="button"
              id="kurvknapp"
              className={styles.kurvknapp}
              onClick={apne}
              aria-haspopup="dialog"
              aria-label={klar ? `Handlekurv, ${antall} ${antall === 1 ? 'vare' : 'varer'}` : 'Handlekurv'}
            >
              <Ikon navn="kurv" storrelse={22} />
              <span className={styles.kurvtekst} aria-hidden="true">
                Handlekurv
              </span>
              {klar && antall > 0 ? (
                <span className={`${styles.teller} tall`} aria-hidden="true" key={antall}>
                  {antall}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Hovedmeny" ref={navRef}>
          <ul className={styles.navliste} role="list">
            {poster.map(({ id, etikett, post }) => {
              const apen = aktiv === id
              return (
                <li
                  key={id}
                  className={styles.navpunkt}
                  onPointerEnter={(e) =>
                    e.pointerType === 'mouse' && planlegg(id, aktiv ? 0 : APNE_FORSINKELSE)
                  }
                  onBlur={(e) => {
                    if (apen && !e.currentTarget.contains(e.relatedTarget as Node | null)) setAktiv(null)
                  }}
                >
                  <button
                    type="button"
                    id={`menyknapp-${id}`}
                    className={styles.navknapp}
                    aria-expanded={apen}
                    aria-controls={`panel-${id}`}
                    onClick={() => {
                      window.clearTimeout(timer.current)
                      setAktiv(apen ? null : id)
                    }}
                    onKeyDown={(e) => tastPaKnapp(e, id)}
                  >
                    {etikett}
                    <Ikon navn="ned" storrelse={14} className={styles.chevron} />
                  </button>
                  <div
                    id={`panel-${id}`}
                    className={styles.panel}
                    data-apen={apen || undefined}
                    inert={!apen}
                    onPointerEnter={() => window.clearTimeout(timer.current)}
                  >
                    {post ? <Megapanel post={post} /> : <Merkepanel merker={meny.merker} />}
                  </div>
                </li>
              )
            })}
            {meny.tilbud > 0 ? (
              <li className={styles.navpunkt}>
                <Link
                  href="/tilbud"
                  className={styles.navknapp}
                  aria-current={pathname === '/tilbud' ? 'page' : undefined}
                >
                  Tilbud
                </Link>
              </li>
            ) : null}
            <li className={`${styles.navpunkt} ${styles.skilt}`}>
              <Link
                href="/om-regina"
                className={styles.navknapp}
                aria-current={pathname === '/om-regina' ? 'page' : undefined}
              >
                Om Regina
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      <div
        className={styles.slor}
        data-synlig={aktiv ? '' : undefined}
        onClick={() => setAktiv(null)}
        aria-hidden="true"
      />
      <Mobilmeny apen={mobil} onLukk={lukkMobil} meny={meny} />
      <Sokedialog apen={sok} onLukk={lukkSok} />
    </>
  )
}
