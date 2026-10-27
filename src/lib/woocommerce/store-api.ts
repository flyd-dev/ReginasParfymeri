// Lesing fra WooCommerce. Bare GET, og bare mot stiene i `TILLATTE_LESESTIER` – katalogen skal aldri kunne
// opprette handlekurver, ordre eller endre noe i butikken. Handlekurven har sin egen modul (kurv/store-kurv.ts)
// med egne regler for skriving. Testen i store-api.test.ts holder grensen.

export const TILLATTE_LESESTIER = [
  '/wp-json/wc/store/v1/products',
  '/wp-json/wc/store/v1/products/categories',
  '/wp-json/wp/v2/product',
  '/wp-json/wp/v2/pwb-brand',
  '/wp-json/regina/v1/kampanjer',
  '/wp-json/regina/v1/butikk',
] as const

const AGENT = 'Flyd-Regina-nettbutikk/1.0'

export class WooFeil extends Error {
  constructor(
    melding: string,
    readonly status?: number,
  ) {
    super(melding)
    this.name = 'WooFeil'
  }
}

export function erTillattLesing(url: URL, butikk: URL): boolean {
  if (url.origin !== butikk.origin) return false
  return (TILLATTE_LESESTIER as readonly string[]).includes(url.pathname.replace(/\/$/, ''))
}

export interface Leseoppsett {
  butikk: string
  /** Erstatter `fetch` i tester. */
  fetcher?: typeof fetch
  /** Next.js-mellomlagring (sekunder) og tagger for revalidering ved webhook. */
  revalidate?: number
  tags?: string[]
}

type NextInit = RequestInit & { next?: { revalidate?: number; tags?: string[] } }

export async function hentJson<T>(url: URL, oppsett: Leseoppsett): Promise<{ data: T; sider: number }> {
  const butikk = new URL(oppsett.butikk)
  if (!erTillattLesing(url, butikk)) throw new WooFeil(`Stien er ikke tillatt for lesing: ${url.pathname}`)
  const init: NextInit = {
    method: 'GET',
    headers: { accept: 'application/json', 'user-agent': AGENT },
    redirect: 'error',
  }
  if (oppsett.revalidate !== undefined || oppsett.tags) {
    init.next = { revalidate: oppsett.revalidate, tags: oppsett.tags }
  }
  let svar: Response
  try {
    svar = await (oppsett.fetcher ?? fetch)(url, init)
  } catch (feil) {
    throw new WooFeil(`Fikk ikke kontakt med WooCommerce (${(feil as Error).message})`)
  }
  if (!svar.ok) throw new WooFeil(`WooCommerce svarte ${svar.status} på ${url.pathname}`, svar.status)
  const sider = Number.parseInt(svar.headers.get('x-wp-totalpages') ?? '1', 10)
  return { data: (await svar.json()) as T, sider: Number.isFinite(sider) && sider > 0 ? sider : 1 }
}

/** Henter alle sider (100 per side) av en liste. */
export async function hentAlle<T>(
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
    const svar = await hentJson<T[]>(url, oppsett)
    alle.push(...svar.data)
    sider = svar.sider
    side++
  } while (side <= sider && side <= 60)
  return alle
}
