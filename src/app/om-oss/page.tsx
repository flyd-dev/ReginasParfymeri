import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Innholdsside } from '@/components/innhold/innholdsside'
import { Mediebilde } from '@/components/innhold/sidehero'
import { Sidetekst } from '@/components/innhold/sidetekst'
import { Sitatpanel } from '@/components/innhold/sitatpanel'
import { Tidslinje, type Tidspunkt } from '@/components/innhold/tidslinje'
import { BILDER } from '@/content/bilder'
import { HISTORIE } from '@/content/butikk'
import { SITATER } from '@/content/sitater'
import { hentSide } from '@/lib/woocommerce/innhold'

export const metadata: Metadata = {
  title: 'Om oss',
  description:
    'Regina er et av Norges eldste frittstående parfymerier, i familien siden 1863. I dag drevet av Grethe Kongshavn, femte generasjon.',
  alternates: { canonical: '/om-oss/' },
}

/** Bare «I dag» har et bilde som viser punktet (butikken i Haraldsgata). Vi har ingen arkivbilder. */
const PUNKTER: Tidspunkt[] = HISTORIE.tidslinje.map((t) =>
  t.aar === 'I dag' ? { ...t, foto: BILDER.fasade } : t,
)

export default async function OmOss() {
  const side = await hentSide('om-oss')
  if (!side) notFound()
  return (
    <Innholdsside
      redaksjonell
      tittel="Om oss"
      kicker={`Familiebedrift i Haugesund siden ${HISTORIE.grunnlagt}`}
      // Reginas egne ord fra «Om oss»: «Velkommen til Regina – en moderne parfymeritradisjon …». Myk
      // bindestrek, så det lange ordet bare deles på de smaleste skjermene.
      overskrift={
        <>
          En moderne parfymeri{'­'}tradisjon med <em className="text-regina-pink">røtter</em> tilbake til
          1800-tallet
        </>
      }
      ingress={
        <p>Regina er et av Norges eldste frittstående parfymerier, drevet av femte generasjon i familien.</p>
      }
      media={<Mediebilde foto={BILDER.medarbeidere} utsnitt="50% 42%" />}
    >
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <Sidetekst side={side} tittel="Om oss" stopp="Kontaktinformasjon" />
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <div className="lg:sticky lg:top-40">
            <Sitatpanel
              sitater={SITATER}
              tittel="Med egne ord"
              ingress="Ordrett fra Reginas egne nettsider."
            />
          </div>
        </div>
      </div>
      <div className="mt-20 md:mt-28">
        <Tidslinje
          punkter={PUNKTER}
          kicker="Historien"
          tittel={
            <>
              Fem generasjoner i <em className="text-regina-pink">Haugesund</em>
            </>
          }
        />
      </div>
    </Innholdsside>
  )
}
