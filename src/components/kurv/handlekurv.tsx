'use client'

import { X } from 'lucide-react'
import Link from 'next/link'
import { Produktbilde } from '@/components/produkt/produktbilde'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { kroner } from '@/lib/format'
import { produktUrl } from '@/lib/lenker'
import type { Kurv } from '@/lib/kurv/typer'
import { Antallvelger } from './antallvelger'
import { useKurv } from './kurv-provider'
import { Kurvmeldinger } from './kurvmeldinger'

export function Kurvlinjer({ kurv, lukk }: { kurv: Kurv; lukk?: () => void }) {
  const { endreAntall, fjern, opptatt } = useKurv()
  return (
    <ul className="divide-y divide-sand-200">
      {kurv.linjer.map((l) => (
        <li key={l.nokkel} className="flex gap-4 py-4">
          <Link href={produktUrl(l.slug)} onClick={lukk} className="shrink-0" tabIndex={-1}>
            <Produktbilde src={l.bilde} alt="" sizes="88px" className="w-22" luft={false} />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {l.merke && <p className="text-xs tracking-[0.12em] text-sand-ink uppercase">{l.merke}</p>}
            <Link
              href={produktUrl(l.slug)}
              onClick={lukk}
              className="leading-snug hover:text-regina-pink-strong"
            >
              {l.navn}
            </Link>
            {l.valg && <p className="text-sm text-sand-ink">{l.valg}</p>}
            <div className="mt-auto flex items-end justify-between gap-2 pt-2">
              <Antallvelger
                antall={l.antall}
                maks={l.maks}
                navn={l.navn}
                deaktivert={opptatt}
                onEndre={(antall) => void endreAntall(l.nokkel, antall)}
              />
              <p className="text-right tabular-nums">
                {l.ordinaer && (
                  <span className="mr-2 text-sm text-sand-ink line-through">
                    {kroner(l.ordinaer * l.antall)}
                  </span>
                )}
                {kroner(l.pris * l.antall)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void fjern(l.nokkel)}
            disabled={opptatt}
            className="-mt-1 -mr-2 grid size-9 shrink-0 place-items-center text-sand-ink hover:text-regina-plum"
            aria-label={`Fjern ${l.navn}`}
          >
            <X className="size-4" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  )
}

export function Handlekurv() {
  const { kurv, apen, setApen } = useKurv()
  const tom = !kurv || kurv.linjer.length === 0
  return (
    <Sheet open={apen} onOpenChange={setApen}>
      <SheetContent side="right" className="w-full gap-0 bg-paper p-0 sm:max-w-md">
        <SheetHeader className="border-b border-sand-200 px-6 py-5">
          <SheetTitle className="font-heading text-2xl font-medium">
            Handlekurv{kurv && kurv.antall > 0 ? ` (${kurv.antall})` : ''}
          </SheetTitle>
          <SheetDescription className="sr-only">Varene du har lagt i handlekurven</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6">
          {kurv && kurv.meldinger.length > 0 && (
            <div className="pt-4">
              <Kurvmeldinger meldinger={kurv.meldinger} />
            </div>
          )}
          {tom ? (
            <div className="py-12 text-center">
              <p className="font-heading text-xl">Handlekurven er tom</p>
              <p className="mt-2 text-sand-ink">Kanskje du finner noe blant nisjeduftene?</p>
              <Button asChild variant="outline" className="mt-6" onClick={() => setApen(false)}>
                <Link href="/produktkategori/duft/nisjeduft/">Se nisjeduft</Link>
              </Button>
            </div>
          ) : (
            <Kurvlinjer kurv={kurv} lukk={() => setApen(false)} />
          )}
        </div>
        {!tom && (
          <SheetFooter className="gap-3 border-t border-sand-200 px-6 py-5">
            <div className="flex items-baseline justify-between">
              <span>Delsum</span>
              <span className="text-lg tabular-nums">{kroner(kurv.delsum)}</span>
            </div>
            <p className="text-sm text-sand-ink">
              Frakt og eventuelle rabatter beregnes i kassen. Prisene er inkl. mva.
            </p>
            <form action="/api/kurv/til-kassen/" method="post">
              <Button type="submit" size="lg" className="w-full">
                Gå til kassen
              </Button>
            </form>
            <Button variant="ghost" className="w-full" onClick={() => setApen(false)}>
              Fortsett å handle
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
