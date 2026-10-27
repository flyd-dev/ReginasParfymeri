// Bygget etter «Product Card» (deltacomponents, MIT) på 21st.dev – https://21st.dev/@deltacomponents/components/product-card. Egen kode; ingen kode er kopiert.

import Link from 'next/link'
import { Children, type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { erNyhet, erPaTilbud, hurtigkjop } from '@/lib/katalog/sporring'
import { produktUrl } from '@/lib/lenker'
import { NYHET_DAGER } from '@/lib/tid'
import type { Produkt } from '@/lib/woocommerce/typer'
import { Hurtigkjop } from './hurtigkjop'
import { Morfkort } from './morf'
import { morfnavn, TIL_PRODUKT } from './morfnavn'
import { Pris } from './pris'
import { Produktbilde } from './produktbilde'

/**
 * Produktkort: kvadratisk bildebrønn med merke og hurtigkjøp over hjørnene, og under den en rad med navn til
 * venstre og pris til høyre. Er kortet smalt (to kolonner på mobil), legger prisen seg under navnet. Hele kortet
 * er én lenke (navnet strekkes over kortet), så det blir ett tabulatorstopp per vare pluss hurtigkjøpet.
 *
 * Bevegelse: med mus toner bilde nummer to fram (som i «ProductCard», youcefbnm), og ved trykk glir bildet over i
 * det store bildet på produktsiden (morf.tsx). På berøringsskjerm mister kunden ingenting – bildet er det samme,
 * og alle bildene står i galleriet.
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
    <Morfkort className="group @container relative flex flex-col">
      <div className="relative">
        <Produktbilde
          src={p.bilder[0]?.src ?? null}
          bytte={p.bilder[1]?.src ?? null}
          alt=""
          sizes={sizes}
          prioritet={prioritet}
          zoom
          morf={morfnavn(p.id)}
        />
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
              transitionTypes={[TIL_PRODUKT]}
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
    </Morfkort>
  )
}

/**
 * Rutenett med produktkort. Hvert kort glir inn når det kommer til syne (data-inn, «Inngang» i globals.css), og
 * kortene i samme rad kommer etter hverandre fra venstre: forsinkelsen (--i) er kolonnen, satt i overganger.css
 * for 2, 3 og 4 kolonner. Uten JavaScript eller ved redusert bevegelse står kortene der fra start.
 */
export function Produktrutenett({ children }: { children: ReactNode }) {
  return (
    <div className="rutenett-inn grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
      {Children.map(children, (kort) => (
        // Som <Inn>, men uten --i i style-attributtet, så kolonnen fra CSS-en gjelder. Grid, så kortet fyller cellen.
        <div data-inn="" className="grid" suppressHydrationWarning>
          {kort}
        </div>
      ))}
    </div>
  )
}
