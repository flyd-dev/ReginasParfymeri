// Skjul ved rulling er bygget etter «Scroll Direction: Hide Header» (Motion, MIT) på 21st.dev – https://21st.dev/@motiondotdev/components/motion-scroll-hide-header. Egen kode; ingen kode er kopiert.
//
// Fra forbildet: toppen glir bort når kunden ruller ned, og kommer tilbake så snart hun ruller opp. Her uten
// motion: én passiv rullelytter som leser scrollY én gang per bilde (requestAnimationFrame) og bare setter et
// data-attributt; flyttingen er en CSS-overgang på transform, så ingenting i siden flytter seg (ingen layout shift).
// På mobil går hele toppen bort; på stor skjerm bare raden med logo, søk og kurv, så menyen blir stående.
'use client'

import { Search, ShoppingBag, User } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { useKurv } from '@/components/kurv/kurv-provider'
import { popKlasse } from '@/components/kurv/rulletall'
import type { Menyprodukt, Menypunkt } from '@/lib/meny'
import { Megameny } from './megameny'
import { Mobilmeny } from './mobilmeny'

// Søk og handlekurvskuff lastes først når de åpnes – mindre JavaScript før siden er tegnet (LCP).
const Sokedialog = dynamic(() => import('./sokedialog').then((m) => m.Sokedialog), { ssr: false })
const Handlekurv = dynamic(() => import('@/components/kurv/handlekurv').then((m) => m.Handlekurv), {
  ssr: false,
})

// Runde ikonknapper (R-32) med lys rosa flate ved peker: rosa ikon på regina-pink-50 holder kontrasten.
const ikonknapp =
  'inline-flex size-11 items-center justify-center rounded-full text-regina-plum transition-[color,background-color,scale] duration-(--dur-fast) ease-out hover:bg-regina-pink-50 hover:text-regina-pink-strong active:scale-90'

/** Toppen står alltid fram over denne rullehøyden (kampanjebanner, toppstripe og selve toppen). */
const FRI_SONE = 160
/** Så mange piksler må kunden rulle i samme retning før toppen skjules eller vises (ikke ved små rykk). */
const TERSKEL = 8

/**
 * Skjuler toppen ved rulling ned og viser den ved rulling opp. Toppen blir stående når en meny i den er åpen
 * eller noe i den har synlig tastaturfokus, og alltid ved redusert bevegelse. Fokus inn i toppen, eller hendelsen
 * `vis-topp` på den, viser den igjen. Tilstanden speiles som `data-topp-skjult` på <html>, så andre klebrige
 * elementer kan følge etter.
 */
function useSkjulVedRulling(topp: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = topp.current
    if (!el) return
    const rot = document.documentElement
    const redusert = matchMedia('(prefers-reduced-motion: reduce)')
    let forrige = Math.max(0, window.scrollY)
    let ramme = 0
    const sett = (skjul: boolean) => {
      if (el.hasAttribute('data-skjult') === skjul) return
      el.toggleAttribute('data-skjult', skjul)
      rot.toggleAttribute('data-topp-skjult', skjul)
    }
    const sjekk = () => {
      ramme = 0
      // Strikken i Safari (over toppen og under bunnen) teller ikke som rulling.
      const bunn = rot.scrollHeight - window.innerHeight
      const y = Math.min(Math.max(0, window.scrollY), Math.max(0, bunn))
      if (y < FRI_SONE || redusert.matches) {
        forrige = y
        sett(false)
        return
      }
      const endring = y - forrige
      if (Math.abs(endring) < TERSKEL) return
      forrige = y
      if (endring < 0) return sett(false)
      if (el.hasAttribute('data-skjult')) return
      // Ikke skjul mens kunden bruker toppen: åpen megameny eller tastaturfokus inne i den.
      if (!el.querySelector('[data-state="open"], :focus-visible')) sett(true)
    }
    const vedRulling = () => {
      if (!ramme) ramme = requestAnimationFrame(sjekk)
    }
    const vis = () => sett(false)
    window.addEventListener('scroll', vedRulling, { passive: true })
    el.addEventListener('focusin', vis)
    el.addEventListener('vis-topp', vis)
    return () => {
      window.removeEventListener('scroll', vedRulling)
      el.removeEventListener('focusin', vis)
      el.removeEventListener('vis-topp', vis)
      cancelAnimationFrame(ramme)
      rot.removeAttribute('data-topp-skjult')
    }
  }, [topp])
}

export function HeaderKlient({
  meny,
  utvalg,
  logo,
  kontoUrl,
}: {
  meny: Menypunkt[]
  utvalg: Record<string, Menyprodukt>
  logo: React.ReactNode
  kontoUrl: string
}) {
  const topp = useRef<HTMLElement>(null)
  useSkjulVedRulling(topp)
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

  // Merket spretter når antallet har endret seg – ikke når kurven hentes ved sidelasting. Mens skuffen er åpen
  // dekker den merket, så endringen telles først når den lukkes (merket spretter da kunden ser det). `endringer`
  // blir ny key, så animasjonen spilles av på nytt for hver endring.
  const [merke, setMerke] = useState<{ antall: number | null; endringer: number }>({
    antall: null,
    endringer: 0,
  })
  if (kurv && !kurvApen && merke.antall !== kurv.antall) {
    setMerke({ antall: kurv.antall, endringer: merke.antall === null ? 0 : merke.endringer + 1 })
  }
  // Endret kurv: vis toppen igjen, så kunden ser merket.
  useEffect(() => {
    if (merke.endringer > 0) topp.current?.dispatchEvent(new Event('vis-topp'))
  }, [merke.endringer])

  return (
    <header
      ref={topp}
      className="sticky top-0 z-40 border-b border-sand-200 bg-sand-50 transition-transform duration-(--dur-slow) ease-ut data-skjult:-translate-y-full lg:data-skjult:-translate-y-20"
    >
      <div className="mx-auto grid h-16 max-w-screen-2xl grid-cols-[1fr_auto_1fr] items-center px-4 md:px-6 lg:h-20">
        <div className="flex items-center gap-1">
          <Mobilmeny meny={meny} />
          <button
            type="button"
            onClick={() => setSokApen(true)}
            className="group/sok hidden h-11 w-full max-w-xs items-center gap-3 rounded-full border border-sand-200 bg-paper pr-3 pl-4 text-left text-sand-ink transition-colors duration-(--dur-fast) hover:border-regina-plum lg:flex"
          >
            <Search
              className="size-4 shrink-0 transition-[color,scale] duration-(--dur-slow) ease-ut group-hover/sok:scale-110 group-hover/sok:text-regina-plum"
              aria-hidden
            />
            <span className="flex-1 truncate text-[0.9375rem] transition-transform duration-(--dur-slow) ease-ut group-hover/sok:translate-x-0.5">
              Søk etter duft eller merke
            </span>
            <kbd className="hidden rounded-sm border border-sand-200 px-1.5 text-xs xl:inline">/</kbd>
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
                key={merke.endringer}
                className={`absolute top-1.5 right-1 grid min-w-4.5 place-items-center rounded-full bg-regina-pink-strong px-1 text-[0.6875rem] leading-4.5 font-semibold text-white ${merke.endringer > 0 ? popKlasse : ''}`}
                aria-hidden
              >
                {antall}
              </span>
            )}
          </button>
        </div>
      </div>
      <Megameny meny={meny} utvalg={utvalg} />
      {sokBrukt && <Sokedialog apen={sokApen} setApen={setSokApen} />}
      {kurvBrukt && <Handlekurv />}
    </header>
  )
}
