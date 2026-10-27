import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Innholdsside } from '@/components/innhold/innholdsside'
import { Sidetekst } from '@/components/innhold/sidetekst'
import { hentSide } from '@/lib/woocommerce/innhold'

export const metadata: Metadata = {
  title: 'Frakt og levering',
  alternates: { canonical: '/frakt-levering/' },
}

/** Reginas egen tekst fra nettbutikken (data/pages.json, hentet med scripts/refresh_from_store.py). */
export default async function Side() {
  const side = await hentSide('frakt-levering')
  if (!side) notFound()
  return (
    <Innholdsside tittel="Frakt og levering" kicker="Kundeservice">
      <Sidetekst side={side} tittel={side.title} />
    </Innholdsside>
  )
}
