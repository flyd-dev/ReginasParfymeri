// Strukturerte data (schema.org) for produkter og butikken. Bare fakta fra katalogen og src/content/butikk.ts.

import { BUTIKK } from '@/content/butikk'
import { desimalkroner } from '@/lib/format'
import { produktUrl } from '@/lib/lenker'
import type { Produkt } from '@/lib/woocommerce/typer'
import { nettstedUrl } from './nettsted'

const tilgjengelighet = (p: { lager: { status: string } }) =>
  p.lager.status === 'utsolgt' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock'

export function produktJsonLd(p: Produkt) {
  const url = `${nettstedUrl()}${produktUrl(p.slug)}`
  const gyldige = p.varianter.filter((v) => v.duplikatAv === null)
  const offers =
    p.type === 'variabel' && gyldige.length > 0
      ? {
          '@type': 'AggregateOffer',
          priceCurrency: 'NOK',
          lowPrice: desimalkroner(Math.min(...gyldige.map((v) => v.pris.pris))),
          highPrice: desimalkroner(Math.max(...gyldige.map((v) => v.pris.pris))),
          offerCount: gyldige.length,
          availability: tilgjengelighet(p),
          offers: gyldige.map((v) => ({
            '@type': 'Offer',
            sku: v.sku || undefined,
            price: desimalkroner(v.pris.pris),
            priceCurrency: 'NOK',
            availability: tilgjengelighet(v),
            url,
          })),
        }
      : {
          '@type': 'Offer',
          price: desimalkroner(p.pris.pris),
          priceCurrency: 'NOK',
          availability: tilgjengelighet(p),
          url,
          seller: { '@type': 'Organization', name: BUTIKK.navn },
        }
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: [p.merke?.navn, p.visningsnavn].filter(Boolean).join(' '),
    image: p.bilder.map((b) => b.src),
    description: p.beskrivelse ? p.beskrivelse.slice(0, 5000) : undefined,
    sku: p.sku || undefined,
    brand: p.merke ? { '@type': 'Brand', name: p.merke.navn } : undefined,
    category: p.hovedkategori?.navn,
    url,
    offers,
  }
}

export function butikkJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: BUTIKK.navn,
    legalName: BUTIKK.selskap,
    url: nettstedUrl(),
    telephone: `+47 ${BUTIKK.telefon.visning}`,
    email: BUTIKK.epost,
    foundingDate: '1863',
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUTIKK.adresse.gate,
      postalCode: BUTIKK.adresse.postnr,
      addressLocality: BUTIKK.adresse.sted,
      addressCountry: 'NO',
    },
    sameAs: [BUTIKK.instagram.lenke, BUTIKK.facebook.lenke],
  }
}

/** JSON i <script>: «<» escapes, så innhold aldri kan avslutte taggen. */
export function somScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
