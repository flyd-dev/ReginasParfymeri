import type { Metadata } from 'next'
import { Listehode } from '@/components/katalog/listehode'
import { Produktliste } from '@/components/katalog/produktliste'
import { Brodsmuler } from '@/components/layout/brodsmuler'
import { erNyhet, lesListetilstand } from '@/lib/katalog/sporring'
import { NYHET_DAGER, naa } from '@/lib/tid'
import { hentKatalog } from '@/lib/woocommerce'

export const metadata: Metadata = {
  title: 'Nyheter',
  description: 'Nye produkter i Regina Parfymeris nettbutikk.',
  alternates: { canonical: '/nyheter/' },
}

/** Nyheter = publisert i WooCommerce de siste NYHET_DAGER dagene. */
export default async function Nyheter({ searchParams }: PageProps<'/nyheter'>) {
  const katalog = await hentKatalog()
  const tidspunkt = naa()
  const base = katalog.produkter.filter((p) => erNyhet(p, tidspunkt, NYHET_DAGER))
  return (
    <div className="mx-auto max-w-screen-2xl px-4 pt-6 pb-10 md:px-6">
      <Brodsmuler smuler={[{ navn: 'Nyheter' }]} />
      <Listehode
        overtittel="Nettbutikken"
        tittel="Nyheter"
        ingress={`Lagt ut i nettbutikken de siste ${NYHET_DAGER} dagene.`}
      />
      <Produktliste
        katalog={katalog}
        base={base}
        tilstand={lesListetilstand(await searchParams, 'nyeste')}
        basis="/nyheter/"
        underkategorier={katalog.kategorier}
        naa={tidspunkt}
      />
    </div>
  )
}
