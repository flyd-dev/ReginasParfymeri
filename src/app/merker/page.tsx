import { Phone } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Inn } from '@/components/bevegelse/inn'
import { Listehode } from '@/components/katalog/listehode'
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
      <Listehode
        overtittel="Nettbutikken"
        tittel="Merker A–Å"
        ingress={`${merker.length} merker i nettbutikken.`}
      />
      {/* Bokstavlinjen er en flytende pille (R-32) som følger med under toppen. På mobil er den én rad som rulles
          sidelengs, så den ikke tar halve skjermen; på stor skjerm brytes den. Fokusrammen står innenfor
          bokstaven, så den ikke klippes i kanten av raden. */}
      <nav
        aria-label="Hopp til bokstav"
        className="sticky top-[4.5rem] z-10 rounded-full border border-sand-200 bg-paper p-1 transition-transform duration-(--dur-slow) ease-ut lg:top-[8.5rem] lg:rounded-2xl [:root[data-topp-skjult]_&]:-translate-y-16 lg:[:root[data-topp-skjult]_&]:-translate-y-20"
      >
        <ul className="flex gap-0.5 overflow-x-auto rounded-full [scrollbar-width:none] lg:flex-wrap lg:overflow-visible lg:rounded-none [&::-webkit-scrollbar]:hidden">
          {bokstaver.map((b) => (
            <li key={b} className="shrink-0">
              <a
                href={`#bokstav-${b}`}
                className="grid size-11 place-items-center rounded-full transition-colors duration-(--dur-fast) hover:bg-regina-pink-50 hover:text-regina-pink-strong focus-visible:outline-offset-[-2px] lg:size-10"
              >
                {b}
              </a>
            </li>
          ))}
          <li className="shrink-0">
            <a
              href="#kun-i-butikken"
              className="inline-flex h-11 items-center rounded-full bg-regina-pink-100 px-4 whitespace-nowrap text-regina-pink-strong transition-colors duration-(--dur-fast) hover:bg-regina-pink-strong hover:text-white focus-visible:outline-offset-[-2px] lg:h-10"
            >
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
        className="mt-16 scroll-mt-48 rounded-3xl bg-regina-pink-50 px-6 py-12 md:px-12 md:py-16"
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
              <Button asChild variant="outline" className="bg-paper">
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
