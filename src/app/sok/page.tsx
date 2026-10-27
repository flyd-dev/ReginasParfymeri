import type { Metadata } from 'next'
import { Produktliste } from '@/components/katalog/produktliste'
import { Brodsmuler } from '@/components/layout/brodsmuler'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { lesListetilstand, sok } from '@/lib/katalog/sporring'
import { hentSokeindeks } from '@/lib/katalog/sokeindeks'
import { naa } from '@/lib/tid'

export const metadata: Metadata = { title: 'Søk', robots: { index: false, follow: true } }

export default async function Sokeside({ searchParams }: PageProps<'/sok'>) {
  const parametre = await searchParams
  const tilstand = lesListetilstand(parametre, 'relevans')
  const q = (tilstand.sok ?? '').trim()
  const { katalog, indeks } = await hentSokeindeks()
  const treff = q ? sok(indeks, q) : []

  return (
    <div className="mx-auto max-w-screen-2xl px-4 pt-6 pb-10 md:px-6">
      <Brodsmuler smuler={[{ navn: 'Søk' }]} />
      <header className="mt-8 mb-10 max-w-3xl">
        <h1 className="text-4xl md:text-6xl">{q ? <>Søk: «{q}»</> : 'Søk'}</h1>
        <form method="get" action="/sok/" role="search" className="mt-6 flex gap-2">
          <label htmlFor="sok-felt" className="sr-only">
            Søk etter produkter og merker
          </label>
          <Input
            id="sok-felt"
            name="q"
            defaultValue={q}
            placeholder="Søk etter duft, merke eller produkt"
            className="h-12 bg-paper text-base"
          />
          <Button type="submit" size="lg">
            Søk
          </Button>
        </form>
      </header>
      {q ? (
        <Produktliste katalog={katalog} base={treff} tilstand={tilstand} basis="/sok/" naa={naa()} />
      ) : (
        <p className="text-sand-ink">
          Skriv hva du leter etter – for eksempel et merke, en duft eller en produkttype.
        </p>
      )}
    </div>
  )
}
