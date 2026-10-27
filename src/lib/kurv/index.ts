import 'server-only'

import { cookies } from 'next/headers'
import { hentKatalog } from '@/lib/woocommerce'
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

export async function hentKurv(): Promise<Kurv> {
  return lokalKurv()
}

export async function leggIKurv(ny: LeggTil): Promise<Kurv> {
  const katalog = await hentKatalog()
  return lokalKurv((l) => leggTil(katalog, l, ny))
}

export async function endreIKurv(nokkel: string, antall: number): Promise<Kurv> {
  return lokalKurv((l) => endreAntall(l, nokkel, antall))
}

export async function fjernFraKurv(nokkel: string): Promise<Kurv> {
  return lokalKurv((l) => fjern(l, nokkel))
}
