'use client'

// Bygget etter «Quote Crossfade» (ibrandify, MIT) på 21st.dev – https://21st.dev/@ibrandify/components/quote-crossfade. Egen kode; ingen kode er kopiert.

import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { Tabs } from 'radix-ui'
import { useState } from 'react'
import type { Sitat } from '@/content/sitater'
import { cn } from '@/lib/utils'

const tall = (n: number) => String(n).padStart(2, '0')

/**
 * Reginas egne ord i et panel med teller («01 / 03»), faner, fremdriftsstrek og forrige/neste. Sitatene ligger
 * oppå hverandre i samme rute, så panelet ikke hopper i høyden, og bytter med kryssfade: det gamle glir opp og
 * ut, det nye opp og inn (bare opacity og transform). Ingen automatisk veksling. Fanene er Radix Tabs, så piltaster,
 * fokus og roller er på plass.
 *
 * Endret fra demoen: bare Reginas egne ord med kildelinje (src/content/sitater.ts) – ingen kundesitater,
 * avatarer med initialer eller merkelapper. Sitatet står i Playfair kursiv med rosa anførselstegn.
 *
 * Panelet er en lys rosa flate med runde hjørner, fanene er piller (R-32). Sekundærtekst er sand-ink-deep, som
 * holder kontrasten på regina-pink-50 (tokens.test.ts).
 */
export function Sitatpanel({
  sitater,
  tittel,
  ingress,
  id = 'sitat-tittel',
}: {
  sitater: readonly Sitat[]
  tittel: string
  ingress?: string
  id?: string
}) {
  const [aktiv, setAktiv] = useState(0)
  const antall = sitater.length
  if (antall === 0) return null
  const ga = (steg: number) => setAktiv((i) => (i + steg + antall) % antall)

  return (
    <section className="rounded-3xl bg-regina-pink-50 p-6 md:p-10" aria-labelledby={id}>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 id={id} className="text-3xl md:text-4xl">
            {tittel}
          </h2>
          {ingress && <p className="mt-2 max-w-md text-sand-ink-deep">{ingress}</p>}
        </div>
        <p className="shrink-0 pt-1 tabular-nums" aria-hidden>
          <span className="font-heading text-2xl">{tall(aktiv + 1)}</span>
          <span className="ml-1.5 text-sand-ink-deep">/ {tall(antall)}</span>
        </p>
      </div>

      <Tabs.Root value={String(aktiv)} onValueChange={(v) => setAktiv(Number(v))} className="mt-8 md:mt-10">
        <Quote className="size-8 text-regina-pink" strokeWidth={1.5} aria-hidden />
        <div className="mt-5 grid">
          {sitater.map((s, i) => (
            <Tabs.Content
              key={s.tema}
              value={String(i)}
              forceMount
              className={cn(
                'col-start-1 row-start-1 transition-[opacity,transform,visibility] duration-(--dur-slow) ease-out',
                i === aktiv && 'visible translate-y-0 opacity-100',
                i < aktiv && 'invisible -translate-y-3 opacity-0',
                i > aktiv && 'invisible translate-y-3 opacity-0',
              )}
            >
              <figure>
                <blockquote className="font-heading text-[clamp(1.5rem,1.05rem+1.4vw,2.375rem)] leading-[1.28] italic">
                  <p>{s.tekst}</p>
                </blockquote>
                <figcaption className="mt-7 flex items-center gap-4">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-regina-plum font-heading text-xl text-sand-50 italic"
                    aria-hidden
                  >
                    R
                  </span>
                  <span>
                    <span className="block font-medium">Regina Parfymeri</span>
                    <span className="block text-sand-ink-deep">
                      Fra <cite className="not-italic">{s.kilde}</cite>
                    </span>
                  </span>
                </figcaption>
              </figure>
            </Tabs.Content>
          ))}
        </div>

        <div className="mt-9 flex items-center justify-between gap-4 border-t border-regina-pink-100 pt-5">
          <Tabs.List aria-label="Velg sitat" className="flex flex-wrap gap-1">
            {sitater.map((s, i) => (
              <Tabs.Trigger
                key={s.tema}
                value={String(i)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sand-ink-deep transition-colors duration-(--dur-fast) hover:text-regina-plum data-[state=active]:bg-regina-pink-100 data-[state=active]:text-regina-plum"
              >
                <span className="tabular-nums">{tall(i + 1)}</span>
                <span className="hidden sm:inline">{s.tema}</span>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => ga(-1)}
              className="grid size-11 place-items-center rounded-full border border-regina-pink-100 bg-paper transition-colors duration-(--dur-fast) hover:bg-regina-pink-100"
              aria-label="Forrige sitat"
            >
              <ChevronLeft className="size-5" strokeWidth={1.5} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => ga(1)}
              className="grid size-11 place-items-center rounded-full border border-regina-pink-100 bg-paper transition-colors duration-(--dur-fast) hover:bg-regina-pink-100"
              aria-label="Neste sitat"
            >
              <ChevronRight className="size-5" strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        </div>
        <div className="relative mt-4 h-px bg-regina-pink-100" aria-hidden>
          <span
            className="absolute inset-x-0 -top-px h-0.5 origin-left rounded-full bg-regina-plum transition-transform duration-(--dur-slow) ease-out"
            style={{ transform: `scaleX(${(aktiv + 1) / antall})` }}
          />
        </div>
      </Tabs.Root>
    </section>
  )
}
