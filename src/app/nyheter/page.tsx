import type { Metadata } from 'next'
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
      <header className="mt-8 mb-10 max-w-3xl">
        <h1 className="text-4xl md:text-6xl">Nyheter</h1>
        <p className="mt-4 text-sand-ink">Lagt ut i nettbutikken de siste {NYHET_DAGER} dagene.</p>
      </header>
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
