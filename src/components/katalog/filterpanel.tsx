import { Check, X } from 'lucide-react'
import Link from 'next/link'
import {
  listeUrl,
  veksle,
  type Fasetter,
  type Fasettverdi,
  type Filtre,
  type Listetilstand,
} from '@/lib/katalog/sporring'
import { cn } from '@/lib/utils'

type Listefilter = 'kategori' | 'merke' | 'pris' | 'storrelse' | 'farge'

/** Én filterverdi som lenke: virker uten JavaScript, og filtrert liste kan deles. */
function Valg({ href, verdi }: { href: string; verdi: Fasettverdi }) {
  return (
    <Link
      href={href}
      scroll={false}
      rel="nofollow"
      className="group flex min-h-10 items-center gap-3 py-1 text-[0.9375rem] hover:text-regina-pink-strong"
      aria-current={verdi.valgt ? 'true' : undefined}
    >
      <span
        className={cn(
          'grid size-4.5 shrink-0 place-items-center border',
          verdi.valgt ? 'border-regina-plum bg-regina-plum text-white' : 'border-input bg-paper',
        )}
        aria-hidden
      >
        {verdi.valgt && <Check className="size-3.5" />}
      </span>
      <span className="flex-1">{verdi.navn}</span>
      <span className="text-sm text-sand-ink tabular-nums">{verdi.antall}</span>
      {verdi.valgt && <span className="sr-only">(valgt – trykk for å fjerne)</span>}
    </Link>
  )
}

function Gruppe({
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
  return (
    <details
      open={apen || verdier.some((v) => v.valgt)}
      className="group/gruppe border-b border-sand-200 py-3"
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-medium [&::-webkit-details-marker]:hidden">
        {tittel}
        <span
          className="text-xl leading-none text-sand-ink group-open/gruppe:rotate-45 transition-transform duration-(--dur-base)"
          aria-hidden
        >
          +
        </span>
      </summary>
      <ul className={cn('pb-2', verdier.length > 10 && 'max-h-80 overflow-y-auto pr-2')}>
        {verdier.map((v) => (
          <li key={v.id}>
            <Valg
              verdi={v}
              href={listeUrl(basis, tilstand, {
                filtre: { ...tilstand.filtre, [felt]: veksle(tilstand.filtre[felt], v.id) } as Filtre,
              })}
            />
          </li>
        ))}
      </ul>
    </details>
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
  return (
    <div>
      {visKategori && (
        <Gruppe
          tittel="Kategori"
          verdier={fasetter.kategori}
          felt="kategori"
          basis={basis}
          tilstand={tilstand}
        />
      )}
      {visMerke && (
        <Gruppe tittel="Merke" verdier={fasetter.merke} felt="merke" basis={basis} tilstand={tilstand} />
      )}
      <Gruppe tittel="Pris" verdier={fasetter.pris} felt="pris" basis={basis} tilstand={tilstand} />
      <Gruppe
        tittel="Størrelse"
        verdier={fasetter.storrelse}
        felt="storrelse"
        basis={basis}
        tilstand={tilstand}
        apen={false}
      />
      <Gruppe
        tittel="Farge"
        verdier={fasetter.farge}
        felt="farge"
        basis={basis}
        tilstand={tilstand}
        apen={false}
      />
      <details open className="border-b border-sand-200 py-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center font-medium [&::-webkit-details-marker]:hidden">
          Tilgjengelighet
        </summary>
        <ul className="pb-2">
          <li>
            <Valg
              verdi={{ id: 'lager', navn: 'På lager', antall: fasetter.lager, valgt: f.lager }}
              href={listeUrl(basis, tilstand, { filtre: { ...f, lager: !f.lager } })}
            />
          </li>
          {(fasetter.tilbud > 0 || f.tilbud) && (
            <li>
              <Valg
                verdi={{ id: 'tilbud', navn: 'På tilbud', antall: fasetter.tilbud, valgt: f.tilbud }}
                href={listeUrl(basis, tilstand, { filtre: { ...f, tilbud: !f.tilbud } })}
              />
            </li>
          )}
        </ul>
      </details>
    </div>
  )
}

/** Aktive filtre som knapper som fjerner hvert enkelt, og «Nullstill». */
export function AktiveFiltre({
  fasetter,
  tilstand,
  basis,
}: {
  fasetter: Fasetter
  tilstand: Listetilstand
  basis: string
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
    <ul className="flex flex-wrap items-center gap-2" aria-label="Aktive filtre">
      {aktive.map((a) => (
        <li key={a.href}>
          <Link
            href={a.href}
            scroll={false}
            rel="nofollow"
            className="inline-flex h-9 items-center gap-2 border border-sand-200 bg-paper px-3 text-sm hover:border-regina-plum"
          >
            {a.tekst}
            <X className="size-3.5" aria-hidden />
            <span className="sr-only">– fjern filteret</span>
          </Link>
        </li>
      ))}
      <li>
        <Link
          href={listeUrl(
            basis,
            {
              ...tilstand,
              filtre: {
                kategori: [],
                merke: [],
                pris: [],
                storrelse: [],
                farge: [],
                lager: false,
                tilbud: false,
              },
            },
            { side: 1 },
          )}
          scroll={false}
          className="px-2 text-sm text-regina-pink-strong underline underline-offset-4"
        >
          Nullstill
        </Link>
      </li>
    </ul>
  )
}
