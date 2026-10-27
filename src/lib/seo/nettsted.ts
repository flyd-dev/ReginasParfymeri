// Adressen nettstedet kjører på (kanoniske URL-er, sitemap, Open Graph) og om det skal indekseres.
// Til lansering står INDEKSERING av, så staging og forhåndsvisninger ikke konkurrerer med dagens butikk i søk.

export function nettstedUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nettbutikk.reginaparfymeri.no').replace(/\/$/, '')
}

export function skalIndekseres(): boolean {
  return process.env.INDEKSERING === 'pa'
}

export const NETTSTEDNAVN = 'Regina Parfymeri'
