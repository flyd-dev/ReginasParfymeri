// Tynn klient mot WooCommerce REST API v3 i staging.
//
// - Vertsnavnet kontrolleres (aldri produksjon, alltid https) før første kall.
// - `bareLesing: true` (tørrkjøring) avviser alt annet enn GET før noe sendes.
// - Omdirigeringer følges ikke: en staging som sender videre til produksjon skal stoppe her.
// - Nye forsøk ved 429 og 5xx (og nettverksfeil) med eksponentiell ventetid / Retry-After.
// - Nøklene sendes bare i Authorization-hodet og havner aldri i logg, feilmeldinger eller URL.

import { kontrollerStagingUrl } from './sikkerhet'

export type FetchFunksjon = (url: string, init: RequestInit) => Promise<Response>
export type Sporring = Record<string, string | number>

export interface KlientValg {
  url: string
  nokkel: string
  hemmelighet: string
  fetch: FetchFunksjon
  bareLesing: boolean
  vent?: (ms: number) => Promise<void>
  maksForsok?: number
  grunnventetidMs?: number
  tidsavbruddMs?: number
  logg?: (linje: string) => void
}

export interface BatchFeil {
  id: number
  error: { code: string; message: string; data?: { status?: number; resource_id?: number } }
}

export interface BatchSvar<T> {
  create?: (T | BatchFeil)[]
  update?: (T | BatchFeil)[]
}

export function erBatchFeil(element: unknown): element is BatchFeil {
  return typeof element === 'object' && element !== null && 'error' in element && Boolean(element.error)
}

export class WooFeil extends Error {
  readonly status: number
  readonly kode: string | null
  readonly data: { resource_id?: number } | null

  constructor(
    status: number,
    kode: string | null,
    melding: string,
    data: { resource_id?: number } | null = null,
  ) {
    super(melding)
    this.name = 'WooFeil'
    this.status = status
    this.kode = kode
    this.data = data
  }
}

export interface WooKlient {
  readonly base: string
  readonly bareLesing: boolean
  hent<T>(sti: string, sporring?: Sporring): Promise<{ data: T; totaltSider: number | null }>
  hentAlle<T>(sti: string, sporring?: Sporring): Promise<T[]>
  send<T>(metode: 'POST' | 'PUT', sti: string, kropp: unknown): Promise<T>
  batch<T>(sti: string, kropp: { create?: unknown[]; update?: unknown[] }): Promise<BatchSvar<T>>
}

/** WooCommerce sin grense per batch-kall (`woocommerce_rest_batch_items_limit`). */
export const MAKS_PER_BATCH = 100
const MAKS_VENTETID_MS = 120_000

export const standardVent = (ms: number) => new Promise<void>((ferdig) => setTimeout(ferdig, ms))

function lesRetryAfter(verdi: string | null): number | null {
  if (!verdi) return null
  const sekunder = Number(verdi)
  if (Number.isFinite(sekunder) && sekunder >= 0) return Math.min(sekunder * 1000, MAKS_VENTETID_MS)
  const tid = Date.parse(verdi)
  if (Number.isNaN(tid)) return null
  return Math.min(Math.max(tid - Date.now(), 0), MAKS_VENTETID_MS)
}

export function lagKlient(valg: KlientValg): WooKlient {
  const base = kontrollerStagingUrl(valg.url)
  const api = `${base}/wp-json/wc/v3`
  const opprinnelse = new URL(base).origin
  const vent = valg.vent ?? standardVent
  const maksForsok = valg.maksForsok ?? 5
  const grunnventetid = valg.grunnventetidMs ?? 1000
  const tidsavbrudd = valg.tidsavbruddMs ?? 300_000
  const logg = valg.logg ?? (() => {})
  const autorisasjon = `Basic ${Buffer.from(`${valg.nokkel}:${valg.hemmelighet}`).toString('base64')}`

  function byggUrl(sti: string, sporring?: Sporring): URL {
    if (!sti.startsWith('/') || sti.includes('..') || /[?#\\]/.test(sti) || sti.includes('//')) {
      throw new Error(`Ugyldig API-sti: ${sti}`)
    }
    const url = new URL(api + sti)
    if (url.origin !== opprinnelse) throw new Error(`API-stien peker ut av staging: ${sti}`)
    for (const [navn, verdi] of Object.entries(sporring ?? {})) url.searchParams.set(navn, String(verdi))
    return url
  }

  async function lagFeil(svar: Response, metode: string, sti: string): Promise<WooFeil> {
    const tekst = await svar.text().catch(() => '')
    let kode: string | null = null
    let melding = tekst.slice(0, 300)
    let data: { resource_id?: number } | null = null
    try {
      const json = JSON.parse(tekst) as { code?: unknown; message?: unknown; data?: unknown }
      if (typeof json.code === 'string') kode = json.code
      if (typeof json.message === 'string') melding = json.message
      if (typeof json.data === 'object' && json.data !== null) data = json.data as { resource_id?: number }
    } catch {
      // Ikke JSON – behold starten av teksten.
    }
    return new WooFeil(
      svar.status,
      kode,
      `${metode} ${sti} → ${svar.status}${kode ? ` ${kode}` : ''}: ${melding}`,
      data,
    )
  }

  async function forespor(metode: 'GET' | 'POST' | 'PUT', sti: string, sporring?: Sporring, kropp?: unknown) {
    if (valg.bareLesing && metode !== 'GET') {
      throw new Error(`Tørrkjøring: ${metode} ${sti} er ikke tillatt – bare GET`)
    }
    const url = byggUrl(sti, sporring)
    const hoder: Record<string, string> = {
      Accept: 'application/json',
      Authorization: autorisasjon,
      'User-Agent': 'Flyd-import-regina/0.1',
    }
    if (kropp !== undefined) hoder['Content-Type'] = 'application/json'

    for (let forsok = 1; ; forsok += 1) {
      let svar: Response | null = null
      let nettverksfeil: unknown = null
      const avbryter = new AbortController()
      const tidtaker = setTimeout(() => avbryter.abort(), tidsavbrudd)
      try {
        svar = await valg.fetch(url.toString(), {
          method: metode,
          headers: hoder,
          body: kropp === undefined ? undefined : JSON.stringify(kropp),
          redirect: 'manual',
          signal: avbryter.signal,
        })
      } catch (e) {
        nettverksfeil = e
      } finally {
        clearTimeout(tidtaker)
      }

      let ventetid: number
      if (svar) {
        if ((svar.status >= 300 && svar.status < 400) || svar.type === 'opaqueredirect') {
          throw new WooFeil(
            svar.status,
            'omdirigering',
            `${metode} ${sti} → ${svar.status}: staging sender videre (${svar.headers.get('location') ?? 'ukjent mål'}). ` +
              'Omdirigeringer følges ikke – sjekk WC_STAGING_URL.',
          )
        }
        if (svar.ok) return svar
        const kanProvesIgjen = svar.status === 429 || svar.status >= 500
        if (!kanProvesIgjen || forsok >= maksForsok) throw await lagFeil(svar, metode, sti)
        await svar.text().catch(() => '')
        ventetid = lesRetryAfter(svar.headers.get('retry-after')) ?? grunnventetid * 2 ** (forsok - 1)
        logg(
          `  ${metode} ${sti}: ${svar.status}, nytt forsøk om ${Math.round(ventetid / 100) / 10} s (${forsok}/${maksForsok - 1})`,
        )
      } else {
        const melding = nettverksfeil instanceof Error ? nettverksfeil.message : String(nettverksfeil)
        if (forsok >= maksForsok)
          throw new WooFeil(0, 'nettverk', `${metode} ${sti}: nettverksfeil (${melding})`)
        ventetid = grunnventetid * 2 ** (forsok - 1)
        logg(
          `  ${metode} ${sti}: nettverksfeil, nytt forsøk om ${Math.round(ventetid / 100) / 10} s (${forsok}/${maksForsok - 1})`,
        )
      }
      await vent(Math.min(ventetid, MAKS_VENTETID_MS))
    }
  }

  async function lesJson<T>(svar: Response): Promise<T> {
    return (await svar.json()) as T
  }

  return {
    base,
    bareLesing: valg.bareLesing,
    async hent<T>(sti: string, sporring?: Sporring) {
      const svar = await forespor('GET', sti, sporring)
      const sider = Number(svar.headers.get('x-wp-totalpages'))
      return { data: await lesJson<T>(svar), totaltSider: Number.isFinite(sider) && sider > 0 ? sider : null }
    },
    async hentAlle<T>(sti: string, sporring?: Sporring) {
      const perSide = Number(sporring?.per_page ?? 100)
      const alle: T[] = []
      for (let side = 1; side <= 1000; side += 1) {
        const svar = await forespor('GET', sti, { ...sporring, per_page: perSide, page: side })
        const data = await lesJson<T[]>(svar)
        if (!Array.isArray(data)) throw new Error(`GET ${sti} ga ikke en liste`)
        alle.push(...data)
        const sider = Number(svar.headers.get('x-wp-totalpages'))
        const sisteSide = Number.isFinite(sider) && sider > 0 ? side >= sider : data.length < perSide
        if (sisteSide || data.length === 0) break
      }
      return alle
    },
    async send<T>(metode: 'POST' | 'PUT', sti: string, kropp: unknown) {
      return lesJson<T>(await forespor(metode, sti, undefined, kropp))
    },
    async batch<T>(sti: string, kropp: { create?: unknown[]; update?: unknown[] }) {
      const antall = (kropp.create?.length ?? 0) + (kropp.update?.length ?? 0)
      if (antall > MAKS_PER_BATCH)
        throw new Error(`Batch med ${antall} elementer – maks er ${MAKS_PER_BATCH}`)
      return lesJson<BatchSvar<T>>(await forespor('POST', sti, undefined, kropp))
    },
  }
}
