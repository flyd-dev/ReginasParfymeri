// Små, serialiserbare utdrag av katalogen til klientkomponenter. Klienten får aldri hele katalogen.

import type { NyLinje } from './handlekurv/kurv'
import { hurtigkjop, lagLinje } from './handlekurv/kurv'
import type { Bilde, Katalog, Lagerstatus, Ore, Produkt } from './katalog/typer'
import { MENY } from '@/innhold/forside'
import { erPaTilbud, finnKategori, kategoritre, produkterI, type Kategorinode } from './katalog/sporring'

export interface Kortdata {
  id: number
  slug: string
  merke: string | null
  navn: string
  pris: Ore
  /** Ordinær pris – bare når varen faktisk er på tilbud. */
  forPris: Ore | null
  fra: boolean
  lager: Lagerstatus
  lagerTekst: string
  bilde: Bilde | null
  bilde2: Bilde | null
  variantinfo: string | null
  /** Ferdig kurvlinje når raskt kjøp er entydig (se `hurtigkjop`), ellers null. */
  hurtig: NyLinje | null
}

function variantinfo(p: Produkt): string | null {
  if (p.type !== 'variabel' || p.varianter.length < 2) return null
  const navn = p.egenskaper[0]?.navn.toLocaleLowerCase('nb-NO')
  const n = p.varianter.length
  if (navn === 'størrelse') return `${n} størrelser`
  if (navn === 'farge') return `${n} farger`
  return `${n} varianter`
}

export function tilKort(p: Produkt): Kortdata {
  const hurtig = hurtigkjop(p)
  const tilbud = erPaTilbud(p) && p.varianter.length === 0
  return {
    id: p.id,
    slug: p.slug,
    merke: p.merke?.navn ?? null,
    navn: p.visningsnavn,
    pris: p.pris.pris,
    forPris: tilbud ? p.pris.ordinaer : null,
    fra: p.prisspenn !== null,
    lager: p.lager.status,
    lagerTekst: p.lager.tekst,
    bilde: p.bilder[0] ?? null,
    bilde2: p.bilder[1] ?? null,
    variantinfo: variantinfo(p),
    hurtig: hurtig ? lagLinje(p, hurtig.variantId) : null,
  }
}

// ---------- Meny ----------

export interface Menylenke {
  navn: string
  href: string
  antall: number
}

export interface Menygruppe extends Menylenke {
  barn: Menylenke[]
}

export interface Menypost {
  id: string
  etikett: string
  href: string
  antall: number
  grupper: Menygruppe[]
  merker: Menylenke[]
}

export interface Menydata {
  poster: Menypost[]
  merker: Menylenke[]
  tilbud: number
  antallProdukter: number
}

const lenke = (n: Kategorinode): Menylenke => ({
  navn: n.navn,
  href: `/kategori/${n.slug}`,
  antall: n.totalt,
})

export function byggMeny(k: Katalog): Menydata {
  const tre = kategoritre(k)
  const poster: Menypost[] = MENY.map((m) => {
    const rot = m.kategorier
      .map((slug) => tre.find((n) => n.slug === slug))
      .filter((n): n is Kategorinode => Boolean(n))
    const grupper: Menygruppe[] = []
    for (const r of rot) {
      // Når flere toppkategorier deles i én post, blir den andre én egen gruppe.
      if (rot.length > 1 && r !== rot[0]) {
        grupper.push({ ...lenke(r), barn: r.barn.map(lenke) })
        continue
      }
      for (const b of r.barn) grupper.push({ ...lenke(b), barn: b.barn.map(lenke) })
    }
    const produkter = rot.flatMap((r) => produkterI(k, r.id))
    const merketall = new Map<string, Menylenke>()
    for (const p of produkter) {
      if (!p.merke) continue
      const e = merketall.get(p.merke.slug) ?? {
        navn: p.merke.navn,
        href: `/merker/${p.merke.slug}`,
        antall: 0,
      }
      e.antall++
      merketall.set(p.merke.slug, e)
    }
    const forste = rot[0]
    return {
      id: m.id,
      etikett: m.etikett,
      href: forste ? `/kategori/${forste.slug}` : '/',
      antall: new Set(produkter.map((p) => p.id)).size,
      grupper,
      merker: [...merketall.values()].sort((a, b) => b.antall - a.antall).slice(0, 10),
    }
  })
  return {
    poster,
    merker: k.merker
      .filter((m) => m.antall > 0)
      .map((m) => ({ navn: m.navn, href: `/merker/${m.slug}`, antall: m.antall })),
    tilbud: k.produkter.filter(erPaTilbud).length,
    antallProdukter: k.produkter.length,
  }
}

export function kategoriHref(k: Katalog, slug: string): string | null {
  return finnKategori(k, slug) ? `/kategori/${slug}` : null
}
