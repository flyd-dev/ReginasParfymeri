// Leser Reginas WooCommerce. Bare GET, og bare mot stiene i `TILLATTE_STIER`:
// konseptet skal aldri kunne opprette handlekurver, ordre eller endre noe i butikken.
// Testen i `hent.test.ts` holder grensen.

import type { WooKategori, WooMerke, WooProdukt, WooProduktMerke } from './storeApi'

export const TILLATTE_STIER = [
  '/wp-json/wc/store/v1/products',
  '/wp-json/wc/store/v1/products/categories',
  '/wp-json/wp/v2/pwb-brand',
  '/wp-json/wp/v2/product',
] as const

const AGENT = 'Flyd-konsept-regina/0.1 (lesing av offentlig katalog)'

export class KatalogFeil extends Error {
  constructor(
    melding: string,
    readonly status?: number,
  ) {
    super(melding)
    this.name = 'KatalogFeil'
  }
}

export function erTillattLesing(url: URL, butikk: URL): boolean {
  if (url.origin !== butikk.origin) return false
  return (TILLATTE_STIER as readonly string[]).includes(url.pathname.replace(/\/$/, ''))
}

export interface Leseoppsett {
  butikk: string
  /** Erstatter `fetch` i tester. */
  fetcher?: typeof fetch
  /** Next.js-mellomlagring når koden kjører i appen. */
  revalidate?: number
  pause?: number
}

async function hentSide<T>(url: URL, oppsett: Leseoppsett): Promise<{ data: T; sider: number }> {
  const butikk = new URL(oppsett.butikk)
  if (!erTillattLesing(url, butikk))
    throw new KatalogFeil(`Stien er ikke tillatt for lesing: ${url.pathname}`)
  const f = oppsett.fetcher ?? fetch
  const init: RequestInit & { next?: { revalidate: number } } = {
    method: 'GET',
    headers: { accept: 'application/json', 'user-agent': AGENT },
    redirect: 'error',
  }
  if (oppsett.revalidate !== undefined) init.next = { revalidate: oppsett.revalidate }
  let svar: Response
  try {
    svar = await f(url, init)
  } catch (feil) {
    throw new KatalogFeil(`Fikk ikke kontakt med nettbutikken (${(feil as Error).message})`)
  }
  if (!svar.ok) throw new KatalogFeil(`Nettbutikken svarte ${svar.status} på ${url.pathname}`, svar.status)
  const sider = Number.parseInt(svar.headers.get('x-wp-totalpages') ?? '1', 10)
  return { data: (await svar.json()) as T, sider: Number.isFinite(sider) && sider > 0 ? sider : 1 }
}

async function hentAlle<T>(
  sti: string,
  parametre: Record<string, string>,
  oppsett: Leseoppsett,
): Promise<T[]> {
  const alle: T[] = []
  let side = 1
  let sider = 1
  do {
    const url = new URL(sti, oppsett.butikk)
    for (const [k, v] of Object.entries(parametre)) url.searchParams.set(k, v)
    url.searchParams.set('per_page', '100')
    url.searchParams.set('page', String(side))
    const svar = await hentSide<T[]>(url, oppsett)
    alle.push(...svar.data)
    sider = svar.sider
    side++
    if (oppsett.pause) await new Promise((r) => setTimeout(r, oppsett.pause))
  } while (side <= sider && side <= 50)
  return alle
}

export interface Raadata {
  produkter: WooProdukt[]
  variasjoner: WooProdukt[]
  kategorier: WooKategori[]
  merker: WooMerke[]
  produktmerker: WooProduktMerke[]
}

export async function hentRaadata(oppsett: Leseoppsett): Promise<Raadata> {
  // Rekkefølgen her er Store API-ets standard: nyeste først.
  const produkter = await hentAlle<WooProdukt>('/wp-json/wc/store/v1/products', {}, oppsett)
  const variasjoner = await hentAlle<WooProdukt>(
    '/wp-json/wc/store/v1/products',
    { type: 'variation' },
    oppsett,
  )
  const kategorier = await hentAlle<WooKategori>('/wp-json/wc/store/v1/products/categories', {}, oppsett)
  const merker = await hentAlle<WooMerke>(
    '/wp-json/wp/v2/pwb-brand',
    { _fields: 'id,name,slug,count' },
    oppsett,
  )
  const produktmerker = await hentAlle<WooProduktMerke>(
    '/wp-json/wp/v2/product',
    { _fields: 'id,pwb-brand' },
    oppsett,
  )
  return { produkter, variasjoner, kategorier, merker, produktmerker }
}
