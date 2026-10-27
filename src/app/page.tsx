import { Bestselgerfaner } from '@/components/forside/bestselgere'
import { Hero } from '@/components/forside/hero'
import { Merkebaand } from '@/components/forside/merkebaand'
import {
  BesokButikken,
  Behandlinger,
  Historien,
  Kategoriinnganger,
  Kundeklubb,
  Nisjeduft,
  Seksjonstittel,
  type Inngang,
} from '@/components/forside/seksjoner'
import { Produktkort } from '@/components/produkt/produktkort'
import { Produktrad, Produktradelement } from '@/components/produkt/produktrad'
import { BILDER } from '@/content/bilder'
import { NISJE } from '@/content/butikk'
import { bestselgere, finnMerke, nyeste, produkterIKategori } from '@/lib/katalog/sporring'
import { lagMeny } from '@/lib/meny'
import { butikkJsonLd, somScript } from '@/lib/seo/jsonld'
import { naa } from '@/lib/tid'
import { hentKatalog } from '@/lib/woocommerce'
import { hentButikkinfo } from '@/lib/woocommerce/innhold'
import type { Merke, Produkt } from '@/lib/woocommerce/typer'

// Nyheter, bestselgere og lager endres; forsiden bygges på nytt hver time (og ved webhook).
export const revalidate = 3600

/** Fanene under «Bestselgere». Kategoriene er valgt av Flyd; rekkefølgen i hver er WooCommerces egen. */
const BESTSELGERFANER = [
  { id: 'nisjeduft', navn: 'Nisjeduft', sti: ['duft', 'nisjeduft'] },
  { id: 'ansiktspleie', navn: 'Ansiktspleie', sti: ['hudpleie', 'ansiktspleie'] },
  { id: 'makeup', navn: 'Makeup', sti: ['makeup'] },
]

export default async function Forside() {
  const [katalog, info] = await Promise.all([hentKatalog(), hentButikkinfo()])
  const tidspunkt = naa()
  const kort = (p: Produkt) => (
    <Produktradelement key={p.id}>
      <Produktkort
        produkt={p}
        naa={tidspunkt}
        sizes="(min-width: 1024px) 23vw, (min-width: 640px) 40vw, 62vw"
      />
    </Produktradelement>
  )

  const innganger: Inngang[] = lagMeny(katalog).map((m) => ({
    navn: m.navn,
    sti: m.sti,
    antall: m.antall,
    produkt: bestselgere(produkterIKategori(katalog, m.sti), 1)[0] ?? null,
  }))
  const nisjemerker = NISJE.merker
    .map((navn) =>
      katalog.merker.find((m) =>
        m.navn.toLocaleLowerCase('nb').startsWith(navn.toLocaleLowerCase('nb').split(' ')[0] ?? ''),
      ),
    )
    .filter((m): m is Merke => Boolean(m))
  const baandmerker = [...katalog.merker].sort((a, b) => b.antall - a.antall).slice(0, 16)
  const finnesMerke = (slug: string) => Boolean(finnMerke(katalog, slug))

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: somScript(butikkJsonLd()) }} />
      <Hero plakat={BILDER.fasade.bilde} plakatAlt={BILDER.fasade.alt} />
      <Merkebaand merker={baandmerker.filter((m) => finnesMerke(m.slug))} />

      <section className="mx-auto max-w-screen-2xl px-4 pt-20 md:px-6 md:pt-28" aria-labelledby="nytt-tittel">
        <Seksjonstittel
          id="nytt-tittel"
          kicker="Nyheter"
          tittel="Nytt i nettbutikken"
          lenke={{ href: '/nyheter/', tekst: 'Se alle nyheter' }}
        />
        <Produktrad tittel="Nytt i nettbutikken">{nyeste(katalog, 12).map(kort)}</Produktrad>
      </section>

      <Kategoriinnganger innganger={innganger} />

      <Nisjeduft merker={nisjemerker} />

      <section className="mx-auto max-w-screen-2xl px-4 py-20 md:px-6 md:py-28" aria-labelledby="best-tittel">
        <Seksjonstittel id="best-tittel" kicker="Mest kjøpt" tittel="Bestselgere" />
        <Bestselgerfaner
          faner={BESTSELGERFANER.map((f) => ({
            id: f.id,
            navn: f.navn,
            innhold: (
              <Produktrad tittel={`Bestselgere – ${f.navn}`}>
                {bestselgere(produkterIKategori(katalog, f.sti), 8).map(kort)}
              </Produktrad>
            ),
          }))}
        />
      </section>

      <Historien />
      <Behandlinger />
      <Kundeklubb />
      <BesokButikken info={info} />
    </>
  )
}
