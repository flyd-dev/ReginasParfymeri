// Bygget etter «Newsletter Footer» (Méschac Irung, Tailark, MIT) på 21st.dev – https://21st.dev/@meschacirung/components/footer-4. Egen kode; ingen kode er kopiert.
// Nyhetsbrevfeltet er byttet med kundeklubben i Diller: Regina har ingen nyhetsbrevtjeneste (src/content/kundeklubb.ts).

import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BUTIKK, HISTORIE } from '@/content/butikk'
import { dillerInnmelding, KUNDEKLUBB } from '@/content/kundeklubb'
import { hentButikkinfo } from '@/lib/woocommerce/innhold'
import { BUTIKKEN, KUNDESERVICE } from './lenker'
import { Logo } from './logo'
import { Samtykkelenke } from './samtykke'

// Sekundærtekst og lenker i sand-ink-deep på sand-100; peker gir plomme og understrek (rosa holder ikke her).
const lenke =
  'text-sand-ink-deep underline-offset-4 transition-colors duration-(--dur-fast) hover:text-regina-plum hover:underline'
const overskrift = 'font-sans text-base font-medium'
// Lenkene ligger på én linje som brytes på mobil, og i kolonne fra md.
const liste = 'mt-4 flex flex-wrap gap-x-5 gap-y-2.5 md:flex-col md:gap-y-3'

export async function Footer() {
  const info = await hentButikkinfo()
  const innmelding = dillerInnmelding()
  return (
    <footer className="mt-24 border-t border-sand-200 bg-sand-100">
      <div className="mx-auto max-w-screen-2xl px-4 md:px-6">
        <div className="flex flex-col gap-10 py-14 md:flex-row md:items-end md:justify-between md:gap-16">
          <div>
            <Logo className="block h-16 w-fit" />
            <p className="mt-6 text-sand-ink-deep">
              {BUTIKK.adresse.gate}, {BUTIKK.adresse.postnr} {BUTIKK.adresse.sted}
            </p>
            <ul className="mt-4 flex gap-6" aria-label="Regina i sosiale medier">
              <li>
                <a href={BUTIKK.instagram.lenke} className={`${lenke} inline-flex items-center gap-1`}>
                  Instagram
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </a>
              </li>
              <li>
                <a href={BUTIKK.facebook.lenke} className={`${lenke} inline-flex items-center gap-1`}>
                  Facebook
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </a>
              </li>
            </ul>
          </div>
          <p className="max-w-md font-heading text-2xl leading-snug md:text-right lg:text-3xl">
            Et av Norges eldste frittstående parfymerier – i familien siden{' '}
            <em className="text-regina-pink">{HISTORIE.grunnlagt}</em>.
          </p>
        </div>

        <div className="border-t-2 border-dotted border-sand-200" />

        <div className="grid gap-x-10 gap-y-12 py-14 md:grid-cols-3 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.5fr)]">
          <nav aria-label="Kundeservice">
            <h2 className={overskrift}>Kundeservice</h2>
            <ul className={liste}>
              {KUNDESERVICE.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={lenke}>
                    {l.navn}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Butikken">
            <h2 className={overskrift}>Regina</h2>
            <ul className={liste}>
              {BUTIKKEN.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={lenke}>
                    {l.navn}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <h2 className={overskrift}>Besøk oss</h2>
            <address className="mt-4 space-y-3 not-italic">
              <p>
                <a href={BUTIKK.telefon.lenke} className={lenke}>
                  Tlf. {BUTIKK.telefon.visning}
                </a>
              </p>
              <p>
                <a href={`mailto:${BUTIKK.epost}`} className={`${lenke} break-all`}>
                  {BUTIKK.epost}
                </a>
              </p>
            </address>
            {info?.bekreftet && info.apningstider.length > 0 && (
              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-sand-ink-deep">
                {info.apningstider.map((a) => (
                  <div key={a.dager} className="contents">
                    <dt>{a.dager}</dt>
                    <dd>{a.tid}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <section aria-labelledby="footer-kundeklubb" className="md:col-span-3 lg:col-span-1">
            <h2 id="footer-kundeklubb" className={overskrift}>
              {KUNDEKLUBB.navn}
            </h2>
            <p className="mt-4 max-w-md text-sand-ink-deep">
              {KUNDEKLUBB.drift} {KUNDEKLUBB.iKassen}
            </p>
            <Button asChild className="mt-5">
              {innmelding ? (
                <a href={innmelding} rel="noopener">
                  Meld deg inn
                  <ArrowUpRight data-icon="inline-end" aria-hidden />
                </a>
              ) : (
                <Link href="/kundeklubb/">Om kundeklubben</Link>
              )}
            </Button>
            {innmelding && <p className="mt-3 text-sm text-sand-ink-deep">{KUNDEKLUBB.hosDiller}</p>}
          </section>
        </div>
      </div>

      <div className="border-t border-sand-200">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-3 px-4 py-6 text-sm text-sand-ink-deep md:flex-row md:items-center md:justify-between md:px-6">
          <p>
            {BUTIKK.selskap} · Org.nr. {BUTIKK.orgnr} · Alle priser er inkl. mva.
          </p>
          <Samtykkelenke className={lenke} />
        </div>
      </div>
    </footer>
  )
}
