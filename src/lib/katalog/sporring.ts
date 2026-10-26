// Spørringer mot katalogen: kategoritre, filtrering, sortering, søk og fasetter.
// Rene funksjoner – samme logikk uansett om katalogen er utdrag eller live.

import type { Katalog, Kategori, Ore, Produkt } from './typer'
import { sokbar } from './tekst'

// ---------- Kategorier ----------

export interface Kategorinode extends Kategori {
  barn: Kategorinode[]
  /** Antall produkter i katalogen i kategorien eller en underkategori. */
  totalt: number
}

export function barnAv(k: Katalog): Map<number | null, Kategori[]> {
  const barn = new Map<number | null, Kategori[]>()
  for (const kat of k.kategorier) {
    const liste = barn.get(kat.forelder) ?? []
    liste.push(kat)
    barn.set(kat.forelder, liste)
  }
  return barn
}

export function etterkommere(k: Katalog, id: number): Set<number> {
  const barn = barnAv(k)
  const ut = new Set<number>([id])
  const ko = [id]
  while (ko.length > 0) {
    const neste = ko.pop() as number
    for (const b of barn.get(neste) ?? []) {
      if (!ut.has(b.id)) {
        ut.add(b.id)
        ko.push(b.id)
      }
    }
  }
  return ut
}

export function produkterI(k: Katalog, kategoriId: number): Produkt[] {
  const ider = etterkommere(k, kategoriId)
  return k.produkter.filter((p) => p.kategorier.some((c) => ider.has(c)))
}

export function kategoritre(k: Katalog): Kategorinode[] {
  const barn = barnAv(k)
  const bygg = (kat: Kategori): Kategorinode => {
    const noder = (barn.get(kat.id) ?? []).map(bygg).filter((n) => n.totalt > 0)
    noder.sort((a, b) => b.totalt - a.totalt || a.navn.localeCompare(b.navn, 'nb'))
    return { ...kat, barn: noder, totalt: produkterI(k, kat.id).length }
  }
  return (barn.get(null) ?? []).map(bygg).filter((n) => n.totalt > 0)
}

export function finnKategori(k: Katalog, slug: string): Kategori | undefined {
  return k.kategorier.find((c) => c.slug === slug)
}

/** Fra øverste nivå ned til og med kategorien. */
export function kategoristi(k: Katalog, kategori: Kategori): Kategori[] {
  const sti: Kategori[] = [kategori]
  const etterId = new Map(k.kategorier.map((c) => [c.id, c]))
  let gjeldende = kategori
  for (let i = 0; i < 10 && gjeldende.forelder !== null; i++) {
    const forelder = etterId.get(gjeldende.forelder)
    if (!forelder) break
    sti.unshift(forelder)
    gjeldende = forelder
  }
  return sti
}

/** Den mest presise kategorien et produkt ligger i – til brødsmuler. */
export function hovedkategori(k: Katalog, produkt: Produkt): Kategori | undefined {
  const etterId = new Map(k.kategorier.map((c) => [c.id, c]))
  const kandidater = produkt.kategorier.map((id) => etterId.get(id)).filter((c): c is Kategori => Boolean(c))
  return kandidater.sort((a, b) => kategoristi(k, b).length - kategoristi(k, a).length)[0]
}

// ---------- Filtre ----------

export const PRISINTERVALLER = [
  { id: 'under-300', navn: 'Under 300 kr', fra: 0, til: 30000 },
  { id: '300-1000', navn: '300–1000 kr', fra: 30000, til: 100000 },
  { id: '1000-2000', navn: '1000–2000 kr', fra: 100000, til: 200000 },
  { id: 'over-2000', navn: 'Over 2000 kr', fra: 200000, til: Number.POSITIVE_INFINITY },
] as const

export type Sortering = 'nyeste' | 'pris-stigende' | 'pris-synkende' | 'navn'

export const SORTERINGER: { id: Sortering; navn: string }[] = [
  { id: 'nyeste', navn: 'Nyest i nettbutikken' },
  { id: 'pris-stigende', navn: 'Pris: lav til høy' },
  { id: 'pris-synkende', navn: 'Pris: høy til lav' },
  { id: 'navn', navn: 'Navn: A–Å' },
]

export interface Filtre {
  kategori: string[]
  merke: string[]
  pris: string[]
  lager: boolean
  tilbud: boolean
  note: string | null
}

export const TOMME_FILTRE: Filtre = {
  kategori: [],
  merke: [],
  pris: [],
  lager: false,
  tilbud: false,
  note: null,
}

export type Sokeparametre = Record<string, string | string[] | undefined>

function liste(verdi: string | string[] | undefined): string[] {
  if (verdi === undefined) return []
  return (Array.isArray(verdi) ? verdi : verdi.split(','))
    .map((v) => v.trim())
    .filter((v) => /^[\p{L}\p{N}-]{1,80}$/u.test(v))
}

export function lesFiltre(
  p: Sokeparametre,
  standard: Sortering | 'relevans' = 'nyeste',
): { filtre: Filtre; sortering: Sortering | 'relevans'; side: number } {
  const sortering = SORTERINGER.some((s) => s.id === p.sorter) ? (p.sorter as Sortering) : standard
  const side = Math.min(Math.max(Number.parseInt(String(p.side ?? '1'), 10) || 1, 1), 100)
  const note = typeof p.note === 'string' && /^[\p{L} -]{2,40}$/u.test(p.note) ? p.note : null
  return {
    filtre: {
      kategori: liste(p.kategori),
      merke: liste(p.merke),
      pris: liste(p.pris).filter((id) => PRISINTERVALLER.some((i) => i.id === id)),
      lager: p.lager === '1',
      tilbud: p.tilbud === '1',
      note,
    },
    sortering,
    side,
  }
}

export function antallAktive(f: Filtre): number {
  return (
    f.kategori.length +
    f.merke.length +
    f.pris.length +
    (f.lager ? 1 : 0) +
    (f.tilbud ? 1 : 0) +
    (f.note ? 1 : 0)
  )
}

function iPrisintervall(pris: Ore, ider: string[]): boolean {
  if (ider.length === 0) return true
  return PRISINTERVALLER.some((i) => ider.includes(i.id) && pris >= i.fra && pris < i.til)
}

export function harNote(p: Produkt, note: string): boolean {
  if (!p.duftnoter) return false
  const nokkel = sokbar(note)
  return [...p.duftnoter.topp, ...p.duftnoter.hjerte, ...p.duftnoter.bunn].some((n) =>
    sokbar(n)
      .split(' ')
      .some((ord) => ord.startsWith(nokkel)),
  )
}

type Fasett = 'kategori' | 'merke' | 'pris' | 'lager' | 'tilbud' | 'note'

function passer(p: Produkt, f: Filtre, k: Katalog, unntatt?: Fasett): boolean {
  if (unntatt !== 'kategori' && f.kategori.length > 0) {
    const ider = new Set<number>()
    for (const slug of f.kategori) {
      const kat = finnKategori(k, slug)
      if (kat) for (const id of etterkommere(k, kat.id)) ider.add(id)
    }
    if (!p.kategorier.some((id) => ider.has(id))) return false
  }
  if (unntatt !== 'merke' && f.merke.length > 0 && !(p.merke && f.merke.includes(p.merke.slug))) return false
  if (unntatt !== 'pris' && !iPrisintervall(p.pris.pris, f.pris)) return false
  if (unntatt !== 'lager' && f.lager && p.lager.status === 'utsolgt') return false
  if (unntatt !== 'tilbud' && f.tilbud && !erPaTilbud(p)) return false
  if (unntatt !== 'note' && f.note && !harNote(p, f.note)) return false
  return true
}

export function erPaTilbud(p: Produkt): boolean {
  return p.pris.tilbud || p.varianter.some((v) => v.pris.tilbud)
}

export function filtrer(produkter: Produkt[], f: Filtre, k: Katalog): Produkt[] {
  return produkter.filter((p) => passer(p, f, k))
}

export function sorter(produkter: Produkt[], s: Sortering): Produkt[] {
  const kopi = [...produkter]
  const tilgjengelig = (p: Produkt) => (p.lager.status === 'utsolgt' ? 1 : 0)
  switch (s) {
    case 'pris-stigende':
      return kopi.sort((a, b) => a.pris.pris - b.pris.pris || a.rekkefolge - b.rekkefolge)
    case 'pris-synkende':
      return kopi.sort((a, b) => b.pris.pris - a.pris.pris || a.rekkefolge - b.rekkefolge)
    case 'navn':
      return kopi.sort(
        (a, b) =>
          (a.merke?.navn ?? '').localeCompare(b.merke?.navn ?? '', 'nb') ||
          a.visningsnavn.localeCompare(b.visningsnavn, 'nb'),
      )
    default:
      // Utsolgte varer sist, ellers butikkens rekkefølge (nyeste først).
      return kopi.sort((a, b) => tilgjengelig(a) - tilgjengelig(b) || a.rekkefolge - b.rekkefolge)
  }
}

export interface Fasettverdi {
  id: string
  navn: string
  antall: number
  valgt: boolean
}

export interface Fasetter {
  kategori: Fasettverdi[]
  merke: Fasettverdi[]
  pris: Fasettverdi[]
  lager: number
  tilbud: number
}

/**
 * Antall treff per filterverdi, regnet med de andre aktive filtrene (vanlig fasettering).
 * `underkategorier` er kategoriene det gir mening å filtrere på i konteksten.
 */
export function fasetter(base: Produkt[], f: Filtre, k: Katalog, underkategorier: Kategori[]): Fasetter {
  const kategori = underkategorier
    .map((kat) => {
      const ider = etterkommere(k, kat.id)
      const antall = base.filter(
        (p) => passer(p, f, k, 'kategori') && p.kategorier.some((id) => ider.has(id)),
      ).length
      return { id: kat.slug, navn: kat.navn, antall, valgt: f.kategori.includes(kat.slug) }
    })
    .filter((v) => v.antall > 0 || v.valgt)

  const merkeTall = new Map<string, { navn: string; antall: number }>()
  for (const p of base) {
    if (!p.merke || !passer(p, f, k, 'merke')) continue
    const m = merkeTall.get(p.merke.slug) ?? { navn: p.merke.navn, antall: 0 }
    m.antall++
    merkeTall.set(p.merke.slug, m)
  }
  for (const slug of f.merke) {
    if (!merkeTall.has(slug)) {
      const m = k.merker.find((x) => x.slug === slug)
      if (m) merkeTall.set(slug, { navn: m.navn, antall: 0 })
    }
  }
  const merke = [...merkeTall.entries()]
    .map(([id, m]) => ({ id, navn: m.navn, antall: m.antall, valgt: f.merke.includes(id) }))
    .sort((a, b) => a.navn.localeCompare(b.navn, 'nb'))

  const pris = PRISINTERVALLER.map((i) => ({
    id: i.id,
    navn: i.navn,
    antall: base.filter((p) => passer(p, f, k, 'pris') && p.pris.pris >= i.fra && p.pris.pris < i.til).length,
    valgt: f.pris.includes(i.id),
  })).filter((v) => v.antall > 0 || v.valgt)

  return {
    kategori,
    merke,
    pris,
    lager: base.filter((p) => passer(p, f, k, 'lager') && p.lager.status !== 'utsolgt').length,
    tilbud: base.filter((p) => passer(p, f, k, 'tilbud') && erPaTilbud(p)).length,
  }
}

export const PER_SIDE = 24

export function side<T>(liste: T[], nr: number, perSide = PER_SIDE): { elementer: T[]; flere: boolean } {
  const slutt = nr * perSide
  return { elementer: liste.slice(0, slutt), flere: liste.length > slutt }
}

// ---------- Søk ----------

const SYNONYMER: Record<string, string[]> = {
  parfyme: ['parfum', 'parfyme', 'duft', 'edp', 'edt', 'eau', 'extrait', 'cologne'],
  parfymer: ['parfum', 'parfyme', 'duft', 'edp', 'edt', 'eau', 'extrait', 'cologne'],
  parfum: ['parfum', 'parfyme', 'duft', 'edp', 'edt', 'eau', 'extrait'],
  herre: ['herre', 'men', 'homme', 'him'],
  dame: ['dame', 'women', 'femme', 'her'],
  sjampo: ['shampoo', 'sjampo'],
  leppestift: ['leppestift', 'lipstick', 'lip'],
  krem: ['krem', 'cream', 'creme'],
}

export interface Sokeindeks {
  produkt: Produkt
  merke: string
  navn: string
  kategorier: string
  sku: string
  /** Oppgitte duftnoter. */
  noter: string
  /** Beskrivelsen – lav vekt, så «vanilje» også finner dufter som bare nevner det i teksten. */
  tekst: string
}

export function lagSokeindeks(k: Katalog): Sokeindeks[] {
  const etterId = new Map(k.kategorier.map((c) => [c.id, c]))
  // Med overordnede kategorier, så «duft» også finner det som ligger i «Nisjeduft».
  const navnMedForfedre = (id: number): string[] => {
    const kat = etterId.get(id)
    return kat ? kategoristi(k, kat).map((c) => c.navn) : []
  }
  return k.produkter.map((p) => ({
    produkt: p,
    merke: sokbar(p.merke?.navn ?? ''),
    navn: sokbar(`${p.navn} ${p.visningsnavn}`),
    kategorier: sokbar([...new Set(p.kategorier.flatMap(navnMedForfedre))].join(' ')),
    sku: sokbar(p.sku),
    noter: sokbar(
      p.duftnoter ? [...p.duftnoter.topp, ...p.duftnoter.hjerte, ...p.duftnoter.bunn].join(' ') : '',
    ),
    tekst: sokbar(
      p.beskrivelse
        .map((b) => (b.type === 'liste' ? b.punkter.join(' ') : b.tekst))
        .join(' ')
        .slice(0, 4000),
    ),
  }))
}

function ordStarter(tekst: string, ledd: string): boolean {
  return tekst.startsWith(ledd) || tekst.includes(` ${ledd}`)
}

export function sok(indeks: Sokeindeks[], sporsmal: string): Produkt[] {
  const ledd = sokbar(sporsmal)
    .split(' ')
    .filter((l) => l.length > 0)
  if (ledd.length === 0) return []
  const treff: { produkt: Produkt; poeng: number }[] = []
  for (const rad of indeks) {
    let poeng = 0
    let alle = true
    for (const l of ledd) {
      const varianter = SYNONYMER[l] ?? [l]
      let best = 0
      for (const v of varianter) {
        if (rad.sku === v) best = Math.max(best, 8)
        if (rad.merke === v) best = Math.max(best, 6)
        else if (ordStarter(rad.merke, v)) best = Math.max(best, 5)
        if (ordStarter(rad.navn, v)) best = Math.max(best, 3)
        else if (v.length >= 3 && rad.navn.includes(v)) best = Math.max(best, 2)
        if (ordStarter(rad.kategorier, v) || (v.length >= 4 && rad.kategorier.includes(v)))
          best = Math.max(best, 1)
        if (v.length >= 3 && ordStarter(rad.noter, v)) best = Math.max(best, 2)
        if (v.length >= 4 && ordStarter(rad.tekst, v)) best = Math.max(best, 1)
      }
      if (best === 0) {
        alle = false
        break
      }
      poeng += best
    }
    if (alle) {
      // Varer på lager først ved likt treff.
      treff.push({
        produkt: rad.produkt,
        poeng: poeng * 2 + (rad.produkt.lager.status === 'utsolgt' ? 0 : 1),
      })
    }
  }
  return treff
    .sort((a, b) => b.poeng - a.poeng || a.produkt.rekkefolge - b.produkt.rekkefolge)
    .map((t) => t.produkt)
}

// ---------- Duftnoter ----------

/** Noter vi samler dufter under på forsiden. Treff telles i oppgitte noter – aldri gjettet. */
export const KJENTE_NOTER = [
  'Vanilje',
  'Rose',
  'Oud',
  'Sandeltre',
  'Bergamott',
  'Patchouli',
  'Tonkabønne',
  'Jasmin',
  'Iris',
  'Vetiver',
  'Sedertre',
  'Ambra',
  'Mosk',
  'Røkelse',
  'Lær',
  'Kardemomme',
  'Pepper',
  'Mandarin',
  'Sitron',
  'Ingefær',
] as const

export function noteoversikt(k: Katalog, minst = 3): { note: string; antall: number }[] {
  return KJENTE_NOTER.map((note) => ({ note, antall: k.produkter.filter((p) => harNote(p, note)).length }))
    .filter((n) => n.antall >= minst)
    .sort((a, b) => b.antall - a.antall)
}
