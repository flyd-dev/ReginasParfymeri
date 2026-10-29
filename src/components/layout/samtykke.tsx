'use client'

// Samtykke til informasjonskapsler (GDPR / ekomloven § 3-15). Nødvendige (handlekurv, dette valget) brukes
// alltid. Statistikk lastes først etter samtykke – og bare når et analyseverktøy er satt opp
// (NEXT_PUBLIC_GA4_ID). Uten verktøy er det ingenting å samtykke til, og banneret vises ikke.

import Link from 'next/link'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'

const COOKIE = 'regina_samtykke'
const VERSJON = 1
const APNE = 'regina:samtykke'

type Valg = { statistikk: boolean; v: number; dato: string }

function lesValg(): Valg | null {
  const rad = document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE}=`))
  if (!rad) return null
  try {
    const v = JSON.parse(decodeURIComponent(rad.slice(COOKIE.length + 1))) as Valg
    return v.v === VERSJON ? v : null
  } catch {
    return null
  }
}

function lagreValg(statistikk: boolean): Valg {
  const valg: Valg = { statistikk, v: VERSJON, dato: new Date().toISOString() }
  const sikker = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(valg))}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax${sikker}`
  return valg
}

function lastAnalyse(id: string) {
  if (document.getElementById('ga4')) return
  const w = window as unknown as { dataLayer: unknown[]; gtag: (...a: unknown[]) => void }
  w.dataLayer = w.dataLayer || []
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments)
  }
  w.gtag('js', new Date())
  w.gtag('config', id)
  const s = document.createElement('script')
  s.id = 'ga4'
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
  document.head.appendChild(s)
}

const lytt = (endret: () => void) => {
  window.addEventListener(APNE, endret)
  return () => window.removeEventListener(APNE, endret)
}

export function Samtykke() {
  const analyseId = process.env.NEXT_PUBLIC_GA4_ID
  // Cookien leses i nettleseren; på serveren vises ingenting (null = ikke bestemt ennå).
  const lagret = useSyncExternalStore(
    lytt,
    () => document.cookie,
    () => null,
  )
  const [apnet, setApnet] = useState(false)
  const [valgt, setValgt] = useState(false)
  const valg = lagret === null ? undefined : lesValg()

  useEffect(() => {
    if (analyseId && valg?.statistikk) lastAnalyse(analyseId)
  }, [analyseId, valg?.statistikk])

  useEffect(
    () =>
      lytt(() => {
        setApnet(true)
        setValgt(false)
      }),
    [],
  )

  const vis = lagret !== null && !valgt && (apnet || valg === null)
  if (!analyseId || !vis) return null

  const velg = (statistikk: boolean) => {
    lagreValg(statistikk)
    setValgt(true)
    setApnet(false)
    if (statistikk) lastAnalyse(analyseId)
    // Trukket samtykke: last siden på nytt så skriptet ikke lenger kjører.
    else if (document.getElementById('ga4')) location.reload()
  }

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="samtykke-tittel"
      className="fixed inset-x-2 bottom-2 z-50 mx-auto max-w-screen-2xl rounded-2xl border border-sand-200 bg-paper animate-in fade-in slide-in-from-bottom-2 md:inset-x-4 md:bottom-4"
    >
      {/* Et innfelt kort med runde hjørner (R-32), som samtykkevalget på flyd.no. */}
      <div className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:px-8">
        <div className="flex-1">
          <h2 id="samtykke-tittel" className="font-heading text-lg">
            Informasjonskapsler
          </h2>
          <p className="mt-1 text-sm text-sand-ink">
            Vil du hjelpe oss å forbedre nettbutikken? Med ditt samtykke bruker vi informasjonskapsler til
            anonym besøksstatistikk. Handlekurven og dette valget bruker nødvendige informasjonskapsler
            uansett.{' '}
            <Link href="/personvern/#informasjonskapsler" className="text-regina-pink-strong underline">
              Les mer
            </Link>
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => velg(false)}>
            Bare nødvendige
          </Button>
          <Button onClick={() => velg(true)}>Godta statistikk</Button>
        </div>
      </div>
    </section>
  )
}

/** «Informasjonskapsler» i bunnteksten – åpner valget igjen. Footeren velger farger som holder på sin flate. */
export function Samtykkelenke({ className = 'hover:underline' }: { className?: string }) {
  const analyseId = process.env.NEXT_PUBLIC_GA4_ID
  if (!analyseId) {
    return (
      <Link href="/personvern/#informasjonskapsler" className={className}>
        Informasjonskapsler
      </Link>
    )
  }
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(APNE))}>
      Informasjonskapsler
    </button>
  )
}
