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
        <div className="self-start border border-sand-200 bg-paper p-8">
          <h2 className="text-2xl">Bli medlem</h2>
          {innmelding ? (
            <>
              <p className="mt-3 text-sand-ink">Innmeldingen skjer hos Diller.</p>
              <Button asChild size="lg" className="mt-6">
                <a href={innmelding} rel="noopener">
                  Meld deg inn
                </a>
              </Button>
            </>
          ) : (
            <>
              <p className="mt-3 text-sand-ink">Kryss av for kundeklubben i kassen når du handler.</p>
              <Button asChild size="lg" variant="outline" className="mt-6">
                <Link href="/produktkategori/duft/nisjeduft/">Se nisjeduft</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </Innholdsside>
  )
}
