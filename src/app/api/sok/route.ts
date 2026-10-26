import { NextResponse, type NextRequest } from 'next/server'
import { hentKatalog } from '@/lib/katalog/kilde'
import { lagSokeforslag } from '@/lib/sokeforslag'

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').slice(0, 80)
  try {
    const katalog = await hentKatalog()
    return NextResponse.json(lagSokeforslag(katalog, q), {
      headers: { 'cache-control': 'public, max-age=60' },
    })
  } catch {
    return NextResponse.json({ feil: 'Søket er ikke tilgjengelig akkurat nå.' }, { status: 503 })
  }
}
