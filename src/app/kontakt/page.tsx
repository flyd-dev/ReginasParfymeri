import { Mail, Phone } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { Innholdsside } from '@/components/innhold/innholdsside'
import { Kart } from '@/components/innhold/kart'
import { BILDER } from '@/content/bilder'
import { BUTIKK } from '@/content/butikk'
import { hentButikkinfo } from '@/lib/woocommerce/innhold'

export const metadata: Metadata = {
  title: 'Kontakt',
  description: 'Regina Parfymeri, Haraldsgata 138, 5527 Haugesund. Telefon 948 97 061.',
  alternates: { canonical: '/kontakt/' },
}

export default async function Kontakt() {
  const info = await hentButikkinfo()
  return (
    <Innholdsside tittel="Kontakt" kicker="Besøk oss" ingress={<p>{BUTIKK.beliggenhet}.</p>}>
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="space-y-10">
          <section>
            <h2 className="font-sans text-sm font-semibold tracking-[0.12em] uppercase">Butikken</h2>
            <address className="mt-3 text-lg not-italic">
              {BUTIKK.navn}
              <br />
              {BUTIKK.adresse.gate}
              <br />
              {BUTIKK.adresse.postnr} {BUTIKK.adresse.sted}
            </address>
            {info?.bekreftet && info.apningstider.length > 0 ? (
              <dl className="mt-5 grid max-w-xs grid-cols-[auto_1fr] gap-x-6 gap-y-1">
                {info.apningstider.map((a) => (
                  <div key={a.dager} className="contents">
                    <dt>{a.dager}</dt>
                    <dd>{a.tid}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </section>
          <section>
            <h2 className="font-sans text-sm font-semibold tracking-[0.12em] uppercase">Ring eller skriv</h2>
            <ul className="mt-3 space-y-3 text-lg">
              <li>
                <a
                  href={BUTIKK.telefon.lenke}
                  className="inline-flex items-center gap-3 hover:text-regina-pink-strong"
                >
                  <Phone className="size-5" aria-hidden /> {BUTIKK.telefon.visning}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${BUTIKK.epost}`}
                  className="inline-flex items-center gap-3 break-all hover:text-regina-pink-strong"
                >
                  <Mail className="size-5" aria-hidden /> {BUTIKK.epost}
                </a>
              </li>
            </ul>
          </section>
          <section>
            <h2 className="font-sans text-sm font-semibold tracking-[0.12em] uppercase">Firma</h2>
            <p className="mt-3 text-sand-ink">
              {BUTIKK.selskap} · Org.nr. {BUTIKK.orgnr}
            </p>
          </section>
        </div>
        <div className="space-y-6">
          <Kart lenke={BUTIKK.kart} />
          <div className="relative aspect-[3/2] overflow-hidden bg-sand-100">
            <Image
              src={BILDER.fasade.bilde}
              alt={BILDER.fasade.alt}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </Innholdsside>
  )
}
