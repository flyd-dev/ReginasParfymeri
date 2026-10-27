// Spørringer mot katalogen: kategorier, filtrering, fasetter, sortering og søk.
// Rene funksjoner – samme logikk uansett datakilde (json eller woocommerce).

import { lagSlug, normaliserMal, sokbar } from '@/lib/tekst'
import type { Kategori, Katalog, Merke, Ore, Produkt } from '@/lib/woocommerce/typer'

// ---------- Kategorier ----------

export function finnKategori(k: Katalog, sti: string[]): Kategori | undefined {
  let nivaa = k.kategorier
  let funnet: Kategori | undefined
  for (const slug of sti) {
    funnet = nivaa.find((c) => c.slug === slug)
    if (!funnet) return undefined
    nivaa = funnet.barn
  }
  return funnet
}

/** Kategoriene fra toppen ned til og med den gitte stien – til brødsmuler. */
export function kategorikjede(k: Katalog, sti: string[]): Kategori[] {
  const kjede: Kategori[] = []
  for (let i = 1; i <= sti.length; i++) {
    const kat = finnKategori(k, sti.slice(0, i))
    if (!kat) break
    kjede.push(kat)
  }
  return kjede
}

export function alleKategorier(k: Katalog): Kategori[] {
  const ut: Kategori[] = []
  const gaa = (liste: Kategori[]) => {
    for (const kat of liste) {
      ut.push(kat)
      gaa(kat.barn)
    }
  }
  gaa(k.kategorier)
  return ut
}

function liggerUnder(p: Produkt, sti: string[]): boolean {
  return p.kategorier.some((c) => sti.every((slug, i) => c.sti[i] === slug))
}

export function produkterIKategori(k: Katalog, sti: string[]): Produkt[] {
  return k.produkter.filter((p) => liggerUnder(p, sti))
}

export function finnMerke(k: Katalog, slug: string): Merke | undefined {
  return k.merker.find((m) => m.slug === slug)
}

// ---------- Filtre ----------

export const PRISINTERVALLER = [
  { id: 'under-300', navn: 'Under 300 kr', fra: 0, til: 30000 },
  { id: '300-1000', navn: '300–1 000 kr', fra: 30000, til: 100000 },
  { id: '1000-2000', navn: '1 000–2 000 kr', fra: 100000, til: 200000 },
  { id: 'over-2000', navn: 'Over 2 000 kr', fra: 200000, til: Number.POSITIVE_INFINITY },
] as const

export type Sortering = 'populare' | 'nyeste' | 'pris-stigende' | 'pris-synkende' | 'navn'

export const SORTERINGER: { id: Sortering; navn: string }[] = [
  { id: 'populare', navn: 'Mest populære' },
  { id: 'nyeste', navn: 'Nyeste' },
  { id: 'pris-stigende', navn: 'Pris: lav til høy' },
  { id: 'pris-synkende', navn: 'Pris: høy til lav' },
  { id: 'navn', navn: 'Navn: A–Å' },
]

/** Egenskaper det kan filtreres på, med URL-navn. */
export const VARIANTFILTRE = [
  { id: 'storrelse', egenskap: 'Størrelse', navn: 'Størrelse' },
  { id: 'farge', egenskap: 'Farge', navn: 'Farge' },
] as const

export type VariantfilterId = (typeof VARIANTFILTRE)[number]['id']

export interface Filtre {
  kategori: string[]
  merke: string[]
  pris: string[]
  lager: boolean
  tilbud: boolean
  storrelse: string[]
  farge: string[]
}

export const TOMME_FILTRE: Filtre = {
  kategori: [],
  merke: [],
  pris: [],
  lager: false,
  tilbud: false,
  storrelse: [],
  farge: [],
}

export type Sokeparametre = Record<string, string | string[] | undefined>

function liste(verdi: string | string[] | undefined): string[] {
  if (verdi === undefined) return []
  return (Array.isArray(verdi) ? verdi.join(',') : verdi)
    .split(',')
    .map((v) => v.trim())
    .filter((v) => /^[\p{L}\p{N}-]{1,80}$/u.test(v))
}

export interface Listetilstand {
  filtre: Filtre
  sortering: Sortering | 'relevans'
  side: number
  sok?: string
}

export function lesListetilstand(
  p: Sokeparametre,
  standard: Sortering | 'relevans' = 'populare',
): Listetilstand {
  const sorter = typeof p.sorter === 'string' ? p.sorter : ''
  const sortering = SORTERINGER.some((s) => s.id === sorter) ? (sorter as Sortering) : standard
  const side = Math.min(Math.max(Number.parseInt(String(p.side ?? '1'), 10) || 1, 1), 50)
  const sok = typeof p.q === 'string' ? p.q.slice(0, 100) : undefined
  return {
    filtre: {
      kategori: liste(p.kategori),
      merke: liste(p.merke),
      pris: liste(p.pris).filter((id) => PRISINTERVALLER.some((i) => i.id === id)),
      lager: p.lager === '1',
      tilbud: p.tilbud === '1',
      storrelse: liste(p.storrelse),
      farge: liste(p.farge),
    },
    sortering,
    side,
    ...(sok !== undefined ? { sok } : {}),
  }
}

/** Filtrene bor i adressen, så en filtrert liste kan deles, bokmerkes og gås tilbake til. */
export function listeUrl(basis: string, t: Listetilstand, endring: Partial<Listetilstand> = {}): string {
  const n: Listetilstand = { ...t, ...endring, filtre: { ...t.filtre, ...endring.filtre } }
  // En ny filtrering eller sortering starter alltid på første side.
  if (endring.filtre || endring.sortering) n.side = 1
  const p = new URLSearchParams()
  if (n.sok) p.set('q', n.sok)
  for (const nokkel of ['kategori', 'merke', 'pris', 'storrelse', 'farge'] as const) {
    if (n.filtre[nokkel].length) p.set(nokkel, n.filtre[nokkel].join(','))
  }
  if (n.filtre.lager) p.set('lager', '1')
  if (n.filtre.tilbud) p.set('tilbud', '1')
  const standard = n.sok ? 'relevans' : 'populare'
  if (n.sortering !== standard) p.set('sorter', n.sortering)
  if (n.side > 1) p.set('side', String(n.side))
  const q = p.toString()
  return q ? `${basis}?${q}` : basis
}

export function veksle(liste: string[], verdi: string): string[] {
  return liste.includes(verdi) ? liste.filter((v) => v !== verdi) : [...liste, verdi]
}

export function antallAktive(f: Filtre): number {
  return (
    f.kategori.length +
    f.merke.length +
    f.pris.length +
    f.storrelse.length +
    f.farge.length +
    (f.lager ? 1 : 0) +
    (f.tilbud ? 1 : 0)
  )
}

export function erPaTilbud(p: Produkt): boolean {
  return p.pris.tilbud || p.varianter.some((v) => v.duplikatAv === null && v.pris.tilbud)
}

/** Verdien slik den vises og nøkkelen i adressen: «50ml» → { navn: '50 ml', id: '50-ml' }. */
export function variantverdi(navn: string): { id: string; navn: string } {
  const pen = normaliserMal(navn.trim())
  return { id: lagSlug(pen), navn: pen }
}

function verdierFor(p: Produkt, egenskap: string): Set<string> {
  const e = p.egenskaper.find((x) => x.navn.toLocaleLowerCase('nb') === egenskap.toLocaleLowerCase('nb'))
  return new Set((e?.verdier ?? []).map((v) => variantverdi(v.navn).id))
}

function iPrisintervall(pris: Ore, ider: string[]): boolean {
  if (ider.length === 0) return true
  return PRISINTERVALLER.some((i) => ider.includes(i.id) && pris >= i.fra && pris < i.til)
}

type Fasett = 'kategori' | 'merke' | 'pris' | 'lager' | 'tilbud' | VariantfilterId

function passer(p: Produkt, f: Filtre, basisSti: string[], unntatt?: Fasett): boolean {
  if (unntatt !== 'kategori' && f.kategori.length > 0) {
    if (!f.kategori.some((slug) => liggerUnder(p, [...basisSti, slug]))) return false
  }
  if (unntatt !== 'merke' && f.merke.length > 0 && !(p.merke && f.merke.includes(p.merke.slug))) return false
  if (unntatt !== 'pris' && !iPrisintervall(p.pris.pris, f.pris)) return false
  if (unntatt !== 'lager' && f.lager && p.lager.status === 'utsolgt') return false
  if (unntatt !== 'tilbud' && f.tilbud && !erPaTilbud(p)) return false
  for (const vf of VARIANTFILTRE) {
    const valgt = f[vf.id]
    if (unntatt !== vf.id && valgt.length > 0) {
      const har = verdierFor(p, vf.egenskap)
      if (!valgt.some((v) => har.has(v))) return false
    }
  }
  return true
}

export function filtrer(produkter: Produkt[], f: Filtre, basisSti: string[] = []): Produkt[] {
  return produkter.filter((p) => passer(p, f, basisSti))
}

const utsolgtSist = (p: Produkt) => (p.lager.status === 'utsolgt' ? 1 : 0)
const plass = (p: Produkt) => p.popularitet ?? Number.MAX_SAFE_INTEGER

export function sorter(produkter: Produkt[], s: Sortering): Produkt[] {
  const kopi = [...produkter]
  switch (s) {
    case 'pris-stigende':
      return kopi.sort((a, b) => a.pris.pris - b.pris.pris || a.id - b.id)
    case 'pris-synkende':
      return kopi.sort((a, b) => b.pris.pris - a.pris.pris || a.id - b.id)
    case 'navn':
      return kopi.sort(
        (a, b) =>
          (a.merke?.navn ?? '').localeCompare(b.merke?.navn ?? '', 'nb') ||
          a.visningsnavn.localeCompare(b.visningsnavn, 'nb'),
      )
    case 'nyeste':
      return kopi.sort(
        (a, b) =>
          utsolgtSist(a) - utsolgtSist(b) ||
          (b.opprettet ?? '').localeCompare(a.opprettet ?? '') ||
          b.id - a.id,
      )
    default:
      // WooCommerces popularitet (total_sales), utsolgte sist.
      return kopi.sort((a, b) => utsolgtSist(a) - utsolgtSist(b) || plass(a) - plass(b) || b.id - a.id)
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
  storrelse: Fasettverdi[]
  farge: Fasettverdi[]
  lager: number
  tilbud: number
}

function sorterVerdier(a: Fasettverdi, b: Fasettverdi): number {
  const ta = Number.parseFloat(a.navn.replace(',', '.'))
  const tb = Number.parseFloat(b.navn.replace(',', '.'))
  if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) return ta - tb
  return a.navn.localeCompare(b.navn, 'nb', { numeric: true })
}

/**
 * Antall treff per filterverdi, regnet med de andre aktive filtrene (vanlig fasettering).
 * `underkategorier` er kategoriene det gir mening å filtrere på der listen står.
 */
export function fasetter(
  base: Produkt[],
  f: Filtre,
  k: Katalog,
  underkategorier: Kategori[],
  basisSti: string[] = [],
): Fasetter {
  const kategori = underkategorier
    .map((kat) => ({
      id: kat.slug,
      navn: kat.navn,
      antall: base.filter(
        (p) => passer(p, f, basisSti, 'kategori') && liggerUnder(p, [...basisSti, kat.slug]),
      ).length,
      valgt: f.kategori.includes(kat.slug),
    }))
    .filter((v) => v.antall > 0 || v.valgt)

  const merkeTall = new Map<string, Fasettverdi>()
  for (const p of base) {
    if (!p.merke || !passer(p, f, basisSti, 'merke')) continue
    const m = merkeTall.get(p.merke.slug) ?? { id: p.merke.slug, navn: p.merke.navn, antall: 0, valgt: false }
    m.antall++
    merkeTall.set(p.merke.slug, m)
  }
  for (const slug of f.merke) {
    const m = merkeTall.get(slug) ?? {
      id: slug,
      navn: finnMerke(k, slug)?.navn ?? slug,
      antall: 0,
      valgt: false,
    }
    m.valgt = true
    merkeTall.set(slug, m)
  }
  const merke = [...merkeTall.values()].sort((a, b) => a.navn.localeCompare(b.navn, 'nb'))

  const pris = PRISINTERVALLER.map((i) => ({
    id: i.id,
    navn: i.navn,
    antall: base.filter((p) => passer(p, f, basisSti, 'pris') && p.pris.pris >= i.fra && p.pris.pris < i.til)
      .length,
    valgt: f.pris.includes(i.id),
  })).filter((v) => v.antall > 0 || v.valgt)

  const variant = (vf: (typeof VARIANTFILTRE)[number]): Fasettverdi[] => {
    const tall = new Map<string, Fasettverdi>()
    for (const p of base) {
      if (!passer(p, f, basisSti, vf.id)) continue
      const e = p.egenskaper.find(
        (x) => x.navn.toLocaleLowerCase('nb') === vf.egenskap.toLocaleLowerCase('nb'),
      )
      const sett = new Set<string>()
      for (const v of e?.verdier ?? []) {
        const { id, navn } = variantverdi(v.navn)
        if (sett.has(id)) continue
        sett.add(id)
        const t = tall.get(id) ?? { id, navn, antall: 0, valgt: f[vf.id].includes(id) }
        t.antall++
        tall.set(id, t)
      }
    }
    return [...tall.values()].sort(sorterVerdier)
  }

  return {
    kategori,
    merke,
    pris,
    storrelse: variant(VARIANTFILTRE[0]),
    farge: variant(VARIANTFILTRE[1]),
    lager: base.filter((p) => passer(p, f, basisSti, 'lager') && p.lager.status !== 'utsolgt').length,
    tilbud: base.filter((p) => passer(p, f, basisSti, 'tilbud') && erPaTilbud(p)).length,
  }
}

export const PER_SIDE = 24

/** «Vis flere»: side n viser de n første sidene samlet, så lenken også virker uten JavaScript. */
export function side<T>(liste: T[], nr: number, perSide = PER_SIDE): { elementer: T[]; flere: boolean } {
  const slutt = nr * perSide
  return { elementer: liste.slice(0, slutt), flere: liste.length > slutt }
}

// ---------- Hurtigkjøp ----------

/** Raskt kjøp bare når valget er entydig: et enkelt produkt, eller et variabelt med én kjøpbar variant. */
export function hurtigkjop(p: Produkt): { variantId: number | null } | null {
  if (!p.kjopbar) return null
  if (p.type === 'enkel') return { variantId: null }
  const kjopbare = p.varianter.filter((v) => v.duplikatAv === null && v.kjopbar)
  const gyldige = p.varianter.filter((v) => v.duplikatAv === null)
  if (gyldige.length === 1 && kjopbare.length === 1 && kjopbare[0]) return { variantId: kjopbare[0].id }
  return null
}

// ---------- Nyheter og bestselgere (fra WooCommerce-data, aldri satt for hånd) ----------

/** Nyhet: publisert i WooCommerce de siste `dager` dagene. */
export function erNyhet(p: Produkt, naa: Date, dager = 60): boolean {
  if (!p.opprettet) return false
  const alder = (naa.getTime() - new Date(p.opprettet).getTime()) / 86_400_000
  return alder >= 0 && alder <= dager
}

export function nyeste(k: Katalog, antall: number): Produkt[] {
  return sorter(
    k.produkter.filter((p) => p.kjopbar),
    'nyeste',
  ).slice(0, antall)
}

export function bestselgere(produkter: Produkt[], antall: number): Produkt[] {
  return sorter(
    produkter.filter((p) => p.kjopbar && p.popularitet !== null),
    'populare',
  ).slice(0, antall)
}

// ---------- Relaterte produkter ----------

/** Samme merke og samme kategori først, så samme kategori, så samme merke. Aldri produktet selv. */
export function relaterte(k: Katalog, p: Produkt, antall = 8): Produkt[] {
  const sti = p.hovedkategori?.sti ?? []
  const poeng = (q: Produkt) => {
    let s = 0
    if (p.merke && q.merke?.slug === p.merke.slug) s += 2
    if (sti.length && liggerUnder(q, sti)) s += 3
    else if (sti.length > 1 && liggerUnder(q, sti.slice(0, -1))) s += 1
    return s
  }
  return k.produkter
    .filter((q) => q.id !== p.id && q.kjopbar)
    .map((q) => ({ q, s: poeng(q) }))
    .filter((x) => x.s >= 2)
    .sort((a, b) => b.s - a.s || plass(a.q) - plass(b.q))
    .slice(0, antall)
    .map((x) => x.q)
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

export interface Sokerad {
  produkt: Produkt
  merke: string
  navn: string
  kategorier: string
  sku: string
  tekst: string
}

export function lagSokeindeks(k: Katalog): Sokerad[] {
  const navnPaSti = new Map(alleKategorier(k).map((c) => [c.sti.join('/'), c.navn]))
  // Med overordnede kategorier, så «duft» også finner det som ligger i «Nisjeduft».
  const kategoritekst = (p: Produkt) =>
    [
      ...new Set(
        p.kategorier.flatMap((c) =>
          c.sti.map((_, i) => navnPaSti.get(c.sti.slice(0, i + 1).join('/')) ?? ''),
        ),
      ),
    ].join(' ')
  return k.produkter.map((p) => ({
    produkt: p,
    merke: sokbar(p.merke?.navn ?? ''),
    navn: sokbar(`${p.navn} ${p.visningsnavn}`),
    kategorier: sokbar(kategoritekst(p)),
    sku: sokbar(p.sku),
    tekst: sokbar(p.beskrivelse.slice(0, 3000)),
  }))
}

function ordStarter(tekst: string, ledd: string): boolean {
  return tekst.startsWith(ledd) || tekst.includes(` ${ledd}`)
}

export function sok(indeks: Sokerad[], sporsmal: string): Produkt[] {
  const ledd = sokbar(sporsmal)
    .split(' ')
    .filter((l) => l.length > 0)
  if (ledd.length === 0) return []
  const treff: { produkt: Produkt; poeng: number }[] = []
  for (const rad of indeks) {
    let poeng = 0
    let alle = true
    for (const l of ledd) {
      let best = 0
      for (const v of SYNONYMER[l] ?? [l]) {
        if (rad.sku === v) best = Math.max(best, 8)
        if (rad.merke === v) best = Math.max(best, 6)
        else if (ordStarter(rad.merke, v)) best = Math.max(best, 5)
        if (ordStarter(rad.navn, v)) best = Math.max(best, 3)
        else if (v.length >= 3 && rad.navn.includes(v)) best = Math.max(best, 2)
        if (ordStarter(rad.kategorier, v) || (v.length >= 4 && rad.kategorier.includes(v)))
          best = Math.max(best, 1)
        if (v.length >= 4 && ordStarter(rad.tekst, v)) best = Math.max(best, 1)
      }
      if (best === 0) {
        alle = false
        break
      }
      poeng += best
    }
    // Varer på lager først ved likt treff.
    if (alle)
      treff.push({
        produkt: rad.produkt,
        poeng: poeng * 2 + (rad.produkt.lager.status === 'utsolgt' ? 0 : 1),
      })
  }
  return treff.sort((a, b) => b.poeng - a.poeng || plass(a.produkt) - plass(b.produkt)).map((t) => t.produkt)
}

export function sokMerker(k: Katalog, sporsmal: string): Merke[] {
  const q = sokbar(sporsmal)
  if (!q) return []
  return k.merker.filter((m) => ordStarter(sokbar(m.navn), q)).slice(0, 6)
}

export function sokKategorier(k: Katalog, sporsmal: string): Kategori[] {
  const q = sokbar(sporsmal)
  if (q.length < 2) return []
  return alleKategorier(k)
    .filter((c) => ordStarter(sokbar(c.navn), q))
    .sort((a, b) => b.antall - a.antall)
    .slice(0, 6)
}
