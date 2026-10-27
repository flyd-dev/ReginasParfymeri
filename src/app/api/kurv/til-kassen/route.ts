// «Gå til kassen» (POST fra et skjema, så forhåndslasting aldri treffer den). WooCommerce-kurv: 303 til
// overføringen i mu-pluginen, som legger kurven i WooCommerces egen kasse (docs/architecture.md §5.2).
// Lokal kurv (prototype): oversikten på /kasse/.

import { NextResponse, type NextRequest } from 'next/server'
import { tilKassen } from '@/lib/kurv'
import { KurvFeil } from '@/lib/kurv/lokal-kurv'

export const dynamic = 'force-dynamic'

const HODER = { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' }

export async function POST(req: NextRequest) {
  try {
    const maal = await tilKassen()
    if (!maal) return NextResponse.redirect(new URL('/handlekurv/', req.url), { status: 303, headers: HODER })
    return NextResponse.redirect(new URL(maal, req.url), { status: 303, headers: HODER })
  } catch (feil) {
    const melding = feil instanceof KurvFeil ? feil.message : 'Kunne ikke åpne kassen.'
    return NextResponse.redirect(new URL(`/handlekurv/?feil=${encodeURIComponent(melding)}`, req.url), {
      status: 303,
      headers: HODER,
    })
  }
}
