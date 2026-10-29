// Bygget etter «Growth Story Timeline» (ShadcnSpace, MIT) på 21st.dev – https://21st.dev/@shadcnspace/components/timeline-01. Egen kode; ingen kode er kopiert.

import Image from 'next/image'
import type { ReactNode } from 'react'
import { Prikk } from '@/components/layout/prikk'
import type { Fotografi } from '@/content/bilder'
import { cn } from '@/lib/utils'
import { Fremdriftslinje } from './fremdriftslinje'

export interface Tidspunkt {
  aar: string
  tittel: string
  tekst: string
  /** Bare et bilde som faktisk viser punktet. Et nytt butikkbilde presenteres aldri som historisk. */
  foto?: Fotografi
}

/**
 * Historien som tidslinje: tekst og bilde bytter side langs en tynn midtlinje, årstall i parentes over tittelen,
 * og en ramme av tynne linjer med runde hjørner rundt hele seksjonen (R-32). Linjen fylles ved rulling (se fremdriftslinje.tsx). På mobil
 * ligger linjen i venstre kant og punktene står under hverandre.
 *
 * Endret fra demoen: bare punkter med kilde (src/content/butikk.ts). Punkter uten arkivbilde får årstallet som
 * typografisk plate på lys rosa i stedet for et bilde (bare dekor, skjult for skjermlesere; på mobil vises den
 * ikke). Teksten vises alltid – demoen toner punktene inn ved rulling; her glir bare fotografiene inn (`.avdekk`).
 */
export function Tidslinje({
  punkter,
  tittel,
  kicker,
  ingress,
  id = 'tidslinje-tittel',
}: {
  punkter: readonly Tidspunkt[]
  tittel: ReactNode
  kicker?: string
  ingress?: ReactNode
  id?: string
}) {
  return (
    <section className="rounded-3xl border border-sand-200" aria-labelledby={id}>
      <div className="px-5 py-12 md:px-12 md:py-16 lg:px-16">
        {kicker && (
          <p className="inline-flex items-center gap-2 rounded-full border border-sand-200 bg-paper px-3.5 py-1 text-sm text-sand-ink">
            <Prikk className="size-1.5" />
            {kicker}
          </p>
        )}
        <h2 id={id} className="mt-5 text-4xl md:text-5xl">
          {tittel}
        </h2>
        {ingress && <div className="mt-4 max-w-2xl text-lg text-sand-ink">{ingress}</div>}
      </div>
      <div className="relative border-t border-sand-200">
        {/* På mobil ligger linjen i rammens venstre kant og stopper før det runde hjørnet nederst. */}
        <Fremdriftslinje className="-left-px bottom-8 md:bottom-0 md:left-1/2" />
        <ol>
          {punkter.map((p, i) => {
            const venstre = i % 2 === 0
            return (
              <li
                key={p.aar}
                className="grid gap-8 px-5 py-12 md:grid-cols-2 md:gap-0 md:px-12 md:py-14 lg:px-16 lg:py-16"
              >
                <div
                  className={cn(
                    'md:row-start-1 md:self-center',
                    venstre
                      ? 'md:col-start-1 md:pr-12 md:text-right lg:pr-16'
                      : 'md:col-start-2 md:pl-12 lg:pl-16',
                  )}
                >
                  <p className="text-sand-ink tabular-nums">({p.aar})</p>
                  <h3 className="mt-2 text-3xl md:text-4xl">{p.tittel}</h3>
                  <p className={cn('mt-4 max-w-md text-lg text-sand-ink', venstre && 'md:ml-auto')}>
                    {p.tekst}
                  </p>
                </div>
                <div
                  className={cn(
                    'md:row-start-1',
                    venstre ? 'md:col-start-2 md:pl-12 lg:pl-16' : 'md:col-start-1 md:pr-12 lg:pr-16',
                    !p.foto && 'hidden md:block',
                  )}
                >
                  {p.foto ? (
                    <div className="avdekk relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand-100">
                      <Image
                        src={p.foto.bilde}
                        alt={p.foto.alt}
                        fill
                        sizes="(min-width: 1536px) 620px, (min-width: 768px) 40vw, calc(100vw - 4.5rem)"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="grid aspect-[4/3] place-items-center rounded-2xl bg-regina-pink-50"
                      aria-hidden
                    >
                      <span className="font-heading text-[clamp(4rem,2rem+6vw,8.5rem)] leading-none text-regina-pink italic">
                        {p.aar}
                      </span>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
