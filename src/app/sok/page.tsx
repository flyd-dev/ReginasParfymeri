import type { Metadata } from 'next'
import Link from 'next/link'
import { Produktliste } from '@/components/liste/Produktliste'
import { hentKatalog } from '@/lib/katalog/kilde'
import { barnAv, sok, type Sokeparametre } from '@/lib/katalog/sporring'
import { byggListe } from '@/lib/liste'
import { sokeindeks } from '@/lib/sokeforslag'
import { BUTIKK } from '@/innhold/butikk'

type Props = { searchParams: Promise<Sokeparametre> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = (await searchParams).q
  return { title: typeof q === 'string' && q ? `Søk: ${q}` : 'Søk' }
}

export default async function Sokeside({ searchParams }: Props) {
  const [parametre, katalog] = await Promise.all([searchParams, hentKatalog()])
  const q = typeof parametre.q === 'string' ? parametre.q.slice(0, 80).trim() : ''
  const grunnlag = q ? sok(sokeindeks(katalog), q) : []
  const topp = barnAv(katalog).get(null) ?? []
  const liste = byggListe(katalog, grunnlag, parametre, topp, q)
  return (
    <Produktliste
      basis="/sok"
      kicker="Søk"
      tittel={q ? <>Treff på «{q}»</> : 'Søk i nettbutikken'}
      smuler={[{ navn: 'Søk' }]}
      kategoritittel="Kategori"
      tom={
        <>
          <p className="t-3">{q ? `Ingen treff på «${q}»` : 'Skriv inn et søkeord'}</p>
          <p className="dempet">
            Sjekk stavemåten eller prøv et merke. Mye av sortimentet finnes bare i butikken – ring oss gjerne
            på <a href={BUTIKK.telefon.lenke}>{BUTIKK.telefon.visning}</a>.
          </p>
          <Link href="/merker" className="tekstlenke">
            Se alle merkene
          </Link>
        </>
      }
      {...liste}
    />
  )
}
