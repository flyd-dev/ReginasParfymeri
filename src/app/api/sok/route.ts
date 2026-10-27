// Hurtigsøket i kommandopaletten: produkter, merker og kategorier. Bare lesing fra katalogen.

import { NextResponse, type NextRequest } from 'next/server'
import { kroner, fraKroner } from '@/lib/format'
import { sok, sokKategorier, sokMerker } from '@/lib/katalog/sporring'
import { hentSokeindeks } from '@/lib/katalog/sokeindeks'

export interface Hurtigsvar {
  produkter: {
    slug: string
    navn: string
    merke: string | null
    bilde: string | null
    pris: string
    utsolgt: boolean
  }[]
  merker: { slug: string; navn: string; antall: number }[]
  kategorier: { sti: string[]; navn: string; antall: number }[]
  totalt: number
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').slice(0, 100)
  const { katalog, indeks } = await hentSokeindeks()
  const treff = q.trim().length >= 2 ? sok(indeks, q) : []
  const svar: Hurtigsvar = {
    produkter: treff.slice(0, 6).map((p) => ({
      slug: p.slug,
      navn: p.visningsnavn,
      merke: p.merke?.navn ?? null,
      bilde: p.bilder[0]?.src ?? null,
      pris: p.prisspenn ? fraKroner(p.prisspenn.fra) : kroner(p.pris.pris),
      utsolgt: p.lager.status === 'utsolgt',
    })),
    merker: sokMerker(katalog, q).map((m) => ({ slug: m.slug, navn: m.navn, antall: m.antall })),
    kategorier: sokKategorier(katalog, q).map((c) => ({ sti: c.sti, navn: c.navn, antall: c.antall })),
    totalt: treff.length,
  }
  return NextResponse.json(svar, { headers: { 'cache-control': 'public, max-age=60' } })
}
