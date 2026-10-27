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
import { AktiveFiltre, Filterpanel } from './filterpanel'
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
    <div className="grid gap-10 lg:grid-cols-[15rem_1fr] xl:grid-cols-[17rem_1fr]">
      <aside aria-label="Filtre" className="hidden lg:block">
        {panel}
      </aside>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-200 pb-4">
          <p className="text-sand-ink" aria-live="polite">
            {antallTekst(filtrert.length, 'produkt', 'produkter')}
          </p>
          <div className="flex items-center gap-3">
            <Filterskuff antallAktive={aktive} treff={filtrert.length}>
              {panel}
            </Filterskuff>
            <Sortering valgt={tilstand.sortering} valg={sorteringer} skjulte={skjulteFelt(tilstand)} />
          </div>
        </div>
        <div className="mt-4">
          <AktiveFiltre fasetter={fas} tilstand={tilstand} basis={basis} />
        </div>
        {elementer.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-heading text-2xl">Ingen produkter passer filtrene</p>
            <p className="mt-2 text-sand-ink">Prøv å fjerne et filter – eller spør oss i butikken.</p>
          </div>
        ) : (
          <div className="mt-8">
            <Produktrutenett>
              {elementer.map((p, i) => (
                <Produktkort key={p.id} produkt={p} naa={naa} prioritet={i < 4} />
              ))}
            </Produktrutenett>
          </div>
        )}
        {flere && (
          <div className="mt-14 flex flex-col items-center gap-3">
            <p className="text-sm text-sand-ink">
              Viser {elementer.length} av {filtrert.length}
            </p>
            <Button asChild variant="outline" size="lg">
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
