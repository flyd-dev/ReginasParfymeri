// Bygget etter «Sync Status Toast» (ShadcnSpace, MIT) på 21st.dev – https://21st.dev/@shadcnspace/components/sonner-05. Egen kode; ingen kode er kopiert.
//
// Fra forbildet: varsel med ikon i en kvadratisk flis, tittel og beskrivelse, en tynn linje med statusmerke og
// metadata, og to handlinger side om side. Hos oss er «synkroniseringen» handlekurven mot nettbutikken: varselet
// sier hva som ikke ble lagret, eller hva nettbutikken har rettet (pris, lager, antall). Statusmerket står i
// metadatalinjen og ikke ved tittelen, så lange norske titler får plass. Statusfargen kommer fra tokens
// (--status-feil / --status-varsel), uten skygge og med 2 px hjørner.

'use client'

import { RefreshCw, ShoppingBag, TriangleAlert, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { kroner } from '@/lib/format'
import type { Kurvmelding } from '@/lib/kurv/typer'
import { cn } from '@/lib/utils'
import { useKurv } from './kurv-provider'

export function meldingstekst(m: Kurvmelding): string {
  switch (m.type) {
    case 'pris-endret':
      return `Prisen på ${m.navn} er endret fra ${kroner(m.fra)} til ${kroner(m.til)}.`
    case 'utsolgt':
      return `${m.navn} er dessverre utsolgt og er tatt ut av handlekurven.`
    case 'antall-justert':
      return `Vi har bare ${m.antall} igjen av ${m.navn}. Antallet er justert.`
    case 'fjernet':
      return `${m.navn} finnes ikke lenger i nettbutikken og er tatt ut av handlekurven.`
    case 'tekst':
      return m.tekst
  }
}

/** Første endring i klartekst, og hvor mange flere det er (resten står i handlekurven). */
function oppsummer(meldinger: Kurvmelding[]): string {
  const [forste, ...resten] = meldinger
  if (!forste) return ''
  if (resten.length === 0) return meldingstekst(forste)
  return `${meldingstekst(forste)} Og ${resten.length === 1 ? 'én endring' : `${resten.length} endringer`} til.`
}

/** Det et varsel om handlekurven kan si. */
export type Kurvvarsel =
  /** En endring ble avvist – teksten er serverens egen melding. */
  | { type: 'feil'; tittel: string; tekst: string }
  /** Nettbutikken har rettet kurven (pris, lager, antall). */
  | { type: 'oppdatert'; meldinger: Kurvmelding[] }

const STATUS = {
  feil: { ikon: TriangleAlert, flis: 'bg-status-feil', merke: 'text-status-feil', merketekst: 'Ikke lagret' },
  oppdatert: {
    ikon: RefreshCw,
    flis: 'bg-status-varsel',
    merke: 'text-status-varsel',
    merketekst: 'Oppdatert',
  },
} as const

/** Ikon i kvadratisk flis i statusfargen (forbildets mørke flis). */
function Statusflis({ type, className }: { type: Kurvvarsel['type']; className?: string }) {
  const { ikon: Ikon, flis } = STATUS[type]
  return (
    <span className={cn('grid shrink-0 place-items-center text-white', flis, className)} aria-hidden>
      <Ikon className="size-[45%]" strokeWidth={2} />
    </span>
  )
}

/**
 * Varselet som vises med sonner (toast.custom). Ligger inne i KurvProvider, så antall og delsum er alltid
 * ferske. Klikkbart også mens handlekurven er åpen (pointer-events på flaten, se Handlekurv).
 */
export function Kurvtoast({ varsel, lukk }: { varsel: Kurvvarsel; lukk: () => void }) {
  const { kurv, apen, setApen } = useKurv()
  const s = STATUS[varsel.type]
  const tittel = varsel.type === 'feil' ? varsel.tittel : 'Handlekurven er oppdatert'
  const tekst = varsel.type === 'feil' ? varsel.tekst : oppsummer(varsel.meldinger)
  const sti = usePathname()
  // «Se handlekurven» bare når den ikke allerede er åpen eller er siden man står på.
  const visKurv = !apen && sti !== '/handlekurv/' && !!kurv && kurv.antall > 0
  return (
    <div className="pointer-events-auto w-full border border-sand-200 bg-paper p-4 text-regina-plum">
      <div className="flex items-start gap-3.5">
        <Statusflis type={varsel.type} className="size-10" />
        <div className="min-w-0 flex-1">
          <p className="leading-snug font-medium">{tittel}</p>
          <p className="mt-1 leading-snug text-sand-ink">{tekst}</p>
        </div>
      </div>
      {/* Statuslinjen: merket til venstre, kurven slik den står nå til høyre (forbildets «branch / last sync»). */}
      <div className="mt-4 flex items-center justify-between gap-4 border-t border-sand-200 pt-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 border border-current px-1.5 py-1 text-xs leading-none font-semibold tracking-[0.12em] uppercase',
            s.merke,
          )}
        >
          <span className="size-1.5 bg-current" aria-hidden />
          {s.merketekst}
        </span>
        {kurv && kurv.antall > 0 && (
          // Bare visuelt – skjermlesere har antallet på handlekurvknappen i toppen.
          <span className="text-sm text-sand-ink tabular-nums" aria-hidden>
            <span className="font-semibold text-regina-plum">{kurv.antall}</span>{' '}
            {kurv.antall === 1 ? 'vare' : 'varer'} · {kroner(kurv.delsum)}
          </span>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <Button variant="outline" className={cn('h-10 bg-paper px-4', !visKurv && 'flex-1')} onClick={lukk}>
          <X aria-hidden />
          Lukk
        </Button>
        {visKurv && (
          <Button
            className="h-10 flex-1 px-4"
            onClick={() => {
              setApen(true)
              lukk()
            }}
          >
            <ShoppingBag aria-hidden />
            Se handlekurven
          </Button>
        )}
      </div>
    </div>
  )
}

/** Endringer nettbutikken har gjort i kurven, i skuffen og på handlekurvsiden. Samme form som varselet. */
export function Kurvmeldinger({ meldinger }: { meldinger: Kurvmelding[] }) {
  if (meldinger.length === 0) return null
  return (
    <div className="flex gap-3.5 border border-sand-200 bg-sand-50 p-4" role="status">
      <Statusflis type="oppdatert" className="size-9" />
      <div className="min-w-0">
        <p className="leading-snug font-medium">Handlekurven er oppdatert</p>
        <ul className="mt-1 space-y-1 leading-snug text-sand-ink">
          {meldinger.map((m, i) => (
            <li key={i}>{meldingstekst(m)}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
