import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Produktliste } from '@/components/katalog/produktliste'
import { Brodsmuler } from '@/components/layout/brodsmuler'
import { finnKategori, kategorikjede, lesListetilstand, produkterIKategori } from '@/lib/katalog/sporring'
import { kategoriUrl } from '@/lib/lenker'
import { naa } from '@/lib/tid'
import { hentKatalog } from '@/lib/woocommerce'

type Props = PageProps<'/produktkategori/[...sti]'>

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sti } = await params
  const kategori = finnKategori(await hentKatalog(), sti)
  if (!kategori) return {}
  const kjede = sti.length > 1 ? ` – ${kategorikjede(await hentKatalog(), sti)[0]?.navn}` : ''
  return {
    title: `${kategori.navn}${kjede}`,
    description: `${kategori.navn} hos Regina Parfymeri i Haugesund: ${kategori.antall} produkter i nettbutikken. Sendes med Posten, eller hent gratis i butikken i Haraldsgata.`,
    alternates: { canonical: kategoriUrl(kategori.sti) },
  }
}

export default async function Kategoriside({ params, searchParams }: Props) {
  const { sti } = await params
  const katalog = await hentKatalog()
  const kategori = finnKategori(katalog, sti)
  if (!kategori) notFound()
  const kjede = kategorikjede(katalog, sti)
  const tilstand = lesListetilstand(await searchParams)
  const underkategorier = kategori.barn.filter((b) => b.antall > 0)

  return (
    <div className="mx-auto max-w-screen-2xl px-4 pt-6 pb-10 md:px-6">
      <Brodsmuler smuler={kjede.map((k) => ({ navn: k.navn, href: kategoriUrl(k.sti) }))} />
      <header className="mt-8 mb-10 max-w-3xl">
        <h1 className="text-4xl md:text-6xl">{kategori.navn}</h1>
        {underkategorier.length > 0 && (
          <ul className="mt-6 flex gap-2 overflow-x-auto pb-1 md:flex-wrap" aria-label="Underkategorier">
            {underkategorier.map((u) => (
              <li key={u.slug} className="shrink-0">
                <Link
                  href={kategoriUrl(u.sti)}
                  className="inline-flex h-10 items-center border border-sand-200 px-4 text-sm transition-colors duration-(--dur-fast) hover:border-regina-plum"
                >
                  {u.navn}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </header>
      <Produktliste
        katalog={katalog}
        base={produkterIKategori(katalog, sti)}
        tilstand={tilstand}
        basis={kategoriUrl(sti)}
        basisSti={sti}
        underkategorier={underkategorier}
        visKategori={underkategorier.length > 0}
        naa={naa()}
      />
    </div>
  )
}
