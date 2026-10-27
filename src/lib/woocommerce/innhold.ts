import 'server-only'

// Innhold som styres i WordPress via mu-pluginen (wordpress/mu-plugins/regina-headless.php):
// kampanjebanner og butikkinfo (åpningstider). DATA_SOURCE=json bruker filer i repoet i stedet.
// Ingenting her finner på innhold: mangler det, vises det ikke.

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import kampanjerFil from '@/content/kampanjer.json'
import { datakilde, wooUrl } from './index'
import type { SideJson } from './json-format'
import { hentJson } from './store-api'

export interface Kampanje {
  id: number
  tekst: string
  lenke: string | null
  lenketekst: string | null
  /** ISO 8601 med tidssone. */
  start: string
  slutt: string
}

export interface Butikkinfo {
  apningstider: { dager: string; tid: string }[]
  /** Åpningstidene vises bare når butikken har bekreftet dem (oppdraget §7). */
  bekreftet: boolean
  oppdatert: string | null
}

export const KAMPANJE_TAGG = 'kampanjer'
export const BUTIKK_TAGG = 'butikk'

/** Aktiv nå: startet og ikke utløpt. Brukes både på serveren og i nettleseren. */
export function erAktiv(k: Pick<Kampanje, 'start' | 'slutt'>, naa: Date): boolean {
  const start = Date.parse(k.start)
  const slutt = Date.parse(k.slutt)
  if (!Number.isFinite(start) || !Number.isFinite(slutt)) return false
  return start <= naa.getTime() && naa.getTime() < slutt
}

export function gyldigKampanje(k: unknown): k is Kampanje {
  if (typeof k !== 'object' || k === null) return false
  const x = k as Record<string, unknown>
  return (
    typeof x.id === 'number' &&
    typeof x.tekst === 'string' &&
    x.tekst.trim().length > 0 &&
    typeof x.start === 'string' &&
    typeof x.slutt === 'string' &&
    Number.isFinite(Date.parse(x.start)) &&
    Number.isFinite(Date.parse(x.slutt)) &&
    (x.lenke === null ||
      x.lenke === undefined ||
      (typeof x.lenke === 'string' && /^(\/|https:\/\/)/.test(x.lenke)))
  )
}

/** Kampanjer som er aktive nå eller starter snart (så nettleseren kan vise dem når starttiden kommer). */
export async function hentKampanjer(naa = new Date()): Promise<{ kampanjer: Kampanje[]; tidspunkt: number }> {
  let liste: unknown[] = kampanjerFil as unknown[]
  if (datakilde() === 'woocommerce') {
    try {
      const url = new URL('/wp-json/regina/v1/kampanjer', wooUrl())
      liste = (await hentJson<unknown[]>(url, { butikk: wooUrl(), revalidate: 300, tags: [KAMPANJE_TAGG] }))
        .data
    } catch (feil) {
      // Banneret er pynt; feiler WordPress, vises siden uten banner.
      console.error('Kampanjer:', (feil as Error).message)
      return { kampanjer: [], tidspunkt: naa.getTime() }
    }
  }
  const kampanjer = liste
    .filter(gyldigKampanje)
    .filter((k) => Date.parse(k.slutt) > naa.getTime())
    .map((k) => ({ ...k, lenke: k.lenke ?? null, lenketekst: k.lenketekst ?? null }))
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
  return { kampanjer, tidspunkt: naa.getTime() }
}

export async function hentButikkinfo(): Promise<Butikkinfo | null> {
  if (datakilde() !== 'woocommerce') return null
  try {
    const url = new URL('/wp-json/regina/v1/butikk', wooUrl())
    return (await hentJson<Butikkinfo>(url, { butikk: wooUrl(), revalidate: 3600, tags: [BUTIKK_TAGG] })).data
  } catch {
    return null
  }
}

let sider: Promise<SideJson[]> | null = null

/** Reginas egne tekster (vilkår, frakt, retur, om oss, personvern) – fra data/pages.json. */
export async function hentSide(slug: string): Promise<SideJson | null> {
  sider ??= readFile(path.join(process.cwd(), 'data', 'pages.json'), 'utf8').then(
    (t) => JSON.parse(t) as SideJson[],
  )
  return (await sider).find((s) => s.slug === slug) ?? null
}
