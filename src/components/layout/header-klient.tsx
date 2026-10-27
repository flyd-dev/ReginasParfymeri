'use client'

import { Search, ShoppingBag, User } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useKurv } from '@/components/kurv/kurv-provider'
import type { Menypunkt } from '@/lib/meny'
import { Megameny } from './megameny'
import { Mobilmeny } from './mobilmeny'

// Søk og handlekurvskuff lastes først når de åpnes – mindre JavaScript før siden er tegnet (LCP).
const Sokedialog = dynamic(() => import('./sokedialog').then((m) => m.Sokedialog), { ssr: false })
const Handlekurv = dynamic(() => import('@/components/kurv/handlekurv').then((m) => m.Handlekurv), {
  ssr: false,
})

const ikonknapp =
  'inline-flex size-11 items-center justify-center text-regina-plum transition-colors duration-(--dur-fast) hover:text-regina-pink-strong'

export function HeaderKlient({
  meny,
  logo,
  kontoUrl,
}: {
  meny: Menypunkt[]
  logo: React.ReactNode
  kontoUrl: string
}) {
  const [sokApen, setSokApenTilstand] = useState(false)
  const [sokBrukt, setSokBrukt] = useState(false)
  const setSokApen = (apen: boolean) => {
    if (apen) setSokBrukt(true)
    setSokApenTilstand(apen)
  }
  useEffect(() => {
    const tast = (e: KeyboardEvent) => {
      const iFelt = e.target instanceof HTMLElement && e.target.closest('input, textarea, [contenteditable]')
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !iFelt)) {
        e.preventDefault()
        setSokBrukt(true)
        setSokApenTilstand(true)
      }
    }
    window.addEventListener('keydown', tast)
    return () => window.removeEventListener('keydown', tast)
  }, [])
  const { kurv, apen: kurvApen, setApen } = useKurv()
  const [kurvBrukt, setKurvBrukt] = useState(false)
  if (kurvApen && !kurvBrukt) setKurvBrukt(true)
  const antall = kurv?.antall ?? 0

  return (
    <header className="sticky top-0 z-40 border-b border-sand-200 bg-sand-50">
      <div className="mx-auto grid h-16 max-w-screen-2xl grid-cols-[1fr_auto_1fr] items-center px-4 md:px-6 lg:h-20">
        <div className="flex items-center gap-1">
          <Mobilmeny meny={meny} />
          <button
            type="button"
            onClick={() => setSokApen(true)}
            className="hidden h-11 w-full max-w-xs items-center gap-3 border-b border-input px-1 text-left text-sand-ink transition-colors duration-(--dur-fast) hover:border-regina-plum lg:flex"
          >
            <Search className="size-4 shrink-0" aria-hidden />
            <span className="flex-1 truncate text-[0.9375rem]">Søk etter duft eller merke</span>
            <kbd className="hidden border border-sand-200 px-1.5 text-xs xl:inline">/</kbd>
          </button>
        </div>
        <div className="h-12 lg:h-16">{logo}</div>
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setSokApen(true)}
            className={`${ikonknapp} lg:hidden`}
            aria-label="Søk"
          >
            <Search className="size-5" aria-hidden />
          </button>
          <a href={kontoUrl} className={`${ikonknapp} hidden sm:inline-flex`} aria-label="Min konto">
            <User className="size-5" aria-hidden />
          </a>
          <button
            type="button"
            onClick={() => setApen(true)}
            className={`${ikonknapp} relative`}
            aria-label={
              antall > 0 ? `Handlekurv, ${antall} ${antall === 1 ? 'vare' : 'varer'}` : 'Handlekurv, tom'
            }
          >
            <ShoppingBag className="size-5" aria-hidden />
            {antall > 0 && (
              <span
                className="absolute top-1.5 right-1 grid min-w-4.5 place-items-center bg-regina-pink-strong px-1 text-[0.6875rem] leading-4.5 font-semibold text-white"
                aria-hidden
              >
                {antall}
              </span>
            )}
          </button>
        </div>
      </div>
      <Megameny meny={meny} />
      {sokBrukt && <Sokedialog apen={sokApen} setApen={setSokApen} />}
      {kurvBrukt && <Handlekurv />}
    </header>
  )
}
