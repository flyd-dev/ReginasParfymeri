import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Innholdsside } from '@/components/innhold/innholdsside'
import { Sidetekst } from '@/components/innhold/sidetekst'
import { BILDER } from '@/content/bilder'
import { HISTORIE } from '@/content/butikk'
import { hentSide } from '@/lib/woocommerce/innhold'

export const metadata: Metadata = {
  title: 'Om oss',
  description:
    'Regina er et av Norges eldste frittstående parfymerier, i familien siden 1863. I dag drevet av Grethe Kongshavn, femte generasjon.',
  alternates: { canonical: '/om-oss/' },
}

export default async function OmOss() {
  const side = await hentSide('om-oss')
  if (!side) notFound()
  return (
    <Innholdsside tittel="Om oss" kicker={`Familiebedrift siden ${HISTORIE.grunnlagt}`}>
      <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
        <Sidetekst side={side} tittel="Om oss" stopp="Kontaktinformasjon" />
        <div className="space-y-6">
          <div className="relative aspect-[4/5] overflow-hidden bg-sand-100">
            <Image
              src={BILDER.medarbeidere.bilde}
              alt={BILDER.medarbeidere.alt}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
          <ol className="border-l border-sand-200">
            {HISTORIE.tidslinje.map((t) => (
              <li key={t.aar} className="relative pb-6 pl-6 last:pb-0">
                <span className="absolute top-2 -left-[5px] size-2.5 bg-regina-pink" aria-hidden />
                <p className="font-heading text-2xl">{t.aar}</p>
                <p className="text-sand-ink">{t.tekst}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Innholdsside>
  )
}
