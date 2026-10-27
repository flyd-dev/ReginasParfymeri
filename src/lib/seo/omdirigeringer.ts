// 301-omdirigeringer fra adresser i dagens butikk som ikke finnes i samme form i den nye.
// Produkt- og kategoriadressene er de samme (/produkt/<slug>/, /produktkategori/<sti>/) og trenger ingen.
// Brukes av next.config.ts – derfor ingen @/-importer her. Den komplette listen ligger i docs/redirects.csv.

import gamleMerker from '../../../data/legacy_brands.json'

interface Omdirigering {
  source: string
  destination: string
  permanent: boolean
  has?: { type: 'query'; key: string; value?: string }[]
}

interface GammeltMerke {
  slug: string
  new_slug: string | null
}

/** Merker uten produkter på nett som har egen «kun i butikken»-side (se src/content/butikk.ts). */
const MERKESIDER_UTEN_PRODUKTER = new Set([
  'sisley',
  'hermes-paris',
  'boucheron',
  'dolce-gabbana',
  'paco-rabanne',
  'versace',
])

export function merkeomdirigeringer(merker: GammeltMerke[] = gamleMerker): Omdirigering[] {
  return merker
    .filter((m) => m.new_slug !== m.slug && !MERKESIDER_UTEN_PRODUKTER.has(m.slug))
    .map((m) => ({
      source: `/brand/${m.slug}/`,
      destination: m.new_slug ? `/brand/${m.new_slug}/` : '/merker/',
      permanent: true,
    }))
}

export function gamleAdresser(): Omdirigering[] {
  const kasse = process.env.NEXT_PUBLIC_KASSE_URL ?? 'https://nettbutikk.reginaparfymeri.no'
  return [
    // WooCommerce-sider som nå håndteres annerledes
    { source: '/kassen/', destination: '/handlekurv/', permanent: true },
    { source: '/min-konto/', destination: `${kasse}/min-konto/`, permanent: false },
    { source: '/min-konto/:sti*', destination: `${kasse}/min-konto/:sti*`, permanent: false },
    { source: '/testside/', destination: '/', permanent: true },
    // Sidetall i WordPress-stil → ?side=
    {
      source: '/produktkategori/:sti*/page/:nr(\\d+)/',
      destination: '/produktkategori/:sti*/?side=:nr',
      permanent: true,
    },
    { source: '/butikk/page/:nr(\\d+)/', destination: '/butikk/?side=:nr', permanent: true },
    { source: '/brand/:slug/page/:nr(\\d+)/', destination: '/brand/:slug/?side=:nr', permanent: true },
    // WordPress-søk (?s=…&post_type=product) → /sok/
    {
      source: '/',
      has: [{ type: 'query', key: 's', value: '(?<q>.*)' }],
      destination: '/sok/?q=:q',
      permanent: true,
    },
    ...merkeomdirigeringer(),
  ]
}
