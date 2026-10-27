import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Innholdsside } from '@/components/innhold/innholdsside'
import { Kundeservicemeny } from '@/components/innhold/kundeservicemeny'
import { Sidetekst } from '@/components/innhold/sidetekst'
import { BUTIKK } from '@/content/butikk'
import { hentSide } from '@/lib/woocommerce/innhold'

export const metadata: Metadata = { title: 'Personvern', alternates: { canonical: '/personvern/' } }

/** Informasjonskapsler nettbutikken faktisk setter (src/lib/kurv, src/components/layout/samtykke.tsx). */
const KAPSLER = [
  {
    navn: 'regina_kurv',
    formaal: 'Husker handlekurven din (nøkkel til handlekurven i WooCommerce).',
    type: 'Nødvendig',
    varighet: '48 timer',
  },
  {
    navn: 'regina_kurv_lokal',
    formaal: 'Husker handlekurven i forhåndsvisningen av nettbutikken.',
    type: 'Nødvendig',
    varighet: '30 dager',
  },
  {
    navn: 'regina_samtykke',
    formaal: 'Husker valget ditt om informasjonskapsler.',
    type: 'Nødvendig',
    varighet: '180 dager',
  },
]
const ANALYSE = [
  {
    navn: '_ga, _ga_*',
    formaal: 'Anonym besøksstatistikk (Google Analytics 4).',
    type: 'Statistikk – bare med samtykke',
    varighet: 'Inntil 2 år',
  },
]

export default async function Personvern() {
  const side = await hentSide('personvernerklaering')
  if (!side) notFound()
  const kapsler = process.env.NEXT_PUBLIC_GA4_ID ? [...KAPSLER, ...ANALYSE] : KAPSLER
  return (
    <Innholdsside
      redaksjonell
      tekstkolonne
      marg={<Kundeservicemeny aktiv="/personvern/" />}
      tittel="Personvern"
      kicker="Personvernerklæring"
    >
      <Sidetekst side={side} tittel="Personvernerklæring" />
      <section id="informasjonskapsler" className="mt-16 max-w-3xl scroll-mt-40">
        <h2 className="text-3xl">Informasjonskapsler i nettbutikken</h2>
        <p className="mt-4 text-[1.0625rem]">
          Nettbutikken bruker bare informasjonskapslene i tabellen. Nødvendige informasjonskapsler brukes
          alltid, fordi handlekurven ikke virker uten dem. Statistikk brukes bare hvis du sier ja, og du kan
          endre valget når som helst under «Informasjonskapsler» nederst på siden. Kassen og «Min konto»
          kjøres av WooCommerce, Vipps og Diller, som setter egne informasjonskapsler der.
        </p>
        {/* Tabellen kan rulles sideveis på smal skjerm; området må da kunne nås med tastaturet. */}
        <div
          className="mt-6 overflow-x-auto"
          tabIndex={0}
          role="region"
          aria-label="Informasjonskapsler i nettbutikken"
        >
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-sand-200">
                <th className="py-2 pr-4 font-semibold">Navn</th>
                <th className="py-2 pr-4 font-semibold">Formål</th>
                <th className="py-2 pr-4 font-semibold">Type</th>
                <th className="py-2 font-semibold">Varighet</th>
              </tr>
            </thead>
            <tbody>
              {kapsler.map((k) => (
                <tr key={k.navn} className="border-b border-sand-200 align-top">
                  <td className="py-2 pr-4 font-mono text-xs">{k.navn}</td>
                  <td className="py-2 pr-4">{k.formaal}</td>
                  <td className="py-2 pr-4">{k.type}</td>
                  <td className="py-2">{k.varighet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-sm text-sand-ink">
          Spørsmål om personvern:{' '}
          <a href={`mailto:${BUTIKK.epost}`} className="text-regina-pink-strong underline">
            {BUTIKK.epost}
          </a>
        </p>
      </section>
    </Innholdsside>
  )
}
