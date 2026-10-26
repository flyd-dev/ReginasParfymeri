import { Duftnoter, type Notegruppe } from '@/components/forside/Duftnoter'
import { Hero } from '@/components/forside/Hero'
import { Innganger, type Inngang } from '@/components/forside/Innganger'
import { Besok, Hudpleieavdeling, Merkevegg, Nisjeduft, Veiledning } from '@/components/forside/Seksjoner'
import { INNGANGER, UTVALGTE_NISJEDUFTER } from '@/innhold/forside'
import { hentKatalog } from '@/lib/katalog/kilde'
import { finnKategori, harNote, noteoversikt, produkterI, sorter } from '@/lib/katalog/sporring'
import type { Produkt } from '@/lib/katalog/typer'
import { tilKort } from '@/lib/visning'

const GODT_BILDE = new Set(['hvit', 'transparent', 'flat'])

function representant(produkter: Produkt[]): Produkt | undefined {
  return produkter.find(
    (p) => p.lager.status !== 'utsolgt' && p.bilder[0] && GODT_BILDE.has(p.bilder[0].bakgrunn),
  )
}

export default async function Forside() {
  const katalog = await hentKatalog()

  const nisjeduft = UTVALGTE_NISJEDUFTER.map((slug) => katalog.produkter.find((p) => p.slug === slug))
    .filter((p): p is Produkt => Boolean(p) && p?.lager.status !== 'utsolgt')
    .map(tilKort)
  const nisjekategori = finnKategori(katalog, 'nisjeduft')

  const innganger: Inngang[] = INNGANGER.flatMap((i) => {
    const kategori = finnKategori(katalog, i.slug)
    if (!kategori) return []
    const produkter = sorter(produkterI(katalog, kategori.id), 'nyeste')
    if (produkter.length === 0) return []
    return [
      {
        navn: kategori.navn,
        href: `/kategori/${kategori.slug}`,
        antall: produkter.length,
        tekst: i.tekst,
        bilde: representant(produkter)?.bilder[0] ?? null,
      },
    ]
  })

  const noter: Notegruppe[] = noteoversikt(katalog, 3)
    .slice(0, 8)
    .map(({ note, antall }) => ({
      note,
      antall,
      produkter: sorter(
        katalog.produkter.filter((p) => harNote(p, note)),
        'nyeste',
      )
        .slice(0, 4)
        .map(tilKort),
    }))

  const merker = katalog.merker
    .filter((m) => m.antall > 0)
    .map((m) => ({ navn: m.navn, href: `/merker/${m.slug}`, antall: m.antall }))

  return (
    <>
      <Hero antallMerker={merker.length} />
      <Innganger innganger={innganger} />
      {nisjeduft.length > 0 ? (
        <Nisjeduft
          produkter={nisjeduft}
          antall={nisjekategori ? produkterI(katalog, nisjekategori.id).length : 0}
        />
      ) : null}
      <Veiledning />
      {noter.length > 0 ? <Duftnoter grupper={noter} /> : null}
      <Merkevegg merker={merker} />
      <Hudpleieavdeling />
      <Besok />
    </>
  )
}
