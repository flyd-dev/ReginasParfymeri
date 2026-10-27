import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { erNyhet, erPaTilbud, hurtigkjop } from '@/lib/katalog/sporring'
import { produktUrl } from '@/lib/lenker'
import { NYHET_DAGER } from '@/lib/tid'
import type { Produkt } from '@/lib/woocommerce/typer'
import { Hurtigkjop } from './hurtigkjop'
import { Pris } from './pris'
import { Produktbilde } from './produktbilde'

export function Produktkort({
  produkt: p,
  naa,
  prioritet = false,
  sizes = '(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw',
}: {
  produkt: Produkt
  naa: Date
  prioritet?: boolean
  sizes?: string
}) {
  const kjop = hurtigkjop(p)
  const navn = [p.merke?.navn, p.visningsnavn].filter(Boolean).join(' – ')
  const nyhet = erNyhet(p, naa, NYHET_DAGER)
  return (
    <article className="group relative flex flex-col">
      <Link href={produktUrl(p.slug)} className="block" aria-label={navn}>
        <Produktbilde
          src={p.bilder[0]?.src ?? null}
          alt={p.bilder[0]?.alt ?? navn}
          sizes={sizes}
          prioritet={prioritet}
          className="transition-opacity duration-(--dur-base) group-hover:opacity-90"
        />
      </Link>
      <div className="pointer-events-none absolute top-2 left-2 flex flex-col items-start gap-1">
        {p.lager.status === 'utsolgt' ? (
          <Badge variant="utsolgt">Utsolgt</Badge>
        ) : erPaTilbud(p) ? (
          <Badge variant="tilbud">Tilbud</Badge>
        ) : nyhet ? (
          <Badge variant="nyhet">Nyhet</Badge>
        ) : null}
      </div>
      <div className="mt-3 flex flex-1 items-start justify-between gap-3">
        <div className="min-w-0">
          {p.merke && <p className="text-xs tracking-[0.14em] text-sand-ink uppercase">{p.merke.navn}</p>}
          <h3 className="mt-1 font-sans text-[0.9375rem] leading-snug font-normal">
            <Link href={produktUrl(p.slug)} className="hover:text-regina-pink-strong">
              {p.visningsnavn}
            </Link>
          </h3>
          <Pris pris={p.pris} fra={p.prisspenn?.fra} className="mt-1.5 text-[0.9375rem] font-medium" />
          {p.lager.status === 'fa-igjen' && p.lager.antall !== null && (
            <p className="mt-1 text-xs text-status-varsel">
              {p.lager.antall === 1 ? 'Bare 1 igjen' : `Få igjen (${p.lager.antall})`}
            </p>
          )}
        </div>
        {kjop && <Hurtigkjop produktId={p.id} variantId={kjop.variantId} navn={navn} />}
      </div>
    </article>
  )
}

export function Produktrutenett({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
      {children}
    </div>
  )
}
