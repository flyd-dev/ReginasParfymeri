import 'server-only'

import { hentKatalog } from '@/lib/woocommerce'
import type { Katalog } from '@/lib/woocommerce/typer'
import { lagSokeindeks, type Sokerad } from './sporring'

let minne: { katalog: Katalog; indeks: Sokerad[] } | null = null

/** Søkeindeksen bygges én gang per katalog og deles av søkesiden og hurtigsøket. */
export async function hentSokeindeks(): Promise<{ katalog: Katalog; indeks: Sokerad[] }> {
  const katalog = await hentKatalog()
  if (minne?.katalog !== katalog) minne = { katalog, indeks: lagSokeindeks(katalog) }
  return minne
}
