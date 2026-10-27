import { Phone, Store } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Brodsmuler } from '@/components/layout/brodsmuler'
import { Produktdetaljer } from '@/components/produkt/detaljer'
import { Galleri } from '@/components/produkt/galleri'
import { Kjopsboks } from '@/components/produkt/kjopsboks'
import { Produktkort, Produktrutenett } from '@/components/produkt/produktkort'
import { Button } from '@/components/ui/button'
import { AVKLARES, BUTIKK, FORDELER, KUN_I_BUTIKKEN, KUN_I_BUTIKKEN_TEKST } from '@/content/butikk'
import { kategorikjede, relaterte } from '@/lib/katalog/sporring'
import { kategoriUrl, merkeUrl, produktUrl } from '@/lib/lenker'
import { produktJsonLd, somScript } from '@/lib/seo/jsonld'
import { naa } from '@/lib/tid'
import { hentKatalog } from '@/lib/woocommerce'
import type { Produkt } from '@/lib/woocommerce/typer'

export const revalidate = 3600

type Props = PageProps<'/produkt/[slug]'>

async function finn(slug: string) {
  const katalog = await hentKatalog()
  return { katalog, produkt: katalog.produkter.find((p) => p.slug === decodeURIComponent(slug)) }
}

export async function generateStaticParams() {
  return (await hentKatalog()).produkter.map((p) => ({ slug: p.slug }))
}

function kortTekst(p: Produkt): string {
  const tekst = (p.kortBeskrivelse || p.beskrivelse).replace(/\s+/g, ' ').trim()
  if (tekst) return tekst.length > 155 ? `${tekst.slice(0, 152).replace(/\s+\S*$/, '')} …` : tekst
  return `${[p.merke?.navn, p.visningsnavn].filter(Boolean).join(' ')} hos Regina Parfymeri i Haugesund.`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { produkt: p } = await finn((await params).slug)
  if (!p) return {}
  const navn = [p.merke?.navn, p.visningsnavn].filter(Boolean).join(' – ')
  return {
    title: navn,
    description: kortTekst(p),
    alternates: { canonical: produktUrl(p.slug) },
    openGraph: {
      title: navn,
      description: kortTekst(p),
      images: p.bilder.slice(0, 1).map((b) => ({ url: b.src, alt: b.alt })),
    },
  }
}

export default async function Produktside({ params }: Props) {
  const { katalog, produkt: p } = await finn((await params).slug)
  if (!p) notFound()
  const kjede = p.hovedkategori ? kategorikjede(katalog, p.hovedkategori.sti) : []
  const kunIButikk =
    KUN_I_BUTIKKEN.some((m) => m.slug === p.merke?.slug) && !AVKLARES.some((a) => a.merke === p.merke?.slug)
  const mer = relaterte(katalog, p, 4)
  const tidspunkt = naa()

  return (
    <div className="mx-auto max-w-screen-2xl px-4 pt-6 pb-10 md:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: somScript(produktJsonLd(p)) }} />
      <Brodsmuler
        smuler={[...kjede.map((k) => ({ navn: k.navn, href: kategoriUrl(k.sti) })), { navn: p.visningsnavn }]}
      />
      <div className="mt-6 grid gap-8 md:grid-cols-[1.2fr_1fr] md:gap-12 lg:gap-20">
        <Galleri bilder={p.bilder} navn={[p.merke?.navn, p.visningsnavn].filter(Boolean).join(' ')} />
        <div className="md:sticky md:top-32 md:self-start">
          {p.merke && (
            <Link
              href={merkeUrl(p.merke.slug)}
              className="text-sm tracking-[0.16em] text-sand-ink uppercase hover:text-regina-pink-strong"
            >
              {p.merke.navn}
            </Link>
          )}
          <h1 className="mt-2 text-3xl md:text-4xl lg:text-5xl">{p.visningsnavn}</h1>
          <div className="mt-6">
            {kunIButikk ? (
              <div className="border border-sand-200 bg-paper p-5">
                <p className="flex items-center gap-2 font-medium">
                  <Store className="size-4" aria-hidden /> Kun i butikken
                </p>
                <p className="mt-2 text-sm text-sand-ink">{KUN_I_BUTIKKEN_TEKST}</p>
                <Button asChild variant="outline" className="mt-4">
                  <a href={BUTIKK.telefon.lenke}>
                    <Phone aria-hidden /> Ring {BUTIKK.telefon.visning}
                  </a>
                </Button>
              </div>
            ) : (
              <Kjopsboks produkt={p} />
            )}
          </div>
          <ul className="mt-8 space-y-1.5 text-sm text-sand-ink">
            {FORDELER.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-20 md:mt-28">
        <Produktdetaljer produkt={p} kunIButikk={kunIButikk} />
      </div>

      {mer.length > 0 && (
        <section className="mt-24" aria-labelledby="mer-tittel">
          <h2 id="mer-tittel" className="mb-8 text-3xl md:text-4xl">
            Mer fra {p.merke ? p.merke.navn : (p.hovedkategori?.navn ?? 'samme kategori')}
          </h2>
          <Produktrutenett>
            {mer.map((q) => (
              <Produktkort key={q.id} produkt={q} naa={tidspunkt} />
            ))}
          </Produktrutenett>
        </section>
      )}
    </div>
  )
}
