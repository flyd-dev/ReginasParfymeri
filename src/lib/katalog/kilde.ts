import 'server-only'

// Hvor katalogen kommer fra. Valget er eksplisitt (`KATALOG_KILDE`) og stille fallback finnes
// ikke: feiler live-lesingen, vises en feilside – aldri utdraget som om det var ferskt.

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { cache } from 'react'
import { byggKatalog } from './bygg'
import type { Katalog } from './typer'
import type { Bildeanalyse } from './woo/mapping'
import { hentRaadata, KatalogFeil } from './woo/hent'

export type Katalogkilde = 'utdrag' | 'live'

export function valgtKilde(): Katalogkilde {
  const verdi = process.env.KATALOG_KILDE ?? 'utdrag'
  if (verdi !== 'utdrag' && verdi !== 'live') {
    throw new KatalogFeil(`Ukjent KATALOG_KILDE «${verdi}» – bruk «utdrag» eller «live».`)
  }
  return verdi
}

const KATALOGMAPPE = path.join(process.cwd(), 'data', 'katalog')

let utdrag: Promise<Katalog> | null = null
let liveMinne: { katalog: Katalog; utloper: number } | null = null
let liveHenter: Promise<Katalog> | null = null

async function lesUtdrag(): Promise<Katalog> {
  utdrag ??= readFile(path.join(KATALOGMAPPE, 'katalog.json'), 'utf8').then((t) => JSON.parse(t) as Katalog)
  return utdrag
}

async function lesBildeanalyser(): Promise<Record<string, Bildeanalyse>> {
  try {
    return JSON.parse(await readFile(path.join(KATALOGMAPPE, 'bildeanalyse.json'), 'utf8')) as Record<
      string,
      Bildeanalyse
    >
  } catch {
    return {}
  }
}

async function lesLive(): Promise<Katalog> {
  const levetid = Number.parseInt(process.env.KATALOG_LEVETID ?? '300', 10) * 1000
  if (liveMinne && liveMinne.utloper > Date.now()) return liveMinne.katalog
  liveHenter ??= (async () => {
    try {
      const butikk = process.env.WOO_URL ?? 'https://nettbutikk.reginaparfymeri.no'
      const [raa, analyser] = await Promise.all([hentRaadata({ butikk }), lesBildeanalyser()])
      const katalog = byggKatalog(raa, analyser, { kilde: 'live', butikk, hentet: new Date().toISOString() })
      liveMinne = { katalog, utloper: Date.now() + levetid }
      return katalog
    } finally {
      liveHenter = null
    }
  })()
  return liveHenter
}

/** Katalogen for denne forespørselen. Deles mellom komponentene i samme rendring. */
export const hentKatalog = cache(async (): Promise<Katalog> => {
  return valgtKilde() === 'live' ? lesLive() : lesUtdrag()
})
