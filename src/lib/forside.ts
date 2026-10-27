// Henter forsidens redaksjonelle valg fra katalogen, med fallback til WooCommerces popularitet.

import { NISJE } from '@/content/butikk'
import { FORSIDE } from '@/content/forside'
import { fraKroner, kroner } from '@/lib/format'
import { bestselgere, finnKategori, nyeste, produkterIKategori } from '@/lib/katalog/sporring'
import { lagMeny } from '@/lib/meny'
import type { Katalog, Merke, Produkt } from '@/lib/woocommerce/typer'

/** Det klienten trenger for å vise et produkt – ikke hele produktobjektet. */
export interface Visningsprodukt {
  slug: string
  merke: string | null
  navn: string
  bilde: string | null
  alt: string
  pris: string
  /** Første avsnitt av beskrivelsen, kuttet ved setningsslutt. Tom når beskrivelsen mangler. */
  utdrag: string
}

export function utdrag(tekst: string, maks = 260): string {
  const forste =
    tekst
      .split(/\n{2,}/)[0]
      ?.replace(/\s+/g, ' ')
      .trim() ?? ''
  if (forste.length <= maks) return forste
  const kutt = forste.slice(0, maks)
  const slutt = Math.max(kutt.lastIndexOf('. '), kutt.lastIndexOf('! '), kutt.lastIndexOf('? '))
  return slutt > maks * 0.5 ? kutt.slice(0, slutt + 1) : `${kutt.replace(/\s+\S*$/, '')} …`
}

export function tilVisning(p: Produkt): Visningsprodukt {
  return {
    slug: p.slug,
    merke: p.merke?.navn ?? null,
    navn: p.visningsnavn,
    bilde: p.bilder[0]?.src ?? null,
    alt: p.bilder[0]?.alt ?? p.visningsnavn,
    pris: p.prisspenn ? fraKroner(p.prisspenn.fra) : kroner(p.pris.pris),
    utdrag: utdrag(p.beskrivelse),
  }
}

function kjopbar(k: Katalog, slug: string): Produkt | undefined {
  return k.produkter.find((p) => p.slug === slug && p.kjopbar)
}

export function heroprodukt(k: Katalog): Produkt | null {
  return kjopbar(k, FORSIDE.hero) ?? bestselgere(produkterIKategori(k, ['duft', 'nisjeduft']), 1)[0] ?? null
}

export function utstilling(k: Katalog): Produkt[] {
  const valgt = FORSIDE.utstilling.map((s) => kjopbar(k, s)).filter((p): p is Produkt => Boolean(p))
  if (valgt.length >= 3) return valgt
  return bestselgere(produkterIKategori(k, ['duft', 'nisjeduft']), 5)
}

export function innganger(
  k: Katalog,
): { navn: string; sti: string[]; antall: number; produkt: Produkt | null }[] {
  return FORSIDE.innganger
    .map((i) => {
      const kategori = finnKategori(k, [...i.sti])
      if (!kategori) return null
      const produkt = kjopbar(k, i.produkt) ?? bestselgere(produkterIKategori(k, [...i.sti]), 1)[0] ?? null
      return { navn: kategori.navn, sti: kategori.sti, antall: kategori.antall, produkt }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
}

/** Nyeste kjøpbare i nisjeduft; fyller på med nyeste i duft hvis det er for få. */
export function nyttINisjeduft(k: Katalog, antall = 10): Produkt[] {
  const nisje = nyeste({ ...k, produkter: produkterIKategori(k, ['duft', 'nisjeduft']) }, antall)
  if (nisje.length >= antall) return nisje
  const duft = nyeste({ ...k, produkter: produkterIKategori(k, ['duft']) }, antall * 2)
  return [...nisje, ...duft.filter((p) => !nisje.includes(p))].slice(0, antall)
}

export interface Nisjemerke {
  navn: string
  slug: string
  antall: number
  /** Merkets mest solgte vare på lager (WooCommerces popularitet). */
  produkt: Visningsprodukt | null
}

/** Nisjemerkene Regina selv nevner (src/content/butikk.ts), slått opp i katalogen. Ukjente merker hoppes over. */
export function nisjemerker(k: Katalog): Nisjemerke[] {
  return NISJE.merker
    .map((navn) => {
      const forste = navn.toLocaleLowerCase('nb').split(' ')[0] ?? ''
      const merke = k.merker.find((m) => m.navn.toLocaleLowerCase('nb').startsWith(forste))
      if (!merke) return null
      const produkt = bestselgere(
        k.produkter.filter((p) => p.merke?.slug === merke.slug),
        1,
      )[0]
      return {
        navn: merke.navn,
        slug: merke.slug,
        antall: merke.antall,
        produkt: produkt ? tilVisning(produkt) : null,
      }
    })
    .filter((m): m is Nisjemerke => m !== null)
}

/** Hovedkategorier som ikke har egen flis, til lenkeraden under rutenettet. */
export function ovrigeKategorier(k: Katalog): { navn: string; sti: string[]; antall: number }[] {
  const brukt = new Set<string>(FORSIDE.innganger.filter((i) => i.sti.length === 1).map((i) => i.sti[0]))
  return lagMeny(k)
    .filter((m) => !brukt.has(m.sti[0] ?? ''))
    .map(({ navn, sti, antall }) => ({ navn, sti, antall }))
}

/** Antall nisjedufter i katalogen – WooCommerces egen telling for kategorien – til faktaraden i heroen. */
export function antallNisjedufter(k: Katalog): number | null {
  const antall = finnKategori(k, ['duft', 'nisjeduft'])?.antall
  return antall && antall > 0 ? antall : null
}

/**
 * Merkene i merkebåndet: de største (flest produkter i WooCommerce) i første rad, de neste i andre rad. Ingen
 * merke står i begge.
 */
export function baandmerker(k: Katalog, perRad = 16): [Merke[], Merke[]] {
  const sortert = [...k.merker].sort((a, b) => b.antall - a.antall || a.navn.localeCompare(b.navn, 'nb'))
  return [sortert.slice(0, perRad), sortert.slice(perRad, perRad * 2)]
}
