import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function IkkeFunnet() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center md:py-32">
      <p className="text-sm tracking-[0.2em] text-sand-ink uppercase">404</p>
      <h1 className="mt-3 text-4xl md:text-6xl">Vi fant ikke siden</h1>
      <p className="mt-5 text-lg text-sand-ink">
        Varen kan være utgått, eller adressen har endret seg. Prøv søket, eller se nisjeduftene våre.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/sok/">Søk i nettbutikken</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Til forsiden</Link>
        </Button>
      </div>
    </div>
  )
}
