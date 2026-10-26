import type { Bilde, Katalog, Ore } from './katalog/typer'
import { harNote, KJENTE_NOTER, lagSokeindeks, produkterI, sok, type Sokeindeks } from './katalog/sporring'
import { sokbar } from './katalog/tekst'

export interface Sokeforslag {
  totalt: number
  produkter: {
    slug: string
    merke: string | null
    navn: string
    pris: Ore
    fra: boolean
    bilde: Bilde | null
  }[]
  kategorier: { navn: string; href: string; antall: number }[]
  merker: { navn: string; href: string; antall: number }[]
  noter: { navn: string; href: string; antall: number }[]
}

const indekser = new WeakMap<Katalog, Sokeindeks[]>()

export function sokeindeks(k: Katalog): Sokeindeks[] {
  let i = indekser.get(k)
  if (!i) {
    i = lagSokeindeks(k)
    indekser.set(k, i)
  }
  return i
}

export function lagSokeforslag(k: Katalog, sporsmal: string, antall = 8): Sokeforslag {
  const treff = sok(sokeindeks(k), sporsmal)
  const q = sokbar(sporsmal)
  const passer = (navn: string) => {
    const n = sokbar(navn)
    return q.length > 1 && (n.startsWith(q) || n.split(' ').some((ord) => ord.startsWith(q)))
  }
  return {
    totalt: treff.length,
    produkter: treff.slice(0, antall).map((p) => ({
      slug: p.slug,
      merke: p.merke?.navn ?? null,
      navn: p.visningsnavn,
      pris: p.pris.pris,
      fra: p.prisspenn !== null,
      bilde: p.bilder[0] ?? null,
    })),
    kategorier: k.kategorier
      .filter((c) => passer(c.navn))
      .map((c) => ({ navn: c.navn, href: `/kategori/${c.slug}`, antall: produkterI(k, c.id).length }))
      .filter((c) => c.antall > 0)
      .slice(0, 5),
    merker: k.merker
      .filter((m) => m.antall > 0 && passer(m.navn))
      .map((m) => ({ navn: m.navn, href: `/merker/${m.slug}`, antall: m.antall }))
      .slice(0, 5),
    noter: KJENTE_NOTER.filter((n) => passer(n))
      .map((n) => ({
        navn: n,
        href: `/kategori/duft?note=${encodeURIComponent(n.toLocaleLowerCase('nb-NO'))}`,
        antall: k.produkter.filter((p) => harNote(p, n)).length,
      }))
      .filter((n) => n.antall > 0),
  }
}
