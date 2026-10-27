import { Phone } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { Innholdsside } from '@/components/innhold/innholdsside'
import { Button } from '@/components/ui/button'
import { BILDER } from '@/content/bilder'
import { BEHANDLINGER, BUTIKK } from '@/content/butikk'

export const metadata: Metadata = {
  title: 'Behandlinger',
  description:
    'Hudpleieavdelingen i andre etasje hos Regina i Haugesund tilbyr behandlinger. Bestill time på nett.',
  alternates: { canonical: '/behandlinger/' },
}

/** Behandlingslisten og prisene ligger i timebestillingen (ledigtime.no) – de skrives ikke av her. */
export default function Behandlinger() {
  return (
    <Innholdsside
      tittel="Behandlinger"
      kicker={`Hudpleieavdelingen · ${BEHANDLINGER.etasje}`}
      ingress={<p>{BEHANDLINGER.tekst}</p>}
    >
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <div>
          <p className="max-w-lg text-[1.0625rem] leading-relaxed">
            Se behandlingene, prisene og ledige timer i timebestillingen, eller ring oss, så hjelper vi deg å
            finne en behandling som passer.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href={BEHANDLINGER.timebestilling} rel="noopener">
                Bestill time
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={BUTIKK.telefon.lenke}>
                <Phone aria-hidden /> {BUTIKK.telefon.visning}
              </a>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative col-span-2 aspect-[3/2] overflow-hidden bg-sand-100">
            <Image
              src={BILDER.behandlingsrom.bilde}
              alt={BILDER.behandlingsrom.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="relative col-span-2 aspect-[3/2] overflow-hidden bg-sand-100">
            <Image
              src={BILDER.salong.bilde}
              alt={BILDER.salong.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </Innholdsside>
  )
}
