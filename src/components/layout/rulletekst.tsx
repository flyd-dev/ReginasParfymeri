// Bygget etter «Text Roll» (Julien Thibeaut, Motion Primitives, MIT) på 21st.dev – https://21st.dev/@ibelick/components/text-roll. Egen kode; ingen kode er kopiert.
// At rullingen skjer ved peker på lenker, er bare idéen fra «Flip Links» (Vaibhav Kumar Singh, lisens ikke oppgitt) – https://21st.dev/@vaib215/components/flip-links.
//
// Fra forbildet: bokstavene ruller én etter én til en kopi av seg selv. Her ruller de opp (bare transform) når
// pekeren er over lenken eller lenken har tastaturfokus, og tilbake når den går ut. Ren CSS, også uten JavaScript.

import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

/**
 * Lenketekst som ruller opp til en kopi ved peker og tastaturfokus. Forelderen (lenken eller knappen) må ha klassen
 * `group/rull`. Teksten står én gang i DOM-en (for skjermlesere, søkemotorer og kopiering); bokstavene man ser,
 * og kopien under hver av dem, er CSS-innhold (::before og ::after) i et lag som er skjult for skjermlesere. På
 * berøringsskjerm (ingen peker som kan sveve) står teksten i ro – ingenting går tapt.
 */
export function Rulletekst({ tekst, className }: { tekst: string; className?: string }) {
  const tegn = Array.from(tekst)
  // Hele rullingen er forskjøvet over høyst to --stagger (140 ms), så lange ord ikke henger etter.
  const steg = tegn.length > 1 ? Math.min(0.35, 2 / (tegn.length - 1)) : 0
  return (
    <span
      className={cn('relative inline-flex overflow-clip', className)}
      style={{ '--rull-steg': `calc(var(--stagger) * ${steg.toFixed(3)})` } as CSSProperties}
    >
      <span className="sr-only">{tekst}</span>
      <span aria-hidden className="flex">
        {tegn.map((t, i) => (
          <span
            key={i}
            data-t={t}
            className="relative inline-block whitespace-pre transition-transform delay-[calc(var(--k)*var(--rull-steg))] duration-(--dur-slow) ease-ut group-hover/rull:-translate-y-full group-focus-visible/rull:-translate-y-full before:content-[attr(data-t)] after:absolute after:top-full after:left-0 after:content-[attr(data-t)]"
            style={{ '--k': i } as CSSProperties}
          />
        ))}
      </span>
    </span>
  )
}
