// Selve kjøringen: argumenter, miljø, kildefiler, lesing fra staging, plan, rapport og (med --apply)
// skriving. Alt utenfor (fetch, filsystem, logg, klokke) sendes inn, så hele løpet kan testes.

import path from 'node:path'
import { byggKilde } from './kilde'
import { MAKS_PER_BATCH, lagKlient } from './klient'
import type { FetchFunksjon, WooKlient } from './klient'
import { kontrollerEtterImport, lesEksisterende } from './les'
import { lagPlan, tomButikk } from './plan'
import { applyRapport, torrkjoringsrapport } from './rapport'
import type { RapportMeta } from './rapport'
import { kontrollerStagingUrl } from './sikkerhet'
import type { KildeFiler, Plan } from './typer'
import { utforPlan } from './utfor'
import type { UtforResultat } from './utfor'

export const KILDEFILER = {
  produkter: 'data/products.json',
  variasjonerRaa: 'raw/variations_raw.json',
  kategorier: 'data/categories.json',
  merker: 'data/brands.json',
} as const

export const RAPPORTER = {
  torrMd: 'reports/import-dry-run.md',
  torrJson: 'reports/import-dry-run.json',
  apply: 'reports/import-apply.md',
} as const

export const BRUK = `Import av Reginas katalog til et staging-WooCommerce (REST API v3).

  pnpm tsx scripts/import_to_woocommerce.ts              tørrkjøring (standard, bare GET)
  pnpm tsx scripts/import_to_woocommerce.ts --dry-run    det samme
  pnpm tsx scripts/import_to_woocommerce.ts --apply      skriv til staging

Valg:
  --produkter-per-kall=N   produkter per batch-kall ved --apply (1–${MAKS_PER_BATCH}, standard 10 – bildene lastes ned i kallet)

Miljø: WC_STAGING_URL (https, aldri produksjon), WC_STAGING_KEY, WC_STAGING_SECRET.
Uten nøkler kjører tørrkjøringen helt offline mot en tom butikk.
Rapporter: ${RAPPORTER.torrMd}, ${RAPPORTER.torrJson}, ${RAPPORTER.apply}`

export interface Argumenter {
  modus: 'torr' | 'apply'
  produkterPerKall: number
  hjelp: boolean
}

export function tolkArgumenter(argv: string[]): Argumenter {
  let apply = false
  let torr = false
  let hjelp = false
  // Lavt som standard: WooCommerce laster ned bildene i samme kall, og PHP har ofte 30–60 s tidsgrense.
  let produkterPerKall = 10
  for (const arg of argv) {
    if (arg === '--apply') apply = true
    else if (arg === '--dry-run') torr = true
    else if (arg === '--help' || arg === '-h' || arg === '--hjelp') hjelp = true
    else if (arg.startsWith('--produkter-per-kall=')) {
      const n = Number(arg.slice('--produkter-per-kall='.length))
      if (!Number.isInteger(n) || n < 1 || n > MAKS_PER_BATCH) {
        throw new Error(`--produkter-per-kall må være et heltall 1–${MAKS_PER_BATCH}`)
      }
      produkterPerKall = n
    } else throw new Error(`Ukjent argument: ${arg}\n\n${BRUK}`)
  }
  if (apply && torr) throw new Error('Velg enten --dry-run eller --apply, ikke begge')
  return { modus: apply ? 'apply' : 'torr', produkterPerKall, hjelp }
}

export interface KjorValg {
  argv: string[]
  env: Record<string, string | undefined>
  fetch: FetchFunksjon
  /** Repo-roten; kildefiler og rapporter er relative til den. */
  rot: string
  lesFil: (sti: string) => Promise<string>
  skrivFil: (sti: string, innhold: string) => Promise<void>
  logg: (linje: string) => void
  vent?: (ms: number) => Promise<void>
  naa?: () => Date
}

export interface KjorResultat {
  kode: number
  modus: 'torr' | 'apply'
  plan: Plan | null
  rapporter: string[]
}

async function lesJson<T>(valg: KjorValg, relativ: string, sjekk: (data: unknown) => boolean): Promise<T> {
  const tekst = await valg.lesFil(path.join(valg.rot, relativ))
  const data: unknown = JSON.parse(tekst)
  if (!sjekk(data)) throw new Error(`${relativ} har ikke forventet form`)
  return data as T
}

async function lesKilde(valg: KjorValg): Promise<KildeFiler> {
  const erObjekt = (d: unknown) => typeof d === 'object' && d !== null && !Array.isArray(d)
  return {
    produkter: await lesJson(valg, KILDEFILER.produkter, Array.isArray),
    variasjonerRaa: await lesJson(valg, KILDEFILER.variasjonerRaa, erObjekt),
    kategorier: await lesJson(valg, KILDEFILER.kategorier, Array.isArray),
    merker: await lesJson(valg, KILDEFILER.merker, Array.isArray),
  }
}

export async function kjorImport(valg: KjorValg): Promise<KjorResultat> {
  const args = tolkArgumenter(valg.argv)
  if (args.hjelp) {
    valg.logg(BRUK)
    return { kode: 0, modus: args.modus, plan: null, rapporter: [] }
  }
  const naa = valg.naa ?? (() => new Date())
  const skriv = async (relativ: string, innhold: string) => {
    await valg.skrivFil(path.join(valg.rot, relativ), innhold)
    return relativ
  }

  // Miljøet. Nøklene brukes bare i Authorization-hodet og skrives aldri ut.
  const url = valg.env.WC_STAGING_URL?.trim() || null
  const nokkel = valg.env.WC_STAGING_KEY?.trim() || null
  const hemmelighet = valg.env.WC_STAGING_SECRET?.trim() || null
  // Kontrolleres også når vi kjører offline: en produksjons-URL i miljøet er alltid feil.
  const staging = url ? kontrollerStagingUrl(url) : null
  const tilgang = staging && nokkel && hemmelighet ? { url: staging, nokkel, hemmelighet } : null
  const miljo: string[] = []
  if (!tilgang && (url || nokkel || hemmelighet)) {
    miljo.push(
      '**Merk:** ufullstendig miljø – WC_STAGING_URL, WC_STAGING_KEY og WC_STAGING_SECRET må alle være satt. Kjørte offline.',
    )
  }
  if (args.modus === 'apply' && !tilgang) {
    throw new Error('--apply krever WC_STAGING_URL, WC_STAGING_KEY og WC_STAGING_SECRET i miljøet')
  }

  const klient = (bareLesing: boolean): WooKlient | null =>
    tilgang
      ? lagKlient({ ...tilgang, fetch: valg.fetch, bareLesing, vent: valg.vent, logg: valg.logg })
      : null

  valg.logg(`Leser kilden (${Object.values(KILDEFILER).join(', ')}) …`)
  const kilde = byggKilde(await lesKilde(valg))
  const leser = klient(true)
  const eks = leser ? await lesEksisterende(leser, valg.logg) : tomButikk()
  if (!leser) valg.logg('Ingen nøkler i miljøet – planlegger offline mot en tom butikk.')
  const plan = lagPlan(kilde, eks)
  const meta: RapportMeta = {
    tidspunkt: naa(),
    staging: tilgang ? tilgang.url : null,
    miljo,
    produkterPerKall: args.produkterPerKall,
  }

  if (args.modus === 'torr') {
    const { md, json } = torrkjoringsrapport(kilde, plan, meta)
    const rapporter = [await skriv(RAPPORTER.torrMd, md), await skriv(RAPPORTER.torrJson, json)]
    loggOppsummering(valg, plan)
    valg.logg(`Tørrkjøring ferdig. Rapport: ${rapporter.join(' og ')}`)
    return { kode: 0, modus: 'torr', plan, rapporter }
  }

  // --apply
  if (plan.blokkerende.length > 0 || !leser) {
    const md = applyRapport(
      kilde,
      plan,
      meta,
      null,
      null,
      `Ingenting er skrevet. ${plan.blokkerende.join(' ')}`,
    )
    const rapport = await skriv(RAPPORTER.apply, md)
    valg.logg(`Avbrutt før skriving – se ${rapport}`)
    return { kode: 1, modus: 'apply', plan, rapporter: [rapport] }
  }
  const skriver = klient(false)
  if (!skriver) throw new Error('Mangler klient for skriving')
  let resultat: UtforResultat
  try {
    resultat = await utforPlan(plan, eks, skriver, {
      produkterPerKall: args.produkterPerKall,
      logg: valg.logg,
    })
  } catch (e) {
    const melding = e instanceof Error ? e.message : String(e)
    const rapport = await skriv(
      RAPPORTER.apply,
      applyRapport(
        kilde,
        plan,
        { ...meta, tidspunkt: naa() },
        null,
        null,
        `Uventet feil under skrivingen: ${melding}`,
      ),
    )
    valg.logg(`Stoppet: ${melding} – se ${rapport}`)
    return { kode: 1, modus: 'apply', plan, rapporter: [rapport] }
  }
  valg.logg('Teller opp i staging (GET) …')
  const kontroll = await kontrollerEtterImport(kilde, leser)
  const md = applyRapport(kilde, plan, { ...meta, tidspunkt: naa() }, resultat, kontroll, resultat.avbrutt)
  const rapport = await skriv(RAPPORTER.apply, md)
  const ok = !resultat.avbrutt && resultat.feil.length === 0 && kontroll.stemmer
  valg.logg(
    `${ok ? 'Ferdig' : 'Ferdig med avvik'}: ${kontroll.produkter.funnet}/${kontroll.produkter.forventet} produkter, ` +
      `${kontroll.variasjoner.funnet}/${kontroll.variasjoner.forventet} variasjoner i staging. Rapport: ${rapport}`,
  )
  return { kode: ok ? 0 : 1, modus: 'apply', plan, rapporter: [rapport] }
}

function loggOppsummering(valg: KjorValg, plan: Plan): void {
  for (const a of plan.avstemming) {
    valg.logg(
      `  ${a.type.padEnd(15)} ${String(a.iKilden).padStart(5)} i kilden → ${a.opprett} opprettes, ${a.oppdater} oppdateres, ` +
        `${a.uendret} uendret, ${a.hoppesOver} hoppes over${a.stemmer ? '' : '  ← STEMMER IKKE'}`,
    )
  }
  valg.logg(
    `  Advarsler: ${plan.advarsler.length} · Feil: ${plan.feil.length} · Blokkerende: ${plan.blokkerende.length}`,
  )
}
