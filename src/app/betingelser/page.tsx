import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Innholdsside } from '@/components/innhold/innholdsside'
import { Sidetekst } from '@/components/innhold/sidetekst'
import { hentSide } from '@/lib/woocommerce/innhold'

export const metadata: Metadata = {
  title: 'Kjøpsvilkår',
  alternates: { canonical: '/betingelser/' },
}

/** Reginas egen tekst fra nettbutikken (data/pages.json, hentet med scripts/refresh_from_store.py). */
export default async function Side() {
  const side = await hentSide('betingelser')
  if (!side) notFound()
  return (
    <Innholdsside tittel="Kjøpsvilkår" kicker="Kundeservice">
      <Sidetekst side={side} tittel={side.title} />
    </Innholdsside>
  )
}
