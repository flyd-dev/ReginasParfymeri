// Revalidering ved endringer i WooCommerce/WordPress (docs/architecture.md §5.6):
// - WooCommerce-webhooks (product.created/updated/deleted) med X-WC-Webhook-Signature, nøkkel WOO_WEBHOOK_SECRET
// - mu-pluginen (kampanjer, butikkinfo) med X-Regina-Signature, nøkkel REGINA_REVALIDATE_SECRET
// Begge er base64(HMAC-SHA256(rå kropp)). Nøklene leses bare her på serveren.

import { revalidateTag } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'
import { gyldigSignatur } from '@/lib/signatur'
import { glemKatalog, KATALOG_TAGG } from '@/lib/woocommerce'
import { BUTIKK_TAGG, KAMPANJE_TAGG } from '@/lib/woocommerce/innhold'

export const dynamic = 'force-dynamic'

const TILLATTE_TAGGER = new Set([KAMPANJE_TAGG, BUTIKK_TAGG, KATALOG_TAGG])

export async function POST(req: NextRequest) {
  const kropp = await req.text()
  const woo = req.headers.get('x-wc-webhook-signature')
  const regina = req.headers.get('x-regina-signature')

  if (woo !== null) {
    if (!gyldigSignatur(kropp, woo, process.env.WOO_WEBHOOK_SECRET)) {
      return NextResponse.json({ feil: 'Ugyldig signatur' }, { status: 401 })
    }
    // WooCommerce sender en «ping» (webhook_id=…) når webhooken opprettes – den trenger bare 200.
    glemKatalog()
    revalidateTag(KATALOG_TAGG, 'max')
    return NextResponse.json({ ok: true, tagger: [KATALOG_TAGG] })
  }

  if (regina !== null) {
    if (!gyldigSignatur(kropp, regina, process.env.REGINA_REVALIDATE_SECRET)) {
      return NextResponse.json({ feil: 'Ugyldig signatur' }, { status: 401 })
    }
    let tagger: string[] = []
    try {
      const data = JSON.parse(kropp) as { tags?: unknown }
      tagger = Array.isArray(data.tags)
        ? data.tags.filter((t): t is string => typeof t === 'string' && TILLATTE_TAGGER.has(t))
        : []
    } catch {
      return NextResponse.json({ feil: 'Ugyldig kropp' }, { status: 400 })
    }
    for (const t of tagger) revalidateTag(t, 'max')
    if (tagger.includes(KATALOG_TAGG)) glemKatalog()
    return NextResponse.json({ ok: true, tagger })
  }

  return NextResponse.json({ feil: 'Mangler signatur' }, { status: 401 })
}
