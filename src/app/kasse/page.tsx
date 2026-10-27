import type { Metadata } from 'next'
import Link from 'next/link'
import { Innholdsside } from '@/components/innhold/innholdsside'
import { Kurvside } from '@/components/kurv/kurvside'
import { Button } from '@/components/ui/button'
import { kurvmodus } from '@/lib/kurv'

export const metadata: Metadata = { title: 'Kassen', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

/**
 * Prototypen (lokal kurv) har ingen betaling: kassen og «Min konto» kjøres av WooCommerce med Vipps Checkout
 * og Diller (docs/architecture.md). Med WooCommerce-kurv sendes kunden rett dit og ser aldri denne siden.
 */
export default function Kasse() {
  const lokal = kurvmodus() === 'lokal'
  return (
    <Innholdsside
      tittel="Kassen"
      ingress={
        lokal ? (
          <p>
            Dette er en forhåndsvisning av nettbutikken. Betaling er ikke koblet til, og ingen bestilling
            sendes. I den ferdige butikken går du herfra rett til WooCommerces kasse med Vipps.
          </p>
        ) : (
          <p>Vi sender deg til kassen.</p>
        )
      }
    >
      {lokal ? (
        <Kurvside />
      ) : (
        <form action="/api/kurv/til-kassen/" method="post">
          <Button type="submit" size="lg">
            Gå til kassen
          </Button>
        </form>
      )}
      <p className="mt-10">
        <Link href="/" className="text-regina-pink-strong underline underline-offset-4">
          Tilbake til forsiden
        </Link>
      </p>
    </Innholdsside>
  )
}
