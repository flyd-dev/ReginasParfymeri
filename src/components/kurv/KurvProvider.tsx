'use client'

// Handlekurven i nettleseren. Linjene lagres lokalt (lib/handlekurv/lager.ts), men pris og lager
// hentes alltid på nytt fra katalogen (`/api/handlekurv`) før de vises som gjeldende.
// Ingenting sendes til WooCommerce herfra.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import type { Kurvlinje, Linjestatus, NyLinje, ValidertLinje } from '@/lib/handlekurv/kurv'
import { antallVarer, delsum, nokkel } from '@/lib/handlekurv/kurv'
import { abonner, endre, hentLinjer, hentLinjerServer } from '@/lib/handlekurv/lager'
import type { Ore } from '@/lib/katalog/typer'

export type Valideringstilstand = 'venter' | 'laster' | 'ok' | 'feil'

interface Kurv {
  linjer: Kurvlinje[]
  /** Usann til kurven er lest fra nettleseren – da vises en lasteflate. */
  klar: boolean
  antall: number
  /** Summen av linjene som kan gå til kassen. */
  delsum: Ore
  status: Map<string, { status: Linjestatus; gyldig: boolean }>
  validering: Valideringstilstand
  apen: boolean
  sistLagtTil: string | null
  leggTil: (linje: NyLinje, antall: number, kilde?: HTMLElement | null) => void
  settAntall: (nokkel: string, antall: number) => void
  fjern: (nokkel: string) => void
  apne: () => void
  lukk: () => void
  valider: () => Promise<void>
}

const Kontekst = createContext<Kurv | null>(null)
const INGEN: Kurvlinje[] = []

export function useKurv(): Kurv {
  const k = useContext(Kontekst)
  if (!k) throw new Error('useKurv må brukes inne i KurvProvider')
  return k
}

function reduserBevegelse(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Et lite bilde flyr fra produktet til handlekurven. Bare transform og opacity. */
function flyTilKurv(kilde: HTMLElement | null | undefined): void {
  const mal = document.getElementById('kurvknapp')
  // Er headeren rullet bort, er det ingen kurv å fly til – skuffen åpnes uansett.
  if (!kilde || !mal || reduserBevegelse() || mal.closest('[data-skjult]')) return
  const fra = kilde.getBoundingClientRect()
  const til = mal.getBoundingClientRect()
  if (fra.width === 0 || til.width === 0) return
  const klon = kilde.cloneNode(true) as HTMLElement
  Object.assign(klon.style, {
    position: 'fixed',
    left: `${fra.left}px`,
    top: `${fra.top}px`,
    width: `${fra.width}px`,
    height: `${fra.height}px`,
    margin: '0',
    zIndex: '90',
    pointerEvents: 'none',
    overflow: 'hidden',
  })
  klon.setAttribute('aria-hidden', 'true')
  document.body.appendChild(klon)
  const dx = til.left + til.width / 2 - (fra.left + fra.width / 2)
  const dy = til.top + til.height / 2 - (fra.top + fra.height / 2)
  const skala = Math.max(0.08, 28 / Math.max(fra.width, 1))
  const animasjon = klon.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      {
        transform: `translate(${dx * 0.55}px, ${dy * 0.35 - 40}px) scale(${(1 + skala) / 2})`,
        opacity: 0.95,
        offset: 0.55,
      },
      { transform: `translate(${dx}px, ${dy}px) scale(${skala})`, opacity: 0.2 },
    ],
    { duration: 720, easing: 'cubic-bezier(0.5, 0, 0.2, 1)' },
  )
  animasjon.onfinish = () => {
    klon.remove()
    mal.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], {
      duration: 420,
      easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)',
    })
  }
}

export function KurvProvider({ children }: { children: ReactNode }) {
  const lest = useSyncExternalStore(abonner, hentLinjer, hentLinjerServer)
  const klar = lest !== null
  const linjer = lest ?? INGEN
  const [apen, setApen] = useState(false)
  const [sistLagtTil, setSistLagtTil] = useState<string | null>(null)
  const [validering, setValidering] = useState<Valideringstilstand>('venter')
  const [status, setStatus] = useState<Kurv['status']>(new Map())
  const forespørsel = useRef(0)

  const valider = useCallback(async () => {
    const naa = hentLinjer()
    if (naa.length === 0) {
      setStatus(new Map())
      setValidering('ok')
      return
    }
    const nr = ++forespørsel.current
    setValidering('laster')
    try {
      const svar = await fetch('/api/handlekurv', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          linjer: naa.map((l) => ({
            produktId: l.produktId,
            variantId: l.variantId,
            antall: l.antall,
            enhetspris: l.enhetspris,
          })),
        }),
      })
      if (!svar.ok) throw new Error(String(svar.status))
      const data = (await svar.json()) as { linjer: ValidertLinje[] }
      if (nr !== forespørsel.current) return
      const ny = new Map<string, { status: Linjestatus; gyldig: boolean }>()
      for (const v of data.linjer) ny.set(nokkel(v.linje), { status: v.status, gyldig: v.gyldig })
      // Behold det kunden har gjort mens svaret var underveis: bare pris, maks og visningsdata oppdateres.
      const etterNokkel = new Map(data.linjer.map((v) => [nokkel(v.linje), v.linje]))
      const oppdatert = hentLinjer().map((l) => {
        const v = etterNokkel.get(nokkel(l))
        return v ? { ...v, antall: Math.min(l.antall, Math.max(v.maks, 1)) } : l
      })
      if (JSON.stringify(oppdatert) !== JSON.stringify(hentLinjer()))
        endre({ type: 'erstatt', linjer: oppdatert })
      setStatus(ny)
      setValidering('ok')
    } catch {
      if (nr === forespørsel.current) setValidering('feil')
    }
  }, [])

  const leggTil = useCallback<Kurv['leggTil']>((linje, antall, kilde) => {
    endre({ type: 'legg-til', linje, antall })
    setSistLagtTil(nokkel(linje))
    flyTilKurv(kilde)
    window.setTimeout(() => setApen(true), kilde && !reduserBevegelse() ? 380 : 0)
  }, [])

  const settAntall = useCallback(
    (n: string, antall: number) => endre({ type: 'sett-antall', nokkel: n, antall }),
    [],
  )
  const fjern = useCallback((n: string) => {
    endre({ type: 'fjern', nokkel: n })
    setSistLagtTil((s) => (s === n ? null : s))
  }, [])
  const apne = useCallback(() => setApen(true), [])
  const lukk = useCallback(() => {
    setApen(false)
    setSistLagtTil(null)
  }, [])

  // Valider når kurven åpnes og når innholdet endres mens den er åpen.
  const signatur = linjer.map((l) => `${nokkel(l)}x${l.antall}`).join(',')
  useEffect(() => {
    if (!klar || !apen) return
    const t = window.setTimeout(() => void valider(), 250)
    return () => window.clearTimeout(t)
  }, [apen, klar, signatur, valider])

  const verdi = useMemo<Kurv>(() => {
    const gyldige = linjer.filter((l) => status.get(nokkel(l))?.gyldig !== false)
    return {
      linjer,
      klar,
      antall: antallVarer(linjer),
      delsum: delsum(gyldige),
      status,
      validering,
      apen,
      sistLagtTil,
      leggTil,
      settAntall,
      fjern,
      apne,
      lukk,
      valider,
    }
  }, [linjer, klar, status, validering, apen, sistLagtTil, leggTil, settAntall, fjern, apne, lukk, valider])

  return <Kontekst.Provider value={verdi}>{children}</Kontekst.Provider>
}
