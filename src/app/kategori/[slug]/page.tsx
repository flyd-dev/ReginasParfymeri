import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Produktliste } from '@/components/liste/Produktliste'
import { NISJE } from '@/innhold/butikk'
import { hentKatalog } from '@/lib/katalog/kilde'
import { barnAv, finnKategori, kategoristi, produkterI, type Sokeparametre } from '@/lib/katalog/sporring'
import { byggListe } from '@/lib/liste'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Sokeparametre> }

const INGRESS: Record<string, string> = {
  nisjeduft: NISJE.tekst,
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const katalog = await hentKatalog()
  const kategori = finnKategori(katalog, slug)
  if (!kategori) return { title: 'Fant ikke kategorien' }
  return {
    title: kategori.navn,
    description: `${kategori.navn} fra Regina Parfymeri i Haugesund – ${produkterI(katalog, kategori.id).length} produkter i nettbutikken.`,
  }
}

export default async function Kategoriside({ params, searchParams }: Props) {
  const [{ slug }, parametre, katalog] = await Promise.all([params, searchParams, hentKatalog()])
  const kategori = finnKategori(katalog, slug)
  if (!kategori) notFound()
  const grunnlag = produkterI(katalog, kategori.id)
  if (grunnlag.length === 0) notFound()

  const sti = kategoristi(katalog, kategori)
  const barn = (barnAv(katalog).get(kategori.id) ?? []).filter((b) => produkterI(katalog, b.id).length > 0)
  // Snarveier: underkategoriene – eller søsknene når vi står i en bladkategori.
  const forelder = kategori.forelder
  const sosken =
    forelder !== null
      ? (barnAv(katalog).get(forelder) ?? []).filter((b) => produkterI(katalog, b.id).length > 0)
      : []
  const snarveier = (barn.length > 0 ? barn : sosken)
    .map((b) => ({
      navn: b.navn,
      href: `/kategori/${b.slug}`,
      antall: produkterI(katalog, b.id).length,
      aktiv: b.id === kategori.id,
    }))
    .sort((a, b) => b.antall - a.antall)

  const liste = byggListe(katalog, grunnlag, parametre, barn)
  const overordnet = sti.length > 1 ? sti[sti.length - 2] : undefined

  return (
    <Produktliste
      basis={`/kategori/${kategori.slug}`}
      kicker={overordnet?.navn}
      tittel={kategori.navn}
      ingress={INGRESS[kategori.slug]}
      smuler={sti.map((k) => ({ navn: k.navn, href: `/kategori/${k.slug}` }))}
      snarveier={snarveier}
      kategoritittel="Type"
      {...liste}
    />
  )
}
