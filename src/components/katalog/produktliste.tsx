// Bygget etter «Ecommerce Category Page» (Mohammad Shehadeh / Hirael, MIT) på 21st.dev – https://21st.dev/@mohammadshehadeh/components/ecommerce-04. Egen kode; ingen kode er kopiert.
//
// Fra forbildet: fast filterkolonne til venstre som følger med ved rulling, verktøylinje med antall treff og
// sortering over rutenettet, aktive filtre som brikker og en tynn linje før produktene; på mobil en
// «Filtrer»-knapp ved siden av antallet og sorteringen i full bredde under.

import Link from 'next/link'
import { Produktkort, Produktrutenett } from '@/components/produkt/produktkort'
import { Button } from '@/components/ui/button'
import { antallTekst } from '@/lib/format'
import {
  SORTERINGER,
  antallAktive,
  fasetter,
  filtrer,
  listeUrl,
  side,
  sorter,
  type Listetilstand,
} from '@/lib/katalog/sporring'
import type { Kategori, Katalog, Produkt } from '@/lib/woocommerce/typer'
import { AktiveFiltre, Filterpanel, nullstillUrl } from './filterpanel'
import { Filterskuff } from './filterskuff'
import { Sortering } from './sortering'

function skjulteFelt(t: Listetilstand): Record<string, string> {
  const ut: Record<string, string> = {}
  if (t.sok) ut.q = t.sok
  for (const k of ['kategori', 'merke', 'pris', 'storrelse', 'farge'] as const) {
    if (t.filtre[k].length) ut[k] = t.filtre[k].join(',')
  }
  if (t.filtre.lager) ut.lager = '1'
  if (t.filtre.tilbud) ut.tilbud = '1'
  return ut
}

/**
 * Produktliste med filtre, sortering, antall treff og «Vis flere». Brukes av kategori, merke, søk og
 * samlesidene. Alt er lenker og skjemaer, så listen virker uten JavaScript og filtrene kan deles.
 */
export function Produktliste({
  katalog,
  base,
  tilstand,
  basis,
  basisSti = [],
  underkategorier = [],
  visKategori = true,
  visMerke = true,
  naa,
}: {
  katalog: Katalog
  base: Produkt[]
  tilstand: Listetilstand
  /** Adressen listen står på, f.eks. /produktkategori/duft/. */
  basis: string
  basisSti?: string[]
  underkategorier?: Kategori[]
  visKategori?: boolean
  visMerke?: boolean
  naa: Date
}) {
  const filtrert = filtrer(base, tilstand.filtre, basisSti)
  const sortert = tilstand.sortering === 'relevans' ? filtrert : sorter(filtrert, tilstand.sortering)
  const { elementer, flere } = side(sortert, tilstand.side)
  const fas = fasetter(base, tilstand.filtre, katalog, underkategorier, basisSti)
  const aktive = antallAktive(tilstand.filtre)
  const nullstill = nullstillUrl(basis, tilstand)
  const sorteringer = [
    ...(tilstand.sok !== undefined ? [{ id: 'relevans', navn: 'Mest relevant' }] : []),
    ...SORTERINGER,
  ].map((s) => ({ ...s, url: listeUrl(basis, tilstand, { sortering: s.id as Listetilstand['sortering'] }) }))
  const panel = (
    <Filterpanel
      fasetter={fas}
      tilstand={tilstand}
      basis={basis}
      visKategori={visKategori}
      visMerke={visMerke}
    />
  )

  return (
    <div className="grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-12 xl:grid-cols-[16.5rem_1fr] xl:gap-16">
      <aside aria-label="Filtre" className="hidden lg:block">
        {/* Følger med ved rulling under den faste toppen; egen rulling når filtrene er høyere enn vinduet. */}
        <div className="sticky top-36 max-h-[calc(100dvh-10rem)] overflow-y-auto overscroll-contain pr-2 pb-6 [scrollbar-width:thin]">
          {/* Samme høyde som verktøylinjen til høyre, så de to linjene står likt. */}
          <div className="border-b border-sand-200 pb-5">
            <div className="flex min-h-11 items-center justify-between gap-4">
              <h2 className="text-2xl">Filtre</h2>
              {aktive > 0 && (
                <Link
                  href={nullstill}
                  scroll={false}
                  rel="nofollow"
                  className="text-sand-ink underline underline-offset-4 hover:text-regina-plum"
                >
                  Fjern alle
                </Link>
              )}
            </div>
          </div>
          {panel}
        </div>
      </aside>

      <div className="min-w-0">
        <div className="border-b border-sand-200 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <div className="flex items-center gap-4">
              <Filterskuff antallAktive={aktive} treff={filtrert.length} nullstill={nullstill}>
                {panel}
              </Filterskuff>
              <p className="text-sand-ink tabular-nums" aria-live="polite">
                {antallTekst(filtrert.length, 'produkt', 'produkter')}
              </p>
            </div>
            <Sortering
              valgt={tilstand.sortering}
              valg={sorteringer}
              skjulte={skjulteFelt(tilstand)}
              className="w-full sm:w-auto"
            />
          </div>
          <AktiveFiltre fasetter={fas} tilstand={tilstand} basis={basis} className="mt-4" />
        </div>

        {elementer.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <p className="font-heading text-2xl md:text-3xl">
              {aktive > 0 ? 'Ingen produkter passer filtrene' : 'Ingen produkter her ennå'}
            </p>
            <p className="mt-3 max-w-md text-sand-ink">
              {aktive > 0
                ? 'Prøv å fjerne et filter – eller spør oss i butikken.'
                : 'Spør oss gjerne – enkelte merker finnes bare i butikken i Haraldsgata.'}
            </p>
            {aktive > 0 && (
              <Button asChild variant="outline" size="lg" className="mt-8 bg-paper">
                <Link href={nullstill} scroll={false} rel="nofollow">
                  Fjern alle filtre
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-8">
            <h2 className="sr-only">Produkter</h2>
            <Produktrutenett>
              {elementer.map((p, i) => (
                <Produktkort key={p.id} produkt={p} naa={naa} prioritet={i < 4} />
              ))}
            </Produktrutenett>
          </div>
        )}

        {flere && (
          <div className="mx-auto mt-16 flex max-w-xs flex-col items-center gap-4">
            <p className="text-sand-ink tabular-nums">
              Viser {elementer.length} av {filtrert.length}
            </p>
            {/* Fremdrift som tynn linje – samme tall som teksten over. */}
            <div className="h-px w-full bg-sand-200" aria-hidden>
              <div
                className="h-px origin-left bg-regina-plum"
                style={{ transform: `scaleX(${elementer.length / filtrert.length})` }}
              />
            </div>
            <Button asChild variant="outline" size="lg" className="mt-2 w-full bg-paper">
              <Link
                href={listeUrl(basis, tilstand, { side: tilstand.side + 1 })}
                scroll={false}
                rel="nofollow"
              >
                Vis flere
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
