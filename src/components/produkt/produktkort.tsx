// Bygget etter «Product Card» (deltacomponents, MIT) på 21st.dev – https://21st.dev/@deltacomponents/components/product-card. Egen kode; ingen kode er kopiert.

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { erNyhet, erPaTilbud, hurtigkjop } from '@/lib/katalog/sporring'
import { produktUrl } from '@/lib/lenker'
import { NYHET_DAGER } from '@/lib/tid'
import type { Produkt } from '@/lib/woocommerce/typer'
import { Hurtigkjop } from './hurtigkjop'
import { Pris } from './pris'
import { Produktbilde } from './produktbilde'

/**
 * Produktkort: kvadratisk bildebrønn med merke og hurtigkjøp over hjørnene, og under den en rad med navn til
 * venstre og pris til høyre. Er kortet smalt (to kolonner på mobil), legger prisen seg under navnet. Hele kortet
 * er én lenke (navnet strekkes over kortet), så det blir ett tabulatorstopp per vare pluss hurtigkjøpet.
 */
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
  // Bare ett merke om gangen, og bare med grunnlag i WooCommerce: lager, ekte tilbudspris, publiseringsdato.
  const merke =
    p.lager.status === 'utsolgt'
      ? ({ variant: 'utsolgt', tekst: 'Utsolgt' } as const)
      : erPaTilbud(p)
        ? ({ variant: 'tilbud', tekst: 'Tilbud' } as const)
        : erNyhet(p, naa, NYHET_DAGER)
          ? ({ variant: 'nyhet', tekst: 'Nyhet' } as const)
          : null

  return (
    <article className="group @container relative flex flex-col">
      <div className="relative">
        <Produktbilde src={p.bilder[0]?.src ?? null} alt="" sizes={sizes} prioritet={prioritet} zoom />
        {merke && (
          <Badge variant={merke.variant} className="pointer-events-none absolute top-2 left-2">
            {merke.tekst}
          </Badge>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        {p.merke && <p className="text-xs tracking-[0.14em] text-sand-ink uppercase">{p.merke.navn}</p>}
        <div className="mt-1 flex flex-col gap-1 @[15rem]:flex-row @[15rem]:items-baseline @[15rem]:justify-between @[15rem]:gap-4">
          <h3 className="min-w-0 font-sans text-base leading-snug font-normal">
            <Link
              href={produktUrl(p.slug)}
              aria-label={navn}
              className="transition-colors duration-(--dur-fast) group-hover:text-regina-pink-strong after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-regina-pink-strong"
            >
              {p.visningsnavn}
            </Link>
          </h3>
          <Pris
            pris={p.pris}
            fra={p.prisspenn?.fra}
            // Ved tilbud står førprisen under, så navnet beholder bredden.
            className="shrink-0 text-base font-medium @[15rem]:flex-col @[15rem]:items-end @[15rem]:text-right"
          />
        </div>
        {p.lager.status === 'fa-igjen' && p.lager.antall !== null && (
          <p className="mt-1 text-sm text-status-varsel">
            {p.lager.antall === 1 ? 'Bare 1 igjen' : `Få igjen (${p.lager.antall})`}
          </p>
        )}
      </div>

      {kjop && (
        // Øverst til høyre i bildebrønnen, over lenkeflaten og alltid synlig – virker uten peker og uten
        // JavaScript. Står sist i koden, så navnet kommer før knappen for tastatur og skjermleser.
        <div className="absolute top-2 right-2 z-10">
          <Hurtigkjop produktId={p.id} variantId={kjop.variantId} navn={navn} />
        </div>
      )}
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
