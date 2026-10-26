// Gjør WooCommerce-beskrivelser (HTML) om til strukturerte tekstblokker.
// Vi gjengir aldri HTML fra kilden direkte: alt blir ren tekst som React escaper.
// Duftnoter leses bare når de faktisk står i beskrivelsen – de diktes aldri opp.

import type { Duftnoter, Innholdsblokk } from './typer'
import { dekodHtml } from './tekst'

/** HTML → linjer med ren tekst, ett avsnitt/linjeskift per linje. */
export function tilLinjer(html: string): string[] {
  const medSkift = html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|li|h[1-6]|ul|ol|tr)\s*>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '\n• ')
    .replace(/<[^>]*>/g, '')
  return dekodHtml(medSkift)
    .replace(/ /g, ' ')
    .split('\n')
    .map((linje) => linje.replace(/[ \t]+/g, ' ').trim())
    .filter((linje) => linje.length > 0)
}

const NIVAA = [
  { nivaa: 'topp', moenster: 'topp\\s?noter|toppnote|top\\s?notes?' },
  { nivaa: 'hjerte', moenster: 'hjerte\\s?noter|hjertenote|heart\\s?notes?|middle\\s?notes?' },
  { nivaa: 'bunn', moenster: 'bunn?\\s?noter|bunnote|base\\s?noter|basenote|base\\s?notes?' },
] as const

const NOTEMERKE = new RegExp(`(${NIVAA.map((n) => n.moenster).join('|')})\\s*:`, 'gi')

function nivaaFor(merke: string): keyof Duftnoter | null {
  for (const n of NIVAA) {
    if (new RegExp(`^(${n.moenster})$`, 'i').test(merke.trim())) return n.nivaa
  }
  return null
}

function delNoter(tekst: string): string[] {
  return tekst
    .replace(/\.\s*$/, '')
    .split(/,|;|\s+og\s+|\s+and\s+|\s+&\s+/i)
    .map((note) => note.trim().replace(/^[-–•\s]+|[.\s]+$/g, ''))
    .filter((note) => note.length > 1 && note.length < 60)
    .map((note) => note.charAt(0).toLocaleUpperCase('nb-NO') + note.slice(1))
}

/**
 * Finner topp-, hjerte- og bunnoter i en beskrivelse. Returnerer `null` hvis beskrivelsen
 * ikke oppgir noter eksplisitt («Toppnoter: …»). Løpende tekst tolkes ikke.
 */
export function finnDuftnoter(linjer: string[]): Duftnoter | null {
  const noter: Duftnoter = { topp: [], hjerte: [], bunn: [] }
  for (const linje of linjer) {
    const treff = [...linje.matchAll(NOTEMERKE)]
    for (let i = 0; i < treff.length; i++) {
      const t = treff[i]
      if (!t || t.index === undefined) continue
      const nivaa = nivaaFor(t[1] ?? '')
      if (!nivaa) continue
      const start = t.index + t[0].length
      const slutt = treff[i + 1]?.index ?? linje.length
      const verdi = linje.slice(start, slutt)
      if (noter[nivaa].length === 0) noter[nivaa] = delNoter(verdi)
    }
  }
  const antallNivaa = [noter.topp, noter.hjerte, noter.bunn].filter((n) => n.length > 0).length
  return antallNivaa >= 2 ? noter : null
}

function erNotelinje(linje: string): boolean {
  return (
    /^(duftnoter|noter|duftpyramide)\s*:?$/i.test(linje) ||
    new RegExp(`^(${NIVAA.map((n) => n.moenster).join('|')})\\s*:`, 'i').test(linje)
  )
}

function erOverskrift(linje: string): boolean {
  const utenKolon = linje.replace(/:$/, '')
  if (utenKolon.length < 3 || utenKolon.length > 48) return false
  const versaler = !/\p{Ll}/u.test(utenKolon) && /\p{Lu}/u.test(utenKolon)
  return versaler || (linje.endsWith(':') && utenKolon.split(' ').length <= 5)
}

function rolig(linje: string): string {
  const uten = linje.replace(/:$/, '')
  if (/\p{Ll}/u.test(uten)) return uten
  const liten = uten.toLocaleLowerCase('nb-NO')
  return liten.charAt(0).toLocaleUpperCase('nb-NO') + liten.slice(1)
}

/**
 * Bygger visningsblokker av en beskrivelse. Når duftnotene vises strukturert, tas de ut av
 * teksten så de ikke står to ganger.
 */
export function lagInnhold(html: string, utenNoter: boolean): Innholdsblokk[] {
  const blokker: Innholdsblokk[] = []
  for (const linje of tilLinjer(html)) {
    if (utenNoter && erNotelinje(linje)) continue
    const punkt = /^[•\-–]\s+(.+)$/.exec(linje)
    if (punkt?.[1]) {
      const forrige = blokker[blokker.length - 1]
      if (forrige?.type === 'liste') forrige.punkter.push(punkt[1])
      else blokker.push({ type: 'liste', punkter: [punkt[1]] })
      continue
    }
    if (erOverskrift(linje)) {
      blokker.push({ type: 'overskrift', tekst: rolig(linje) })
      continue
    }
    blokker.push({ type: 'avsnitt', tekst: linje })
  }
  // En overskrift helt til slutt uten innhold under seg gir ingen mening.
  while (blokker[blokker.length - 1]?.type === 'overskrift') blokker.pop()
  return blokker
}

/** Første avsnitt, forkortet – til metabeskrivelse og produktkort. */
export function ingress(blokker: Innholdsblokk[], maks = 180): string {
  const forste = blokker.find((b) => b.type === 'avsnitt')
  if (!forste || forste.type !== 'avsnitt') return ''
  if (forste.tekst.length <= maks) return forste.tekst
  const kuttet = forste.tekst.slice(0, maks)
  return `${kuttet.slice(0, kuttet.lastIndexOf(' '))}…`
}
