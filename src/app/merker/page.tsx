import { Phone } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { AvdekkTekst } from '@/components/bevegelse/avdekk-tekst'
import { Inn } from '@/components/bevegelse/inn'
import { Brodsmuler } from '@/components/layout/brodsmuler'
import { Button } from '@/components/ui/button'
import { BUTIKK, KUN_I_BUTIKKEN, KUN_I_BUTIKKEN_TEKST } from '@/content/butikk'
import { merkeUrl } from '@/lib/lenker'
import { hentKatalog } from '@/lib/woocommerce'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Merker A–Å',
  description:
    'Alle merkene i Regina Parfymeris nettbutikk – nisjedufter, hudpleie og makeup – og merkene du bare finner i butikken i Haugesund.',
  alternates: { canonical: '/merker/' },
}

function forbokstav(navn: string): string {
  const b = navn.trim().charAt(0).toLocaleUpperCase('nb')
  return /[A-ZÆØÅ]/.test(b) ? b : '#'
}

export default async function Merker() {
  const { merker } = await hentKatalog()
  const grupper = new Map<string, typeof merker>()
  for (const m of merker) {
    const b = forbokstav(m.navn)
    grupper.set(b, [...(grupper.get(b) ?? []), m])
  }
  const bokstaver = [...grupper.keys()].sort((a, b) => a.localeCompare(b, 'nb'))

  return (
    <div className="mx-auto max-w-screen-2xl px-4 pt-6 pb-10 md:px-6">
      <Brodsmuler smuler={[{ navn: 'Merker' }]} />
      <header className="mt-8 max-w-3xl">
        <AvdekkTekst som="h1" deler={['Merker A–Å']} className="text-4xl md:text-6xl" />
        <Inn som="p" i={2} className="mt-4 text-lg text-sand-ink">
          {merker.length} merker i nettbutikken.
        </Inn>
      </header>
      <nav
        aria-label="Hopp til bokstav"
        className="sticky top-16 z-10 -mx-4 mt-8 border-y border-sand-200 bg-sand-50 px-4 py-2 transition-transform duration-(--dur-slow) ease-ut lg:top-32 [:root[data-topp-skjult]_&]:-translate-y-16 lg:[:root[data-topp-skjult]_&]:-translate-y-20"
      >
        <ul className="flex flex-wrap gap-1">
          {bokstaver.map((b) => (
            <li key={b}>
              <a
                href={`#bokstav-${b}`}
                className="grid size-10 place-items-center hover:text-regina-pink-strong"
              >
                {b}
              </a>
            </li>
          ))}
          <li>
            <a href="#kun-i-butikken" className="inline-flex h-10 items-center px-3 text-regina-pink-strong">
              Kun i butikken
            </a>
          </li>
        </ul>
      </nav>
      <div className="mt-10 columns-1 gap-12 sm:columns-2 lg:columns-4">
        {/* Bokstavene glir inn etter hverandre når de kommer til syne (data-inn); uten JavaScript står de der. */}
        {bokstaver.map((b, n) => (
          <Inn
            som="section"
            key={b}
            id={`bokstav-${b}`}
            i={n % 4}
            className="mb-10 break-inside-avoid scroll-mt-48"
          >
            <h2 className="font-heading text-4xl text-regina-pink">{b}</h2>
            <ul className="mt-3 space-y-1.5">
              {(grupper.get(b) ?? []).map((m) => (
                <li key={m.slug}>
                  <Link href={merkeUrl(m.slug)} className="hover:text-regina-pink-strong">
                    {m.navn} <span className="text-sm text-sand-ink">({m.antall})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Inn>
        ))}
      </div>

      <Inn
        som="section"
        id="kun-i-butikken"
        className="mt-16 scroll-mt-48 border-t border-sand-200 bg-sand-100 px-6 py-12 md:px-12"
      >
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="text-3xl md:text-4xl">Merker kun i butikken</h2>
            <p className="mt-4 text-sand-ink-deep">{KUN_I_BUTIKKEN_TEKST}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <a href={BUTIKK.telefon.lenke}>
                  <Phone aria-hidden /> Ring {BUTIKK.telefon.visning}
                </a>
              </Button>
              <Button asChild variant="outline">
                <Link href="/kontakt/">Kontakt og veibeskrivelse</Link>
              </Button>
            </div>
          </div>
          <ul className="columns-2 gap-8 md:columns-3">
            {KUN_I_BUTIKKEN.map((m) => (
              <li key={m.slug} className="break-inside-avoid py-1.5">
                <Link href={merkeUrl(m.slug)} className="hover:text-regina-pink-strong">
                  {m.navn}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Inn>
    </div>
  )
}
