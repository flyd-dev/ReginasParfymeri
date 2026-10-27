import { createHmac, timingSafeEqual } from 'node:crypto'

/** base64(HMAC-SHA256(kropp)) – samme som WooCommerce-webhooks og mu-pluginen sender. Sammenligner i konstant tid. */
export function gyldigSignatur(
  kropp: string,
  signatur: string | null,
  hemmelighet: string | undefined,
): boolean {
  if (!signatur || !hemmelighet) return false
  const forventet = createHmac('sha256', hemmelighet).update(kropp, 'utf8').digest()
  const mottatt = Buffer.from(signatur, 'base64')
  return mottatt.length === forventet.length && timingSafeEqual(mottatt, forventet)
}
