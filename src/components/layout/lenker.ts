// Faste lenker i menyer og bunntekst. Sidene finnes i src/app; adressene følger dagens butikk der de fantes.

export const SEKUNDAERLENKER = [
  { navn: 'Merker A–Å', href: '/merker/' },
  { navn: 'Behandlinger', href: '/behandlinger/' },
  { navn: 'Kundeklubb', href: '/kundeklubb/' },
  { navn: 'Om oss', href: '/om-oss/' },
  { navn: 'Kontakt', href: '/kontakt/' },
] as const

export const KUNDESERVICE = [
  { navn: 'Kontakt oss', href: '/kontakt/' },
  { navn: 'Frakt og levering', href: '/frakt-levering/' },
  { navn: 'Angrerett og retur', href: '/angrerett-og-retur/' },
  { navn: 'Kjøpsvilkår', href: '/betingelser/' },
  { navn: 'Personvern', href: '/personvern/' },
] as const

export const BUTIKKEN = [
  { navn: 'Om oss', href: '/om-oss/' },
  { navn: 'Behandlinger', href: '/behandlinger/' },
  { navn: 'Kundeklubb', href: '/kundeklubb/' },
  { navn: 'Merker A–Å', href: '/merker/' },
  { navn: 'Tilbud', href: '/tilbud/' },
  { navn: 'Nyheter', href: '/nyheter/' },
] as const

export function kasseUrl(): string {
  return process.env.NEXT_PUBLIC_KASSE_URL ?? 'https://nettbutikk.reginaparfymeri.no'
}
