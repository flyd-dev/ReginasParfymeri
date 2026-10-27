import { Mail, Phone } from 'lucide-react'
import type { Metadata } from 'next'
import { Innholdsside } from '@/components/innhold/innholdsside'
import { Kart } from '@/components/innhold/kart'
import { BUTIKK } from '@/content/butikk'
import { hentButikkinfo } from '@/lib/woocommerce/innhold'

export const metadata: Metadata = {
  title: 'Kontakt',
  description: 'Regina Parfymeri, Haraldsgata 138, 5527 Haugesund. Telefon 948 97 061.',
  alternates: { canonical: '/kontakt/' },
}

const SEKSJONSTITTEL = 'font-sans text-sm font-semibold tracking-[0.12em] uppercase'

export default async function Kontakt() {
  const info = await hentButikkinfo()
  return (
    <Innholdsside
      redaksjonell
      tittel="Kontakt"
      kicker="Kontakt og veibeskrivelse"
      overskrift={
        <>
          Besøk oss i <em className="text-regina-pink">Haraldsgata</em>
        </>
      }
      ingress={<p>{BUTIKK.beliggenhet}.</p>}
      media={<Kart className="lg:aspect-[21/9]" />}
    >
      <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-12">
        <section className="border-t border-sand-200 pt-6 lg:col-span-4">
          <h2 className={SEKSJONSTITTEL}>Butikken</h2>
          <address className="mt-4 text-lg not-italic">
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
        <section className="border-t border-sand-200 pt-6 lg:col-span-4">
          <h2 className={SEKSJONSTITTEL}>Ring eller skriv</h2>
          <ul className="mt-4 space-y-3 text-lg">
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
        <section className="border-t border-sand-200 pt-6 lg:col-span-4">
          <h2 className={SEKSJONSTITTEL}>Firma</h2>
          <p className="mt-4 text-lg">{BUTIKK.selskap}</p>
          <p className="text-sand-ink">Org.nr. {BUTIKK.orgnr}</p>
        </section>
      </div>
    </Innholdsside>
  )
}
