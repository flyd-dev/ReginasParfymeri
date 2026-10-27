// Bygget etter «Ecommerce Category Page» (Mohammad Shehadeh / Hirael, MIT) på 21st.dev – https://21st.dev/@mohammadshehadeh/components/ecommerce-04. Egen kode; ingen kode er kopiert.
//
// Fra forbildet: filterkolonne med grupper skilt av tynne linjer, avkrysning med antall til høyre som regnes mot
// de andre filtrene, valg uten treff dempet, en bryter for «bare på lager» og aktive filtre som brikker. Hos oss
// er hvert valg en lenke i adressen (virker uten JavaScript og kan deles), gruppene er <details>, og det er
// ingen vurderinger/stjerner, fargeprikker eller prisglidebryter – vi har ikke data for dem.

import { Check, ChevronDown, X } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  TOMME_FILTRE,
  listeUrl,
  veksle,
  type Fasetter,
  type Fasettverdi,
  type Filtre,
  type Listetilstand,
} from '@/lib/katalog/sporring'
import { cn } from '@/lib/utils'

type Listefilter = 'kategori' | 'merke' | 'pris' | 'storrelse' | 'farge'

/** Så mange valg vises før resten legges under «Vis alle». */
const SYNLIGE = 8

/** Adressen uten filtre (sorteringen og søket beholdes). */
export function nullstillUrl(basis: string, tilstand: Listetilstand): string {
  return listeUrl(basis, { ...tilstand, filtre: TOMME_FILTRE }, { side: 1 })
}

const radklasse =
  'group/valg flex min-h-10 items-center gap-3 py-1 transition-colors duration-(--dur-fast) hover:text-regina-pink-strong'

/** Én filterverdi som lenke med avkrysningsboks: virker uten JavaScript, og filtrert liste kan deles. */
function Valg({ href, verdi }: { href: string; verdi: Fasettverdi }) {
  const tom = verdi.antall === 0 && !verdi.valgt
  return (
    <Link
      href={href}
      scroll={false}
      rel="nofollow"
      className={cn(radklasse, tom && 'text-sand-ink')}
      aria-current={verdi.valgt ? 'true' : undefined}
    >
      <span
        className={cn(
          'grid size-4.5 shrink-0 place-items-center border transition-colors duration-(--dur-fast)',
          verdi.valgt
            ? 'border-regina-plum bg-regina-plum text-white'
            : 'border-input bg-paper group-hover/valg:border-regina-plum',
        )}
        aria-hidden
      >
        {verdi.valgt && <Check className="size-3.5" strokeWidth={2.5} />}
      </span>
      <span className="min-w-0 flex-1">{verdi.navn}</span>
      <span className="text-sm text-sand-ink tabular-nums">{verdi.antall}</span>
      {verdi.valgt && <span className="sr-only">(valgt – trykk for å fjerne)</span>}
    </Link>
  )
}

/** Av/på som lenke, tegnet som en firkantet bryter (forbildets «In stock only»). */
function Bryter({
  href,
  navn,
  antall,
  valgt,
}: {
  href: string
  navn: string
  antall: number
  valgt: boolean
}) {
  return (
    <Link
      href={href}
      scroll={false}
      rel="nofollow"
      className={cn(radklasse, antall === 0 && !valgt && 'text-sand-ink')}
      aria-current={valgt ? 'true' : undefined}
    >
      <span className="min-w-0 flex-1">{navn}</span>
      <span className="text-sm text-sand-ink tabular-nums">{antall}</span>
      <span
        className={cn(
          'relative h-5 w-9 shrink-0 border transition-colors duration-(--dur-fast)',
          valgt
            ? 'border-regina-plum bg-regina-plum'
            : 'border-input bg-paper group-hover/valg:border-regina-plum',
        )}
        aria-hidden
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 size-3.5 transition-transform duration-(--dur-base) ease-out',
            valgt ? 'translate-x-4 bg-white' : 'bg-sand-ink',
          )}
        />
      </span>
      {valgt && <span className="sr-only">(valgt – trykk for å fjerne)</span>}
    </Link>
  )
}

function Gruppe({
  tittel,
  valgt,
  apen,
  children,
}: {
  tittel: string
  valgt: number
  apen: boolean
  children: ReactNode
}) {
  return (
    <details open={apen || valgt > 0} className="group/gruppe border-b border-sand-200 py-2">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 tracking-[0.08em] uppercase [&::-webkit-details-marker]:hidden">
        <span className="flex-1 font-medium">{tittel}</span>
        {valgt > 0 && (
          <span className="grid h-5 min-w-5 place-items-center bg-regina-plum px-1 text-xs font-semibold tracking-normal text-white tabular-nums">
            {valgt}
            <span className="sr-only"> valgt</span>
          </span>
        )}
        <ChevronDown
          className="size-4 text-sand-ink transition-transform duration-(--dur-base) ease-out group-open/gruppe:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="pb-3">{children}</div>
    </details>
  )
}

function Verdigruppe({
  tittel,
  verdier,
  felt,
  basis,
  tilstand,
  apen = true,
}: {
  tittel: string
  verdier: Fasettverdi[]
  felt: Listefilter
  basis: string
  tilstand: Listetilstand
  apen?: boolean
}) {
  if (verdier.length === 0) return null
  const rad = (v: Fasettverdi) => (
    <li key={v.id}>
      <Valg
        verdi={v}
        href={listeUrl(basis, tilstand, {
          filtre: { ...tilstand.filtre, [felt]: veksle(tilstand.filtre[felt], v.id) } as Filtre,
        })}
      />
    </li>
  )
  const kort = verdier.length > SYNLIGE + 2
  const forst = kort ? verdier.slice(0, SYNLIGE) : verdier
  const resten = kort ? verdier.slice(SYNLIGE) : []
  return (
    <Gruppe tittel={tittel} valgt={tilstand.filtre[felt].length} apen={apen}>
      <ul>{forst.map(rad)}</ul>
      {resten.length > 0 && (
        // Lange lister: resten under en egen <details>, så kolonnen ikke får to rullefelt. Virker uten JavaScript.
        <details open={resten.some((v) => v.valgt)} className="group/flere">
          <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 text-regina-pink-strong underline-offset-4 hover:underline group-open/flere:hidden [&::-webkit-details-marker]:hidden">
            Vis alle ({verdier.length})
            <ChevronDown className="size-4" aria-hidden />
          </summary>
          <ul>{resten.map(rad)}</ul>
        </details>
      )}
    </Gruppe>
  )
}

export function Filterpanel({
  fasetter,
  tilstand,
  basis,
  visKategori = true,
  visMerke = true,
}: {
  fasetter: Fasetter
  tilstand: Listetilstand
  basis: string
  visKategori?: boolean
  visMerke?: boolean
}) {
  const f = tilstand.filtre
  const vis = fasetter.lager > 0 || f.lager || fasetter.tilbud > 0 || f.tilbud
  return (
    <div>
      {visKategori && (
        <Verdigruppe
          tittel="Kategori"
          verdier={fasetter.kategori}
          felt="kategori"
          basis={basis}
          tilstand={tilstand}
        />
      )}
      {visMerke && (
        <Verdigruppe tittel="Merke" verdier={fasetter.merke} felt="merke" basis={basis} tilstand={tilstand} />
      )}
      <Verdigruppe tittel="Pris" verdier={fasetter.pris} felt="pris" basis={basis} tilstand={tilstand} />
      <Verdigruppe
        tittel="Størrelse"
        verdier={fasetter.storrelse}
        felt="storrelse"
        basis={basis}
        tilstand={tilstand}
        apen={false}
      />
      <Verdigruppe
        tittel="Farge"
        verdier={fasetter.farge}
        felt="farge"
        basis={basis}
        tilstand={tilstand}
        apen={false}
      />
      {vis && (
        <Gruppe tittel="Tilgjengelighet" valgt={(f.lager ? 1 : 0) + (f.tilbud ? 1 : 0)} apen>
          <ul>
            <li>
              <Bryter
                navn="Bare varer på lager"
                antall={fasetter.lager}
                valgt={f.lager}
                href={listeUrl(basis, tilstand, { filtre: { ...f, lager: !f.lager } })}
              />
            </li>
            {(fasetter.tilbud > 0 || f.tilbud) && (
              <li>
                <Bryter
                  navn="Bare varer på tilbud"
                  antall={fasetter.tilbud}
                  valgt={f.tilbud}
                  href={listeUrl(basis, tilstand, { filtre: { ...f, tilbud: !f.tilbud } })}
                />
              </li>
            )}
          </ul>
        </Gruppe>
      )}
    </div>
  )
}

/** Aktive filtre som brikker som fjerner hvert enkelt, og «Nullstill». */
export function AktiveFiltre({
  fasetter,
  tilstand,
  basis,
  className,
}: {
  fasetter: Fasetter
  tilstand: Listetilstand
  basis: string
  className?: string
}) {
  const f = tilstand.filtre
  const navn = (liste: Fasettverdi[], id: string) => liste.find((v) => v.id === id)?.navn ?? id
  const aktive: { tekst: string; href: string }[] = [
    ...(['kategori', 'merke', 'pris', 'storrelse', 'farge'] as const).flatMap((felt) =>
      f[felt].map((id) => ({
        tekst: navn(fasetter[felt], id),
        href: listeUrl(basis, tilstand, { filtre: { ...f, [felt]: f[felt].filter((x) => x !== id) } }),
      })),
    ),
    ...(f.lager
      ? [{ tekst: 'På lager', href: listeUrl(basis, tilstand, { filtre: { ...f, lager: false } }) }]
      : []),
    ...(f.tilbud
      ? [{ tekst: 'På tilbud', href: listeUrl(basis, tilstand, { filtre: { ...f, tilbud: false } }) }]
      : []),
  ]
  if (aktive.length === 0) return null
  return (
    <ul className={cn('flex flex-wrap items-center gap-2', className)} aria-label="Aktive filtre">
      {aktive.map((a) => (
        <li key={a.href}>
          <Link
            href={a.href}
            scroll={false}
            rel="nofollow"
            className="inline-flex h-9 items-center gap-2 border border-sand-200 bg-paper pr-2.5 pl-3 transition-colors duration-(--dur-fast) hover:border-regina-plum"
          >
            {a.tekst}
            <X className="size-3.5 text-sand-ink" aria-hidden />
            <span className="sr-only">– fjern filteret</span>
          </Link>
        </li>
      ))}
      <li>
        <Link
          href={nullstillUrl(basis, tilstand)}
          scroll={false}
          className="inline-flex h-9 items-center px-2 text-regina-pink-strong underline underline-offset-4 hover:text-regina-plum"
        >
          Nullstill
        </Link>
      </li>
    </ul>
  )
}
