// Validerer handlekurven mot katalogen: gjeldende pris, lager og om varianten finnes.
// Skriver ingenting – verken her eller i WooCommerce.

import { NextResponse, type NextRequest } from 'next/server'
import { validerKurv } from '@/lib/handlekurv/kurv'
import { hentKatalog } from '@/lib/katalog/kilde'

interface Innlinje {
  produktId: number
  variantId: number | null
  antall: number
  enhetspris: number
}

function erLinje(x: unknown): x is Innlinje {
  if (typeof x !== 'object' || x === null) return false
  const l = x as Record<string, unknown>
  return (
    Number.isSafeInteger(l.produktId) &&
    (l.variantId === null || Number.isSafeInteger(l.variantId)) &&
    Number.isSafeInteger(l.antall) &&
    (l.antall as number) > 0 &&
    (l.antall as number) <= 99 &&
    Number.isSafeInteger(l.enhetspris)
  )
}

export async function POST(req: NextRequest) {
  let kropp: unknown
  try {
    kropp = await req.json()
  } catch {
    return NextResponse.json({ feil: 'Ugyldig forespørsel.' }, { status: 400 })
  }
  const linjer = (kropp as { linjer?: unknown })?.linjer
  if (!Array.isArray(linjer) || linjer.length > 50 || !linjer.every(erLinje)) {
    return NextResponse.json({ feil: 'Ugyldig handlekurv.' }, { status: 400 })
  }
  try {
    const katalog = await hentKatalog()
    return NextResponse.json({ linjer: validerKurv(linjer, katalog), hentet: katalog.meta.hentet })
  } catch {
    return NextResponse.json({ feil: 'Fikk ikke sjekket pris og lager.' }, { status: 503 })
  }
}
