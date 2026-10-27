import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Innholdsside } from '@/components/innhold/innholdsside'
import { Kundeservicemeny } from '@/components/innhold/kundeservicemeny'
import { Sidetekst } from '@/components/innhold/sidetekst'
import { hentSide } from '@/lib/woocommerce/innhold'

export const metadata: Metadata = {
  title: 'Angrerett og retur',
  alternates: { canonical: '/angrerett-og-retur/' },
}

/** Reginas egen tekst fra nettbutikken (data/pages.json, hentet med scripts/refresh_from_store.py). */
export default async function Side() {
  const side = await hentSide('angrerett-og-retur')
  if (!side) notFound()
  return (
    <Innholdsside
      redaksjonell
      tekstkolonne
      marg={<Kundeservicemeny aktiv="/angrerett-og-retur/" />}
      tittel="Angrerett og retur"
      kicker="Kundeservice"
    >
      <Sidetekst side={side} tittel={side.title} />
    </Innholdsside>
  )
}
