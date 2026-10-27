'use client'

import dynamic from 'next/dynamic'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Kurv, LeggTil } from '@/lib/kurv/typer'
import type { Kurvvarsel } from './kurvmeldinger'

interface KurvKontekst {
  kurv: Kurv | null
  /** Sant mens en endring sendes. */
  opptatt: boolean
  apen: boolean
  setApen: (apen: boolean) => void
  leggTil: (ny: LeggTil) => Promise<boolean>
  endreAntall: (nokkel: string, antall: number) => Promise<void>
  fjern: (nokkel: string) => Promise<void>
  /** Siste beskjed til skjermlesere (aria-live). */
  beskjed: string
}

const Kontekst = createContext<KurvKontekst | null>(null)

const Varsler = dynamic(() => import('@/components/ui/sonner').then((m) => m.Toaster), { ssr: false })

/**
 * Viser et varsel om handlekurven (kurvmeldinger.tsx). Sonner og varselet lastes først når det trengs, så de
 * ikke er med i første JavaScript. Skjermlesere får i tillegg beskjeden i aria-live-feltet under.
 */
function varsle(varsel: Kurvvarsel) {
  void Promise.all([import('sonner'), import('./kurvmeldinger')]).then(([{ toast }, { Kurvtoast }]) => {
    // Fast id per type: et nytt varsel av samme slag erstatter det forrige i stedet for å stable dem.
    toast.custom((id) => <Kurvtoast varsel={varsel} lukk={() => toast.dismiss(id)} />, {
      id: `kurv-${varsel.type}`,
      duration: varsel.type === 'feil' ? 7000 : 9000,
    })
  })
}

async function send(metode: string, kropp?: unknown): Promise<Kurv> {
  const svar = await fetch('/api/kurv/', {
    method: metode,
    headers: kropp ? { 'content-type': 'application/json' } : undefined,
    body: kropp ? JSON.stringify(kropp) : undefined,
    cache: 'no-store',
  })
  const data = (await svar.json().catch(() => ({}))) as Kurv & { feil?: string }
  if (!svar.ok) throw new Error(data.feil ?? 'Noe gikk galt med handlekurven.')
  return data
}

export function KurvProvider({ children }: { children: ReactNode }) {
  const [kurv, setKurv] = useState<Kurv | null>(null)
  const [opptatt, setOpptatt] = useState(false)
  const [apen, setApen] = useState(false)
  const [beskjed, setBeskjed] = useState('')

  useEffect(() => {
    send('GET')
      .then((ny) => {
        setKurv(ny)
        // Nettbutikken har rettet kurven siden sist (pris, lager, antall): si fra med en gang.
        if (ny.meldinger.length > 0) varsle({ type: 'oppdatert', meldinger: ny.meldinger })
      })
      .catch(() => setKurv(null))
  }, [])

  const kjor = useCallback(
    async (arbeid: () => Promise<Kurv>, ok: string, feiltittel: string): Promise<boolean> => {
      setOpptatt(true)
      try {
        const ny = await arbeid()
        setKurv(ny)
        setBeskjed(ok)
        return true
      } catch (feil) {
        const melding = (feil as Error).message
        varsle({ type: 'feil', tittel: feiltittel, tekst: melding })
        setBeskjed(`${feiltittel}. ${melding}`)
        return false
      } finally {
        setOpptatt(false)
      }
    },
    [],
  )

  const verdi = useMemo<KurvKontekst>(
    () => ({
      kurv,
      opptatt,
      apen,
      setApen,
      beskjed,
      leggTil: async (ny) => {
        const ok = await kjor(
          () => send('POST', ny),
          'Lagt i handlekurven.',
          'Varen ble ikke lagt i handlekurven',
        )
        if (ok) setApen(true)
        return ok
      },
      endreAntall: async (nokkel, antall) => {
        await kjor(() => send('PATCH', { nokkel, antall }), 'Antallet er endret.', 'Antallet ble ikke endret')
      },
      fjern: async (nokkel) => {
        await kjor(
          () => send('DELETE', { nokkel }),
          'Varen er fjernet fra handlekurven.',
          'Varen ble ikke fjernet',
        )
      },
    }),
    [kurv, opptatt, apen, beskjed, kjor],
  )

  return (
    <Kontekst.Provider value={verdi}>
      {children}
      <Varsler position="top-center" />
      <p className="sr-only" aria-live="polite" role="status">
        {beskjed}
      </p>
    </Kontekst.Provider>
  )
}

export function useKurv(): KurvKontekst {
  const k = useContext(Kontekst)
  if (!k) throw new Error('useKurv må brukes inne i KurvProvider')
  return k
}
