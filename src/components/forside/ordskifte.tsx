// Bygget etter «Text Rotate» (Daniel Petho, MIT) på 21st.dev – https://21st.dev/@danielpetho/components/text-rotate. Egen kode; ingen kode er kopiert.
'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/** Første skifte (etter at tittelen er avslørt) og tiden hvert ord står, i ms. */
const START = 1300
const STEG = 1150
const INN = { varighet: 600, forsinkelse: 140, tegn: 28, kurve: 'cubic-bezier(0.16, 1, 0.3, 1)' } // --ease-ut
// Ut: et kort løft som tones bort. Tittelen har tett linjeavstand, så et helt løft ut av masken ville streifet
// linjen over.
const UT = { varighet: 320, tegn: 14, kurve: 'cubic-bezier(0.65, 0, 0.35, 1)' } // --ease-in-out

/**
 * Ordet som skifter: bokstavene i det gamle ordet løftes og tones bort, det nye ordets bokstaver glir opp nedenfra
 * bak masken, én og én – som «Text Rotate». Runden går én gang (f.eks. historie → karakter → dybde → historie) og
 * stopper på første ord; alt er ferdig under 5 s (WCAG 2.2.2). Ingenting skifter ved redusert bevegelse eller
 * uten JavaScript.
 *
 * Komponenten er pynt (aria-hidden): skjermlesere får den faste setningen fra en sr-only-tekst ved siden av.
 * Bare første ord ligger i flyten, så tittelen brytes nøyaktig som uten bevegelse; de andre ligger oppå, uten
 * linjeskift. Et ord som ikke får plass på linjen ved denne skjermbredden, hoppes over i runden (f.eks.
 * «karakter» i en smal kolonne), så ingenting stikker ut av tittelen.
 *
 * Masken må ligge rundt og bare klippe loddrett (overflow-y: clip, overflow-x: visible), f.eks. «.ord-maske» i
 * tittelen – ellers klippes et ord som er bredere enn det første.
 */
export function Ordskifte({ ord }: { ord: readonly string[] }) {
  const rot = useRef<HTMLSpanElement>(null)
  const [tilstand, setTilstand] = useState({ aktiv: 0, forrige: -1 })

  useEffect(() => {
    const el = rot.current
    if (!el || ord.length < 2) return
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timere: number[] = []
    const io = new IntersectionObserver(([rad]) => {
      if (!rad?.isIntersecting) return
      io.disconnect()
      // Plassen fra ordets venstre kant til høyre kant av blokken det står i (tittelen).
      const blokk = el.parentElement?.closest('h1, h2, h3, p, div') ?? document.body
      const ledig = blokk.getBoundingClientRect().right - el.getBoundingClientRect().left
      const ordene = el.querySelectorAll<HTMLElement>('[data-ord]')
      // Rekkefølgen: ord 1, 2 … (de som får plass) og tilbake til ord 0, der runden stopper.
      const passer = [...ord.keys()].slice(1).filter((n) => (ordene[n]?.offsetWidth ?? Infinity) <= ledig)
      if (passer.length === 0) return
      passer.concat(0).forEach((n, k) => {
        timere.push(
          window.setTimeout(() => setTilstand((t) => ({ aktiv: n, forrige: t.aktiv })), START + k * STEG),
        )
      })
    })
    io.observe(el)
    return () => {
      io.disconnect()
      timere.forEach(clearTimeout)
    }
  }, [ord])

  // Web Animations API: bare transform og opacity, og ingen egne keyframes i CSS-en.
  useLayoutEffect(() => {
    const el = rot.current
    if (!el || tilstand.forrige < 0) return
    const ordene = el.querySelectorAll<HTMLElement>('[data-ord]')
    const tegn = (n: number) => ordene[n]?.querySelectorAll<HTMLElement>('[data-tegn]') ?? []
    tegn(tilstand.forrige).forEach((t, k) => {
      t.getAnimations().forEach((a) => a.cancel())
      t.animate(
        [
          { transform: 'translateY(0)', opacity: 1 },
          { transform: 'translateY(-45%)', opacity: 0 },
        ],
        {
          duration: UT.varighet,
          delay: k * UT.tegn,
          easing: UT.kurve,
          fill: 'forwards',
        },
      )
    })
    tegn(tilstand.aktiv).forEach((t, k) => {
      t.getAnimations().forEach((a) => a.cancel())
      t.animate([{ transform: 'translateY(115%)' }, { transform: 'translateY(0)' }], {
        duration: INN.varighet,
        delay: INN.forsinkelse + k * INN.tegn,
        easing: INN.kurve,
        fill: 'backwards',
      })
    })
  }, [tilstand])

  return (
    <span ref={rot} className="relative inline-block" aria-hidden>
      {ord.map((o, n) => (
        <span
          key={o}
          data-ord=""
          className={cn(
            'whitespace-nowrap',
            n > 0 && 'absolute top-0 left-0',
            n !== tilstand.aktiv && n !== tilstand.forrige && 'invisible',
          )}
        >
          {[...o].map((c, k) => (
            <span key={k} data-tegn="" className="inline-block">
              {c}
            </span>
          ))}
        </span>
      ))}
    </span>
  )
}
