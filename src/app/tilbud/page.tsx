import type { Metadata } from 'next'
import { Produktliste } from '@/components/liste/Produktliste'
import { hentKatalog } from '@/lib/katalog/kilde'
import { barnAv, erPaTilbud, type Sokeparametre } from '@/lib/katalog/sporring'
import { byggListe } from '@/lib/liste'

export const metadata: Metadata = { title: 'Tilbud' }

export default async function Tilbudsside({ searchParams }: { searchParams: Promise<Sokeparametre> }) {
  const [parametre, katalog] = await Promise.all([searchParams, hentKatalog()])
  const grunnlag = katalog.produkter.filter(erPaTilbud)
  const liste = byggListe(katalog, grunnlag, parametre, barnAv(katalog).get(null) ?? [])
  return (
    <Produktliste
      basis="/tilbud"
      tittel="Tilbud"
      ingress="Varer som er satt ned i nettbutikken akkurat nå."
      smuler={[{ navn: 'Tilbud' }]}
      {...liste}
    />
  )
}
