import 'server-only'

// Innhold som styres i WordPress via mu-pluginen (wordpress/mu-plugins/regina-headless.php):
// kampanjebanner og butikkinfo (åpningstider). DATA_SOURCE=json bruker filer i repoet i stedet.
// Ingenting her finner på innhold: mangler det, vises det ikke.

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import kampanjerFil from '@/content/kampanjer.json'
import { datakilde, wooUrl } from './index'
import type { SideJson } from './json-format'
import { gyldigKampanje, type Kampanje } from './kampanje'
import { hentJson } from './store-api'

export type { Kampanje } from './kampanje'

export interface Butikkinfo {
  apningstider: { dager: string; tid: string }[]
  /** Åpningstidene vises bare når butikken har bekreftet dem (oppdraget §7). */
  bekreftet: boolean
  oppdatert: string | null
}

export const KAMPANJE_TAGG = 'kampanjer'
export const BUTIKK_TAGG = 'butikk'

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
