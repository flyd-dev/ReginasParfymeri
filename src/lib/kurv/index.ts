import 'server-only'

import { cookies } from 'next/headers'
import { hentKatalog, wooUrl } from '@/lib/woocommerce'
import {
  endreStore,
  fjernStore,
  fraStoreKurv,
  kasseadresse,
  leggTilStore,
  lesStoreKurv,
  TOKEN_COOKIE,
  type Kurvoppsett,
} from './store-kurv'
import {
  kontroller,
  endreAntall,
  fjern,
  leggTil,
  lesLagret,
  LOKAL_COOKIE,
  skrivLagret,
  type LagretLinje,
} from './lokal-kurv'
import type { Kurv, Kurvmodus, LeggTil } from './typer'

/**
 * Hvor kurven bor. `woocommerce` bruker Store API-kurven med Cart-Token (staging), `lokal` en cookie med
 * ID-er som kontrolleres mot katalogen (prototype, ingen kall mot WooCommerce).
 */
export function kurvmodus(): Kurvmodus {
  if (process.env.KURV === 'lokal') return 'lokal'
  if (process.env.KURV === 'woocommerce') return 'woocommerce'
  return process.env.DATA_SOURCE === 'woocommerce' ? 'woocommerce' : 'lokal'
}

const COOKIE_OPPSETT = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
}

async function lesLokal(): Promise<LagretLinje[]> {
  return lesLagret((await cookies()).get(LOKAL_COOKIE)?.value)
}

async function lagreLokal(linjer: LagretLinje[]): Promise<void> {
  const jar = await cookies()
  if (linjer.length === 0) jar.delete(LOKAL_COOKIE)
  else jar.set(LOKAL_COOKIE, skrivLagret(linjer), COOKIE_OPPSETT)
}

async function lokalKurv(endring?: (l: LagretLinje[]) => LagretLinje[]): Promise<Kurv> {
  const katalog = await hentKatalog()
  let lagret = await lesLokal()
  if (endring) lagret = endring(lagret)
  const { kurv, rettet } = kontroller(katalog, lagret)
  if (endring || JSON.stringify(rettet) !== JSON.stringify(lagret)) await lagreLokal(rettet)
  return kurv
}

/** Cart-Token i httpOnly-cookie, oppdatert fra hvert svar (docs/architecture.md §5.1). */
async function storeOppsett(): Promise<Kurvoppsett> {
  const jar = await cookies()
  let token = jar.get(TOKEN_COOKIE)?.value || null
  return {
    butikk: wooUrl(),
    token: {
      les: () => token,
      skriv: (nytt) => {
        token = nytt
        jar.set(TOKEN_COOKIE, nytt, { ...COOKIE_OPPSETT, maxAge: 60 * 60 * 48 })
      },
    },
  }
}

export async function hentKurv(): Promise<Kurv> {
  if (kurvmodus() === 'lokal') return lokalKurv()
  const o = await storeOppsett()
  // Ingen kurv ennå: ikke opprett en WooCommerce-økt for hver besøkende.
  if (!o.token.les()) return { modus: 'woocommerce', linjer: [], antall: 0, delsum: 0, meldinger: [] }
  return fraStoreKurv(await hentKatalog(), await lesStoreKurv(o))
}

export async function leggIKurv(ny: LeggTil): Promise<Kurv> {
  const katalog = await hentKatalog()
  if (kurvmodus() === 'lokal') return lokalKurv((l) => leggTil(katalog, l, ny))
  return fraStoreKurv(katalog, await leggTilStore(await storeOppsett(), katalog, ny))
}

export async function endreIKurv(nokkel: string, antall: number): Promise<Kurv> {
  if (kurvmodus() === 'lokal') return lokalKurv((l) => endreAntall(l, nokkel, antall))
  return fraStoreKurv(await hentKatalog(), await endreStore(await storeOppsett(), nokkel, antall))
}

export async function fjernFraKurv(nokkel: string): Promise<Kurv> {
  if (kurvmodus() === 'lokal') return lokalKurv((l) => fjern(l, nokkel))
  return fraStoreKurv(await hentKatalog(), await fjernStore(await storeOppsett(), nokkel))
}

/** Hvor «Gå til kassen» skal: WooCommerce-kassen via overføringen, eller oversikten i prototypen. */
export async function tilKassen(): Promise<string | null> {
  if (kurvmodus() === 'lokal') return '/kasse/'
  const o = await storeOppsett()
  if (!o.token.les()) return null
  return kasseadresse(o)
}
