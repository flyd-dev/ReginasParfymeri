'use client'

// Felles tilstand for en produktliste: navigering med overgang (så listen kan vise at den laster)
// og skuffen med filtre på mobil.

import { useRouter } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from 'react'

interface ListeKontekst {
  naviger: (url: string) => void
  laster: boolean
  filterApen: boolean
  setFilterApen: (apen: boolean) => void
}

const Kontekst = createContext<ListeKontekst | null>(null)

export function useListe(): ListeKontekst {
  const k = useContext(Kontekst)
  if (!k) throw new Error('useListe må brukes inne i ListeNavigasjon')
  return k
}

export function ListeNavigasjon({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [laster, startOvergang] = useTransition()
  const [filterApen, setFilterApen] = useState(false)
  const naviger = useCallback(
    (url: string) => startOvergang(() => router.push(url, { scroll: false })),
    [router],
  )
  const verdi = useMemo(() => ({ naviger, laster, filterApen, setFilterApen }), [naviger, laster, filterApen])
  return <Kontekst.Provider value={verdi}>{children}</Kontekst.Provider>
}

/** Rutenettet blir rolig dempet mens en ny filtrering lastes. */
export function Listeflate({ children, className }: { children: ReactNode; className?: string }) {
  const { laster } = useListe()
  return (
    <div className={className} aria-busy={laster} data-laster={laster || undefined}>
      {children}
    </div>
  )
}
