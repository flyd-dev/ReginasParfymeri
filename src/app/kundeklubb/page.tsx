import { ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Innholdsside } from '@/components/innhold/innholdsside'
import { Button } from '@/components/ui/button'
import { BUTIKK } from '@/content/butikk'
import { KUNDEKLUBB } from '@/content/kundeklubb'

export const metadata: Metadata = {
  title: 'Kundeklubb',
  description: 'Reginas kundeklubb – medlemskap og innmelding.',
  alternates: { canonical: '/kundeklubb/' },
}

export default function Kundeklubb() {
  const innmelding = process.env.NEXT_PUBLIC_DILLER_INNMELDING_URL
  return (
    <Innholdsside tittel="Kundeklubb" kicker="Reginas kundeklubb">
      <div className="grid max-w-5xl gap-12 lg:grid-cols-2">
        <div className="space-y-5 text-[1.0625rem] leading-relaxed">
          <p>Kundeklubben drives i Diller. Du kan melde deg inn når du handler i nettbutikken, i kassen.</p>
          {KUNDEKLUBB.fordeler.length > 0 && (
            <>
              <h2 className="pt-4 text-2xl">Fordeler som medlem</h2>
              <ul className="list-disc space-y-1 pl-5">
                {KUNDEKLUBB.fordeler.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </>
          )}
          <p>
            Har du spørsmål om medlemskapet, kan du ringe oss på{' '}
            <a href={BUTIKK.telefon.lenke} className="text-regina-pink-strong underline underline-offset-4">
              {BUTIKK.telefon.visning}
            </a>{' '}
            eller spørre i butikken.
          </p>
        </div>
        {/*
          Innmeldingen – bygget etter «Newsletter» (kevingirelli, MIT) på 21st.dev –
          https://21st.dev/@kevingirelli/components/newsletter. Egen kode; ingen kode er kopiert.
          Et lys rosa bånd med runde hjørner (R-32), tittel til venstre og handlingen til høyre. Regina har ingen nyhetsbrevtjeneste, så det er
          ingen e-postfelt: knappen går til Diller når lenken er satt, ellers skjer innmeldingen i kassen.
        */}
        <section
          aria-labelledby="bli-medlem"
          className="flex flex-col gap-6 rounded-3xl bg-regina-pink-50 px-6 py-8 sm:px-10 md:flex-row md:items-center md:justify-between md:gap-12 md:py-12 lg:col-span-2"
        >
          <div>
            <h2 id="bli-medlem" className="text-3xl md:text-4xl">
              {KUNDEKLUBB.tittel}
            </h2>
            <p className="mt-3 text-lg text-sand-ink-deep">
              {innmelding ? KUNDEKLUBB.hosDiller : KUNDEKLUBB.kryssAv}
            </p>
          </div>
          {innmelding ? (
            <Button asChild size="lg" className="w-full shrink-0 md:w-auto">
              <a href={innmelding} rel="noopener">
                Meld deg inn
                <ArrowUpRight data-icon="inline-end" aria-hidden />
              </a>
            </Button>
          ) : (
            <Button asChild size="lg" variant="outline" className="w-full shrink-0 bg-paper md:w-auto">
              <Link href="/produktkategori/duft/nisjeduft/">Se nisjeduft</Link>
            </Button>
          )}
        </section>
      </div>
    </Innholdsside>
  )
}
