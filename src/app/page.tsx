import { Bestselgerfaner } from '@/components/forside/bestselgere'
import { Hero } from '@/components/forside/hero'
import { Merkebaand } from '@/components/forside/merkebaand'
import {
  BesokButikken,
  Behandlinger,
  Historien,
  Kategoriinnganger,
  Nisjeduft,
  Nisjemerker,
  Seksjonstittel,
  Veiledning,
} from '@/components/forside/seksjoner'
import { Produktkort } from '@/components/produkt/produktkort'
import { Produktrad, Produktradelement } from '@/components/produkt/produktrad'
import { BILDER } from '@/content/bilder'
import { FORSIDE } from '@/content/forside'
import {
  heroprodukt,
  innganger,
  nisjemerker,
  nyttINisjeduft,
  ovrigeKategorier,
  tilVisning,
  utstilling,
} from '@/lib/forside'
import { bestselgere, produkterIKategori } from '@/lib/katalog/sporring'
import { butikkJsonLd, somScript } from '@/lib/seo/jsonld'
import { naa } from '@/lib/tid'
import { hentKatalog } from '@/lib/woocommerce'
import { hentButikkinfo } from '@/lib/woocommerce/innhold'
import type { Produkt } from '@/lib/woocommerce/typer'

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
  const kort = (p: Produkt, stor = false) => (
    <Produktradelement key={p.id} stor={stor}>
      <Produktkort
        produkt={p}
        naa={tidspunkt}
        sizes={
          stor
            ? '(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 78vw'
            : '(min-width: 1024px) 23vw, (min-width: 640px) 40vw, 62vw'
        }
      />
    </Produktradelement>
  )

  const hero = heroprodukt(katalog)
  const foto = BILDER[FORSIDE.heroBilde]
  const baandmerker = [...katalog.merker].sort((a, b) => b.antall - a.antall).slice(0, 16)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: somScript(butikkJsonLd()) }} />
      <Hero foto={foto.bilde} fotoAlt={foto.alt} produkt={hero ? tilVisning(hero) : null} />
      <Merkebaand merker={baandmerker} />

      <section className="mx-auto max-w-screen-2xl px-4 py-20 md:px-6 md:py-28" aria-labelledby="nytt-tittel">
        <Seksjonstittel
          id="nytt-tittel"
          kicker="Sist lagt til"
          tittel="Nytt i nisjeduft"
          lenke={{ href: '/nyheter/', tekst: 'Se alle nyheter' }}
        />
        <Produktrad tittel="Nytt i nisjeduft">
          {nyttINisjeduft(katalog, 10).map((p) => kort(p, true))}
        </Produktrad>
      </section>

      <Kategoriinnganger innganger={innganger(katalog)} ovrige={ovrigeKategorier(katalog)} />

      <section className="mx-auto max-w-screen-2xl px-4 py-20 md:px-6 md:py-28" aria-labelledby="best-tittel">
        <Seksjonstittel id="best-tittel" kicker="Mest kjøpt" tittel="Bestselgere" />
        <Bestselgerfaner
          faner={BESTSELGERFANER.map((f) => ({
            id: f.id,
            navn: f.navn,
            innhold: (
              <Produktrad tittel={`Bestselgere – ${f.navn}`}>
                {bestselgere(produkterIKategori(katalog, f.sti), 8).map((p) => kort(p))}
              </Produktrad>
            ),
          }))}
        />
      </section>

      <Nisjeduft produkter={utstilling(katalog).map(tilVisning)} />
      <Nisjemerker merker={nisjemerker(katalog)} />
      <Veiledning />
      <Historien />
      <Behandlinger />
      <BesokButikken info={info} />
    </>
  )
}
