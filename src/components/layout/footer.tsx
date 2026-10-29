// Bygget etter «Newsletter Footer» (Méschac Irung, Tailark, MIT) på 21st.dev – https://21st.dev/@meschacirung/components/footer-4. Egen kode; ingen kode er kopiert.
// Nyhetsbrevfeltet er byttet med kundeklubben i Diller: Regina har ingen nyhetsbrevtjeneste (src/content/kundeklubb.ts).
// Lenkene i listene ruller ved peker (rulletekst.tsx, etter «Text Roll» – Julien Thibeaut, Motion Primitives, MIT).

import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BUTIKK, HISTORIE } from '@/content/butikk'
import { dillerInnmelding, KUNDEKLUBB } from '@/content/kundeklubb'
import { hentButikkinfo } from '@/lib/woocommerce/innhold'
import { BUTIKKEN, KUNDESERVICE } from './lenker'
import { Logo } from './logo'
import { Rulletekst } from './rulletekst'
import { Samtykkelenke } from './samtykke'

// Footeren er en innfelt plumboks med runde hjørner og luft mot kantene, som de mørke flatene på flyd.no (R-32). Den
// avslutter siden med en mørk flate. Lenker i sand-100, peker gir sand-50 og understrek.
const lenke =
  'text-sand-100 underline-offset-4 transition-colors duration-(--dur-fast) hover:text-sand-50 hover:underline'
// Lenker i listene: teksten ruller opp ved peker og fokus (Rulletekst). På mobil er hver lenke 44 px høy.
const rullelenke =
  'group/rull inline-flex min-h-11 items-center gap-1 text-sand-100 transition-colors duration-(--dur-fast) hover:text-sand-50 active:text-sand-50 md:min-h-0'
const pil =
  'size-3.5 transition-transform duration-(--dur-slow) ease-ut group-hover/rull:translate-x-0.5 group-hover/rull:-translate-y-0.5'
const overskrift = 'font-sans text-base font-medium'
// Lenkene ligger på én linje som brytes på mobil, og i kolonne fra md.
const liste = 'mt-2 flex flex-wrap gap-x-5 md:mt-4 md:flex-col md:gap-y-3'

export async function Footer() {
  const info = await hentButikkinfo()
  const innmelding = dillerInnmelding()
  return (
    <footer className="mt-24 px-2 pb-2 md:px-4 md:pb-4">
      <div className="rounded-3xl bg-regina-plum text-sand-50 [&_:focus-visible]:outline-sand-50">
        <div className="mx-auto max-w-screen-2xl px-5 md:px-8">
          <div className="flex flex-col gap-10 py-14 md:flex-row md:items-end md:justify-between md:gap-16">
            <div>
              <Logo className="block h-16 w-fit" />
              <p className="mt-6 text-sand-100">
                {BUTIKK.adresse.gate}, {BUTIKK.adresse.postnr} {BUTIKK.adresse.sted}
              </p>
              <ul className="mt-2 flex gap-6 md:mt-4" aria-label="Regina i sosiale medier">
                <li>
                  <a href={BUTIKK.instagram.lenke} className={rullelenke}>
                    <Rulletekst tekst="Instagram" />
                    <ArrowUpRight className={pil} aria-hidden />
                  </a>
                </li>
                <li>
                  <a href={BUTIKK.facebook.lenke} className={rullelenke}>
                    <Rulletekst tekst="Facebook" />
                    <ArrowUpRight className={pil} aria-hidden />
                  </a>
                </li>
              </ul>
            </div>
            <p className="max-w-md font-heading text-2xl leading-snug md:text-right lg:text-3xl">
              Et av Norges eldste frittstående parfymerier – i familien siden{' '}
              <em className="text-regina-pink">{HISTORIE.grunnlagt}</em>.
            </p>
          </div>

          <div className="border-t-2 border-dotted border-white/20" />

          <div className="grid gap-x-10 gap-y-12 py-14 md:grid-cols-3 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.5fr)]">
            <nav aria-label="Kundeservice">
              <h2 className={overskrift}>Kundeservice</h2>
              <ul className={liste}>
                {KUNDESERVICE.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={rullelenke}>
                      <Rulletekst tekst={l.navn} />
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
                    <Link href={l.href} className={rullelenke}>
                      <Rulletekst tekst={l.navn} />
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
                <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-sand-100">
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
              <p className="mt-4 max-w-md text-sand-100">
                {KUNDEKLUBB.drift} {KUNDEKLUBB.iKassen}
              </p>
              <Button asChild variant="rosa" className="mt-5">
                {innmelding ? (
                  <a href={innmelding} rel="noopener">
                    Meld deg inn
                    <ArrowUpRight data-icon="inline-end" aria-hidden />
                  </a>
                ) : (
                  <Link href="/kundeklubb/">Om kundeklubben</Link>
                )}
              </Button>
              {innmelding && <p className="mt-3 text-sm text-sand-100">{KUNDEKLUBB.hosDiller}</p>}
            </section>
          </div>
        </div>

        <div className="border-t border-white/15">
          <div className="mx-auto flex max-w-screen-2xl flex-col gap-3 px-5 py-6 text-sm text-sand-100 md:flex-row md:items-center md:justify-between md:px-8">
            <p>
              {BUTIKK.selskap} · Org.nr. {BUTIKK.orgnr} · Alle priser er inkl. mva.
            </p>
            <Samtykkelenke className={lenke} />
          </div>
        </div>
      </div>
    </footer>
  )
}
