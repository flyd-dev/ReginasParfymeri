import { Phone } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { Innholdsside } from '@/components/innhold/innholdsside'
import { Mediebilde } from '@/components/innhold/sidehero'
import { Button } from '@/components/ui/button'
import { BILDER } from '@/content/bilder'
import { BEHANDLINGER, BUTIKK } from '@/content/butikk'

export const metadata: Metadata = {
  title: 'Behandlinger',
  description:
    'Hudpleieavdelingen i andre etasje hos Regina i Haugesund tilbyr behandlinger. Bestill time på nett.',
  alternates: { canonical: '/behandlinger/' },
}

/**
 * Behandlingslisten og prisene ligger i timebestillingen (ledigtime.no) – de skrives ikke av her. Timebestillingen
 * står i en lys rosa boks med runde hjørner, med bildet innenfor kanten (R-32), som på forsiden.
 */
export default function Behandlinger() {
  return (
    <Innholdsside
      redaksjonell
      tittel="Behandlinger"
      kicker={`Hudpleieavdelingen hos ${BUTIKK.navn}`}
      overskrift={
        <>
          Behandlinger i <em className="text-regina-pink">andre etasje</em>
        </>
      }
      ingress={<p>{BEHANDLINGER.tekst}</p>}
      media={<Mediebilde foto={BILDER.behandlingsrom} utsnitt="50% 62%" />}
    >
      <div className="grid gap-2 rounded-3xl bg-regina-pink-50 p-2 lg:grid-cols-12">
        <section
          className="px-4 pt-8 pb-10 md:px-10 lg:col-span-5 lg:self-center lg:py-12"
          aria-labelledby="timebestilling"
        >
          <h2 id="timebestilling" className="text-3xl md:text-4xl">
            Bestill time
          </h2>
          <p className="mt-5 max-w-lg text-[1.0625rem] leading-relaxed">
            Se behandlingene, prisene og ledige timer i timebestillingen, eller ring oss, så hjelper vi deg å
            finne en behandling som passer.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href={BEHANDLINGER.timebestilling} rel="noopener">
                Bestill time
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-paper">
              <a href={BUTIKK.telefon.lenke}>
                <Phone aria-hidden /> {BUTIKK.telefon.visning}
              </a>
            </Button>
          </div>
        </section>
        <div className="avdekk relative aspect-[3/2] overflow-hidden rounded-2xl bg-sand-100 lg:col-span-7">
          <Image
            src={BILDER.salong.bilde}
            alt={BILDER.salong.alt}
            fill
            sizes="(min-width: 1536px) 850px, (min-width: 1024px) 56vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </Innholdsside>
  )
}
