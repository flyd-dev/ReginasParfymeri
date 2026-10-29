import Link from 'next/link'
import { Prikk } from '@/components/layout/prikk'
import { Button } from '@/components/ui/button'

/** Siden finnes ikke: en innfelt lys rosa boks med runde hjørner (R-32). Sekundærtekst i sand-ink-deep. */
export default function IkkeFunnet() {
  return (
    <div className="px-2 pt-4 md:px-4 md:pt-6">
      <div className="mx-auto max-w-screen-2xl rounded-3xl bg-regina-pink-50 px-6 py-20 text-center md:py-28">
        <div className="mx-auto max-w-2xl">
          <p className="inline-flex items-center gap-3 text-sm tracking-[0.2em] text-sand-ink-deep uppercase">
            <Prikk />
            404
          </p>
          <h1 className="mt-3 text-4xl md:text-6xl">Vi fant ikke siden</h1>
          <p className="mt-5 text-lg text-sand-ink-deep">
            Varen kan være utgått, eller adressen har endret seg. Prøv søket, eller se nisjeduftene våre.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/sok/">Søk i nettbutikken</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-paper">
              <Link href="/">Til forsiden</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
