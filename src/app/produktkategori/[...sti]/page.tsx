// Oppsettet er bygget etter «Ecommerce Category Page» (Mohammad Shehadeh / Hirael, MIT) på 21st.dev – https://21st.dev/@mohammadshehadeh/components/ecommerce-04. Egen kode; ingen kode er kopiert.

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Listehode } from '@/components/katalog/listehode'
import { Produktliste } from '@/components/katalog/produktliste'
import { Brodsmuler } from '@/components/layout/brodsmuler'
import { NISJE } from '@/content/butikk'
import { finnKategori, kategorikjede, lesListetilstand, produkterIKategori } from '@/lib/katalog/sporring'
import { kategoriUrl } from '@/lib/lenker'
import { naa } from '@/lib/tid'
import { hentKatalog } from '@/lib/woocommerce'

type Props = PageProps<'/produktkategori/[...sti]'>

/**
 * Ingress over listen. WooCommerce har ingen kategoribeskrivelser i dag, så bare kategorier der Regina selv har
 * skrevet en tekst (med kilde i src/content/butikk.ts) får ingress. Resten står uten.
 */
const INGRESSER: Record<string, string> = {
  'duft/nisjeduft': NISJE.tekst,
}

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
  const forelder = kjede.at(-2)

  return (
    <div className="mx-auto max-w-screen-2xl px-4 pt-6 pb-10 md:px-6">
      <Brodsmuler smuler={kjede.map((k) => ({ navn: k.navn, href: kategoriUrl(k.sti) }))} />
      <Listehode
        overtittel={forelder?.navn ?? 'Nettbutikken'}
        tittel={kategori.navn}
        ingress={INGRESSER[sti.join('/')]}
      >
        {underkategorier.length > 0 && (
          <ul
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
            aria-label="Underkategorier"
          >
            {underkategorier.map((u) => (
              <li key={u.slug} className="shrink-0">
                <Link
                  href={kategoriUrl(u.sti)}
                  className="inline-flex h-11 items-center gap-2.5 border border-sand-200 bg-paper px-4 transition-colors duration-(--dur-fast) hover:border-regina-plum"
                >
                  {u.navn}
                  <span className="text-sm text-sand-ink tabular-nums">{u.antall}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Listehode>
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
