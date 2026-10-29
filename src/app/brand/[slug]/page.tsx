import { Phone } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AvdekkTekst } from '@/components/bevegelse/avdekk-tekst'
import { Inn } from '@/components/bevegelse/inn'
import { Listehode } from '@/components/katalog/listehode'
import { Produktliste } from '@/components/katalog/produktliste'
import { Brodsmuler } from '@/components/layout/brodsmuler'
import { Button } from '@/components/ui/button'
import { AVKLARES, BUTIKK, KUN_I_BUTIKKEN, KUN_I_BUTIKKEN_TEKST } from '@/content/butikk'
import { finnMerke, lesListetilstand } from '@/lib/katalog/sporring'
import { merkeUrl } from '@/lib/lenker'
import { naa } from '@/lib/tid'
import { hentKatalog } from '@/lib/woocommerce'

type Props = PageProps<'/brand/[slug]'>

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const merke = finnMerke(await hentKatalog(), slug)
  const butikkmerke = KUN_I_BUTIKKEN.find((m) => m.slug === slug)
  if (merke) {
    return {
      title: merke.navn,
      description: `${merke.navn} hos Regina Parfymeri i Haugesund – ${merke.antall} produkter i nettbutikken.`,
      alternates: { canonical: merkeUrl(merke.slug) },
    }
  }
  if (butikkmerke) {
    return {
      title: `${butikkmerke.navn} – kun i butikken`,
      description: `${butikkmerke.navn} finner du i Regina Parfymeris butikk i Haraldsgata 138 i Haugesund.`,
      alternates: { canonical: merkeUrl(butikkmerke.slug) },
    }
  }
  return {}
}

export default async function Merkeside({ params, searchParams }: Props) {
  const { slug } = await params
  const katalog = await hentKatalog()
  const merke = finnMerke(katalog, slug)
  const butikkmerke = KUN_I_BUTIKKEN.find((m) => m.slug === slug)
  if (!merke && !butikkmerke) notFound()

  // Merker som bare selges i butikken: ingen kjøpsknapp, bare kontakt (oppdraget §7.4).
  if (!merke && butikkmerke) {
    return (
      <div className="mx-auto max-w-screen-2xl px-4 pt-6 pb-10 md:px-6">
        <Brodsmuler smuler={[{ navn: 'Merker', href: '/merker/' }, { navn: butikkmerke.navn }]} />
        {/* Samme lys rosa, innfelte boks som hodet over produktlistene (Listehode, R-32). */}
        <div className="mt-6 rounded-3xl bg-regina-pink-50 px-5 py-10 md:mt-8 md:px-10 md:py-14 lg:px-14">
          <div className="max-w-2xl">
            <Inn
              som="p"
              className="flex items-center gap-2.5 text-sm tracking-[0.16em] text-sand-ink-deep uppercase"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-regina-pink" aria-hidden />
              Kun i butikken
            </Inn>
            <AvdekkTekst som="h1" i={1} deler={[butikkmerke.navn]} className="mt-4 text-5xl md:text-7xl" />
            <Inn som="p" i={3} className="mt-6 text-lg">
              {KUN_I_BUTIKKEN_TEKST}
            </Inn>
            <Inn som="address" i={4} className="mt-6 text-sand-ink-deep not-italic">
              {BUTIKK.adresse.gate}, {BUTIKK.adresse.postnr} {BUTIKK.adresse.sted}
            </Inn>
            <Inn i={5} className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href={BUTIKK.telefon.lenke}>
                  <Phone aria-hidden /> Ring {BUTIKK.telefon.visning}
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-paper">
                <Link href="/kontakt/">Kontakt og veibeskrivelse</Link>
              </Button>
            </Inn>
          </div>
        </div>
      </div>
    )
  }

  if (!merke) notFound()
  const avklares = AVKLARES.find((a) => a.merke === merke.slug)
  return (
    <div className="mx-auto max-w-screen-2xl px-4 pt-6 pb-10 md:px-6">
      <Brodsmuler smuler={[{ navn: 'Merker', href: '/merker/' }, { navn: merke.navn }]} />
      <Listehode
        overtittel="Merke"
        tittel={merke.navn}
        ingress={
          butikkmerke || avklares
            ? `Flere produkter fra ${merke.navn} finner du i butikken i Haraldsgata.`
            : undefined
        }
      />
      <Produktliste
        katalog={katalog}
        base={katalog.produkter.filter((p) => p.merke?.slug === merke.slug)}
        tilstand={lesListetilstand(await searchParams)}
        basis={merkeUrl(merke.slug)}
        visMerke={false}
        visKategori={false}
        naa={naa()}
      />
    </div>
  )
}
