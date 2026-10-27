// «Gå til kassen». Lokal kurv (prototype): oversikten på /kasse/. WooCommerce-kurv: overføring til
// WooCommerces egen kasse via mu-pluginen (se docs/architecture.md).

import { NextResponse, type NextRequest } from 'next/server'
import { kurvmodus } from '@/lib/kurv'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (kurvmodus() === 'lokal') return NextResponse.redirect(new URL('/kasse/', req.url), 303)
  return NextResponse.redirect(new URL('/kasse/', req.url), 303)
}
