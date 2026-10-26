// Bildet til en kategoriinngang: Reginas eget butikkbilde, eller frilagte produkter fra kategorien.
// Brukes av kortene på forsiden og toppen av kategorisidene, så de alltid viser det samme.

import type { Inngangsvisning } from '@/components/forside/Innganger'
import { BILDER } from '@/innhold/bilder'
import { INNGANGER } from '@/innhold/forside'
import type { Katalog, Produkt } from './katalog/typer'

const GODT_BILDE = new Set(['hvit', 'transparent', 'flat'])

/** Produkter som kan stå frilagt på en flate: finnes, er på lager og har gjennomsiktig bakgrunn. */
export function frilagte(katalog: Katalog, slugs: readonly string[]): Produkt[] {
  return slugs.flatMap((slug) => {
    const p = katalog.produkter.find((x) => x.slug === slug)
    return p && p.lager.status !== 'utsolgt' && p.bilder[0]?.bakgrunn === 'transparent' ? [p] : []
  })
}

function representant(produkter: Produkt[]): Produkt | undefined {
  return produkter.find(
    (p) => p.lager.status !== 'utsolgt' && p.bilder[0] && GODT_BILDE.has(p.bilder[0].bakgrunn),
  )
}

export type Inngangsoppsett = (typeof INNGANGER)[number]

export function finnInngang(slug: string): Inngangsoppsett | undefined {
  return INNGANGER.find((i) => i.slug === slug)
}

export function inngangsvisning(katalog: Katalog, i: Inngangsoppsett, produkter: Produkt[]): Inngangsvisning {
  if ('foto' in i) return { type: 'foto', foto: BILDER[i.foto], nokkel: i.foto }
  const bilder = frilagte(katalog, i.flasker).flatMap((p) => (p.bilder[0] ? [p.bilder[0]] : []))
  return bilder.length > 0
    ? { type: 'flasker', bilder, flate: i.flate }
    : { type: 'produkt', bilde: representant(produkter)?.bilder[0] ?? null }
}
