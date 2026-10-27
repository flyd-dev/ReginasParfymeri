import 'server-only'

// Inngangen til katalogen. DATA_SOURCE velger kilde:
//   json        – data/products.json m.fl. (standard; prototype uten staging)
//   woocommerce – Store API på WOO_URL (staging etter import). Mellomlagres og revalideres ved webhook.

import { lesJsonKatalog } from './json-kilde'
import { byggKatalog, hentStoreRaadata } from './store-kilde'
import type { Katalog } from './typer'

export type Datakilde = 'json' | 'woocommerce'

export function datakilde(): Datakilde {
  return process.env.DATA_SOURCE === 'woocommerce' ? 'woocommerce' : 'json'
}

export function wooUrl(): string {
  return process.env.WOO_URL ?? 'https://nettbutikk.reginaparfymeri.no'
}

/** Tagg for Next.js-mellomlagringen; /api/revalidate ugyldiggjør den ved product.* -webhooks. */
export const KATALOG_TAGG = 'katalog'

const levetid = () => Number.parseInt(process.env.KATALOG_LEVETID ?? '300', 10)

let minne: { katalog: Promise<Katalog>; utloper: number } | null = null

export function hentKatalog(): Promise<Katalog> {
  const naa = Date.now()
  if (minne && minne.utloper > naa) return minne.katalog
  const katalog =
    datakilde() === 'woocommerce'
      ? hentStoreRaadata({ butikk: wooUrl(), revalidate: levetid(), tags: [KATALOG_TAGG] }).then((raa) =>
          byggKatalog(raa, new Date().toISOString()),
        )
      : lesJsonKatalog()
  // json-filene endres ikke mens serveren kjører; Store API-data holdes i minnet like lenge som fetch-cachen.
  minne = {
    katalog,
    utloper: datakilde() === 'woocommerce' ? naa + levetid() * 1000 : Number.POSITIVE_INFINITY,
  }
  katalog.catch(() => {
    minne = null
  })
  return katalog
}

/** Tømmer minnet i denne prosessen (kalles av /api/revalidate sammen med revalidateTag). */
export function glemKatalog(): void {
  minne = null
}

export type * from './typer'
