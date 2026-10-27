// Handlekurven. Nettleseren snakker bare med denne ruten; serveren velger lokal kurv eller WooCommerce
// (src/lib/kurv). Skjemaer uten JavaScript poster hit og sendes videre til /handlekurv/.

import { NextResponse, type NextRequest } from 'next/server'
import { endreIKurv, fjernFraKurv, hentKurv, leggIKurv } from '@/lib/kurv'
import { KurvFeil } from '@/lib/kurv/lokal-kurv'

export const dynamic = 'force-dynamic'

function tall(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v !== '' ? Number(v) : Number.NaN
  return Number.isSafeInteger(n) ? n : null
}

async function svar(arbeid: () => Promise<unknown>) {
  try {
    return NextResponse.json(await arbeid(), { headers: { 'cache-control': 'no-store' } })
  } catch (feil) {
    if (feil instanceof KurvFeil) return NextResponse.json({ feil: feil.message }, { status: feil.status })
    console.error('Handlekurv:', feil)
    return NextResponse.json({ feil: 'Noe gikk galt med handlekurven. Prøv igjen.' }, { status: 500 })
  }
}

export async function GET() {
  return svar(hentKurv)
}

export async function POST(req: NextRequest) {
  const erSkjema = (req.headers.get('content-type') ?? '').includes('form')
  const data: Record<string, unknown> = erSkjema
    ? Object.fromEntries((await req.formData()).entries())
    : ((await req.json().catch(() => ({}))) as Record<string, unknown>)
  const produktId = tall(data.produktId)
  const variantId =
    data.variantId === null || data.variantId === undefined || data.variantId === ''
      ? null
      : tall(data.variantId)
  const antall = tall(data.antall) ?? 1
  if (produktId === null || (data.variantId && variantId === null) || antall < 1 || antall > 99) {
    return NextResponse.json({ feil: 'Ugyldig vare.' }, { status: 400 })
  }
  if (erSkjema) {
    // Uten JavaScript: legg i kurven og vis handlekurvsiden.
    try {
      await leggIKurv({ produktId, variantId, antall })
      return NextResponse.redirect(new URL('/handlekurv/', req.url), 303)
    } catch (feil) {
      const melding = feil instanceof KurvFeil ? feil.message : 'Noe gikk galt.'
      return NextResponse.redirect(new URL(`/handlekurv/?feil=${encodeURIComponent(melding)}`, req.url), 303)
    }
  }
  return svar(() => leggIKurv({ produktId, variantId, antall }))
}

export async function PATCH(req: NextRequest) {
  const data = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const antall = tall(data.antall)
  if (typeof data.nokkel !== 'string' || antall === null || antall < 0 || antall > 99) {
    return NextResponse.json({ feil: 'Ugyldig endring.' }, { status: 400 })
  }
  return svar(() => endreIKurv(data.nokkel as string, antall))
}

export async function DELETE(req: NextRequest) {
  const data = (await req.json().catch(() => ({}))) as Record<string, unknown>
  if (typeof data.nokkel !== 'string') return NextResponse.json({ feil: 'Ugyldig vare.' }, { status: 400 })
  return svar(() => fjernFraKurv(data.nokkel as string))
}
