import Link from 'next/link'
import { BUTIKK, HISTORIE } from '@/content/butikk'
import { hentButikkinfo } from '@/lib/woocommerce/innhold'
import { BUTIKKEN, KUNDESERVICE } from './lenker'
import { Logo } from './logo'
import { Samtykkelenke } from './samtykke'

export async function Footer() {
  const info = await hentButikkinfo()
  return (
    <footer className="mt-24 border-t border-sand-200 bg-sand-100">
      <div className="mx-auto grid max-w-screen-2xl gap-12 px-4 py-16 md:grid-cols-2 md:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo className="block h-20 w-fit" />
          <p className="mt-6 max-w-xs text-sand-ink-deep">
            Et av Norges eldste frittstående parfymerier – i familien siden {HISTORIE.grunnlagt}.
          </p>
        </div>
        <nav aria-label="Kundeservice">
          <h2 className="font-sans text-sm font-semibold tracking-[0.12em] uppercase">Kundeservice</h2>
          <ul className="mt-4 space-y-2.5">
            {KUNDESERVICE.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-regina-pink-strong hover:underline">
                  {l.navn}
                </Link>
              </li>
            ))}
            <li>
              <Samtykkelenke />
            </li>
          </ul>
        </nav>
        <nav aria-label="Butikken">
          <h2 className="font-sans text-sm font-semibold tracking-[0.12em] uppercase">Regina</h2>
          <ul className="mt-4 space-y-2.5">
            {BUTIKKEN.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-regina-pink-strong hover:underline">
                  {l.navn}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="font-sans text-sm font-semibold tracking-[0.12em] uppercase">Besøk oss</h2>
          <address className="mt-4 space-y-1 not-italic">
            <p>{BUTIKK.adresse.gate}</p>
            <p>
              {BUTIKK.adresse.postnr} {BUTIKK.adresse.sted}
            </p>
            <p className="pt-2">
              <a href={BUTIKK.telefon.lenke} className="hover:text-regina-pink-strong hover:underline">
                Tlf. {BUTIKK.telefon.visning}
              </a>
            </p>
            <p>
              <a
                href={`mailto:${BUTIKK.epost}`}
                className="break-all hover:text-regina-pink-strong hover:underline"
              >
                {BUTIKK.epost}
              </a>
            </p>
          </address>
          {info?.bekreftet && info.apningstider.length > 0 && (
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              {info.apningstider.map((a) => (
                <div key={a.dager} className="contents">
                  <dt>{a.dager}</dt>
                  <dd>{a.tid}</dd>
                </div>
              ))}
            </dl>
          )}
          <ul className="mt-5 flex gap-5 text-sm">
            <li>
              <a
                href={BUTIKK.instagram.lenke}
                className="underline-offset-4 hover:text-regina-pink-strong hover:underline"
              >
                Instagram {BUTIKK.instagram.navn}
              </a>
            </li>
            <li>
              <a
                href={BUTIKK.facebook.lenke}
                className="underline-offset-4 hover:text-regina-pink-strong hover:underline"
              >
                Facebook
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-sand-200">
        <p className="mx-auto max-w-screen-2xl px-4 py-6 text-sm text-sand-ink-deep md:px-6">
          {BUTIKK.selskap} · Org.nr. {BUTIKK.orgnr} · Alle priser er inkl. mva.
        </p>
      </div>
    </footer>
  )
}
