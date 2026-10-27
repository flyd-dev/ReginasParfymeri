import type { Metadata } from 'next'
import { Produktliste } from '@/components/katalog/produktliste'
import { Brodsmuler } from '@/components/layout/brodsmuler'
import { erPaTilbud, lesListetilstand } from '@/lib/katalog/sporring'
import { naa } from '@/lib/tid'
import { hentKatalog } from '@/lib/woocommerce'

export const metadata: Metadata = {
  title: 'Tilbud',
  description: 'Produkter på tilbud i Regina Parfymeris nettbutikk.',
  alternates: { canonical: '/tilbud/' },
}

/** Bare varer WooCommerce selv har satt på tilbud – ingen egne kampanjer. */
export default async function Tilbud({ searchParams }: PageProps<'/tilbud'>) {
  const katalog = await hentKatalog()
  const base = katalog.produkter.filter(erPaTilbud)
  return (
    <div className="mx-auto max-w-screen-2xl px-4 pt-6 pb-10 md:px-6">
      <Brodsmuler smuler={[{ navn: 'Tilbud' }]} />
      <h1 className="mt-8 mb-10 text-4xl md:text-6xl">Tilbud</h1>
      <Produktliste
        katalog={katalog}
        base={base}
        tilstand={lesListetilstand(await searchParams)}
        basis="/tilbud/"
        underkategorier={katalog.kategorier}
        naa={naa()}
      />
    </div>
  )
}
