import type { Metadata } from 'next'
import { Produktliste } from '@/components/katalog/produktliste'
import { Brodsmuler } from '@/components/layout/brodsmuler'
import { lesListetilstand } from '@/lib/katalog/sporring'
import { naa } from '@/lib/tid'
import { hentKatalog } from '@/lib/woocommerce'

export const metadata: Metadata = {
  title: 'Alle produkter',
  description:
    'Alle produktene i Regina Parfymeris nettbutikk – nisjedufter, hudpleie, makeup, hår og tilbehør.',
  alternates: { canonical: '/butikk/' },
}

export default async function Butikk({ searchParams }: PageProps<'/butikk'>) {
  const katalog = await hentKatalog()
  return (
    <div className="mx-auto max-w-screen-2xl px-4 pt-6 pb-10 md:px-6">
      <Brodsmuler smuler={[{ navn: 'Alle produkter' }]} />
      <h1 className="mt-8 mb-10 text-4xl md:text-6xl">Alle produkter</h1>
      <Produktliste
        katalog={katalog}
        base={katalog.produkter}
        tilstand={lesListetilstand(await searchParams)}
        basis="/butikk/"
        underkategorier={katalog.kategorier}
        naa={naa()}
      />
    </div>
  )
}
