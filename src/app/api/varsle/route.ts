// «Gi meg beskjed når den er tilbake»: sendes videre til mu-pluginen i WooCommerce
// (POST /wp-json/regina/v1/varsle, docs/architecture.md §5.5). I prototypen (DATA_SOURCE=json) finnes ingen
// WooCommerce å lagre i, og det sies rett ut. Skriving mot produksjon er stengt til lansering.

import { NextResponse, type NextRequest } from 'next/server'
import { BUTIKK } from '@/content/butikk'
import { kanSkriveTil } from '@/lib/kurv/store-kurv'
import { datakilde, wooUrl } from '@/lib/woocommerce'

export const dynamic = 'force-dynamic'

const EPOST = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/

export async function POST(req: NextRequest) {
  const data = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const produkt = Number(data.produkt)
  const variant = data.variant === null || data.variant === undefined ? undefined : Number(data.variant)
  const epost = typeof data.epost === 'string' ? data.epost.trim() : ''
  if (
    !Number.isSafeInteger(produkt) ||
    (variant !== undefined && !Number.isSafeInteger(variant)) ||
    !EPOST.test(epost)
  ) {
    return NextResponse.json({ feil: 'Skriv inn en gyldig e-postadresse.' }, { status: 400 })
  }
  if (datakilde() !== 'woocommerce' || !kanSkriveTil(wooUrl())) {
    return NextResponse.json(
      {
        feil: `Varsling er ikke koblet til i forhåndsvisningen. Ring oss på ${BUTIKK.telefon.visning}, så gir vi beskjed.`,
      },
      { status: 503 },
    )
  }
  try {
    const svar = await fetch(new URL('/wp-json/regina/v1/varsle', wooUrl()), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'x-forwarded-for': req.headers.get('x-forwarded-for') ?? '',
      },
      body: JSON.stringify({ produkt, variant, epost }),
      cache: 'no-store',
      redirect: 'error',
    })
    const kropp = (await svar.json().catch(() => ({}))) as { feil?: string }
    if (!svar.ok)
      return NextResponse.json(
        { feil: kropp.feil ?? 'Kunne ikke registrere varselet.' },
        { status: svar.status },
      )
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ feil: 'Fikk ikke kontakt med nettbutikken. Prøv igjen.' }, { status: 502 })
  }
}
