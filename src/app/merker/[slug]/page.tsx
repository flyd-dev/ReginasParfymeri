import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Produktliste } from '@/components/liste/Produktliste'
import { hentKatalog } from '@/lib/katalog/kilde'
import { barnAv, produkterI, type Sokeparametre } from '@/lib/katalog/sporring'
import { byggListe } from '@/lib/liste'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Sokeparametre> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const merke = (await hentKatalog()).merker.find((m) => m.slug === slug)
  if (!merke) return { title: 'Fant ikke merket' }
  return {
    title: merke.navn,
    description: `${merke.navn} hos Regina Parfymeri i Haugesund – ${merke.antall} produkter i nettbutikken.`,
  }
}

export default async function Merkeside({ params, searchParams }: Props) {
  const [{ slug }, parametre, katalog] = await Promise.all([params, searchParams, hentKatalog()])
  const merke = katalog.merker.find((m) => m.slug === slug)
  if (!merke || merke.antall === 0) notFound()
  const grunnlag = katalog.produkter.filter((p) => p.merke?.slug === slug)
  // Filtrer på hovedkategoriene merket faktisk har produkter i.
  const topp = (barnAv(katalog).get(null) ?? []).filter((k) => {
    const ider = new Set(produkterI(katalog, k.id).map((p) => p.id))
    return grunnlag.some((p) => ider.has(p.id))
  })
  const liste = byggListe(katalog, grunnlag, parametre, topp)
  return (
    <Produktliste
      basis={`/merker/${merke.slug}`}
      kicker="Merke"
      tittel={merke.navn}
      smuler={[{ navn: 'Merker', href: '/merker' }, { navn: merke.navn }]}
      kategoritittel="Kategori"
      {...liste}
    />
  )
}
