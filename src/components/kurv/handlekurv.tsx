// Bygget etter «Sheet with Scrollable Content» (ShadcnSpace, MIT) på 21st.dev – https://21st.dev/@shadcnspace/components/sheet-02. Egen kode; ingen kode er kopiert.
//
// Fra forbildet: skuff fra høyre med tittel og kort beskrivelse øverst, en lang midtdel som ruller for seg selv,
// og en fast bunn med primærknapp over en sekundærknapp i full bredde. Her er midtdelen varelinjene og bunnen
// delsum, fraktlinje, «Gå til kassen» (POST-skjema, se docs/architecture.md §5.2) og «Se handlekurven».
//
// Runde hjørner og rosa (R-32): miniatyrene har runde hjørner, antallsvelgeren er en pille, og bunnen med delsum
// og «Gå til kassen» står i en innfelt, lys rosa boks.
//
// Bevegelse: varelinjene kommer inn én etter én når skuffen åpnes (liste-inn.ts, etter «Animated List» – Dillion
// Verma, Magic UI, MIT), og antall, linjesum og delsum ruller når de endres (rulletall.tsx, etter «Number Flow» –
// Maxwell Barvian, MIT).

'use client'

import { ArrowRight, ShoppingBag, Store, Truck, X } from 'lucide-react'
import Link from 'next/link'
import { listeInn, plass } from '@/components/layout/liste-inn'
import { Produktbilde } from '@/components/produkt/produktbilde'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { FORDELER } from '@/content/butikk'
import { antallTekst, kroner } from '@/lib/format'
import { produktUrl } from '@/lib/lenker'
import type { Kurv } from '@/lib/kurv/typer'
import { Antallvelger } from './antallvelger'
import { useKurv } from './kurv-provider'
import { Kurvmeldinger } from './kurvmeldinger'
import { Rulletall } from './rulletall'

/**
 * Varelinjene – i skuffen og på handlekurvsiden. Med `inngang` kommer linjene inn én etter én (skuffen); på siden
 * står de der fra start.
 */
export function Kurvlinjer({ kurv, lukk, inngang }: { kurv: Kurv; lukk?: () => void; inngang?: boolean }) {
  const { endreAntall, fjern, opptatt } = useKurv()
  return (
    <ul className="divide-y divide-sand-200" aria-busy={opptatt || undefined}>
      {kurv.linjer.map((l, i) => (
        <li
          key={l.nokkel}
          className={`flex gap-4 py-5 ${inngang ? listeInn : ''}`}
          style={inngang ? plass(i + 2) : undefined}
        >
          {/* Bildet er en ekstra vei til samme side som navnet, derfor skjult for skjermlesere og tastatur. */}
          <Link href={produktUrl(l.slug)} onClick={lukk} className="shrink-0" tabIndex={-1} aria-hidden>
            <Produktbilde
              src={l.bilde}
              alt=""
              sizes="96px"
              className="w-20 rounded-lg border border-sand-200 sm:w-24 sm:rounded-xl"
              luft={false}
            />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {l.merke && <p className="text-xs tracking-[0.14em] text-sand-ink uppercase">{l.merke}</p>}
                <Link
                  href={produktUrl(l.slug)}
                  onClick={lukk}
                  className="mt-1 block leading-snug transition-colors duration-(--dur-fast) hover:text-regina-pink-strong"
                >
                  {l.navn}
                </Link>
                {l.valg && <p className="mt-1 text-sm text-sand-ink">{l.valg}</p>}
              </div>
              <p className="shrink-0 text-right leading-snug tabular-nums">
                {l.ordinaer && (
                  <span className="block text-sm text-sand-ink line-through">
                    <span className="sr-only">Før </span>
                    {/* Gjennomstrekingen følger ikke med inn i tallet av seg selv (inline-grid). */}
                    <Rulletall verdi={l.ordinaer * l.antall} vis={kroner} className="line-through" />
                  </span>
                )}
                <Rulletall verdi={l.pris * l.antall} vis={kroner} className="font-medium" />
              </p>
            </div>
            <div className="mt-auto flex items-center gap-4 pt-3">
              <Antallvelger
                antall={l.antall}
                maks={l.maks}
                navn={l.navn}
                deaktivert={opptatt}
                onEndre={(antall) => void endreAntall(l.nokkel, antall)}
              />
              <button
                type="button"
                onClick={() => void fjern(l.nokkel)}
                disabled={opptatt}
                className="inline-flex h-11 items-center px-1 text-sand-ink underline underline-offset-4 transition-[color,scale] duration-(--dur-fast) hover:text-regina-plum active:scale-95 disabled:opacity-50"
              >
                Fjern<span className="sr-only"> {l.navn}</span>
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * Delsum, frakt og «Gå til kassen» – bunnen i skuffen og oppsummeringen på handlekurvsiden. Står på lys rosa flate
 * (R-32), derfor sekundærtekst i sand-ink-deep.
 */
export function Kassedel({ kurv }: { kurv: Kurv }) {
  return (
    <div>
      <dl className="flex items-baseline justify-between gap-4">
        <dt>
          Delsum <span className="text-sand-ink-deep">({antallTekst(kurv.antall, 'vare', 'varer')})</span>
        </dt>
        <dd className="text-xl font-medium tabular-nums">
          <Rulletall verdi={kurv.delsum} vis={kroner} />
        </dd>
      </dl>
      <ul className="mt-3 space-y-1.5 text-sm text-sand-ink-deep">
        <li className="flex gap-2.5">
          <Truck className="mt-0.5 size-4 shrink-0" aria-hidden />
          {/* Fraktprisen settes av WooCommerce i kassen – den gjettes ikke her. */}
          Frakt og eventuelle rabatter beregnes i kassen. Prisene er inkl. mva.
        </li>
        <li className="flex gap-2.5">
          <Store className="mt-0.5 size-4 shrink-0" aria-hidden />
          {FORDELER[1]}
        </li>
      </ul>
      {/* Et skjema, ikke en lenke: forhåndslasting skal aldri treffe overføringen (architecture.md §5.2). */}
      <form action="/api/kurv/til-kassen/" method="post" className="mt-5">
        <Button type="submit" size="lg" className="w-full">
          Gå til kassen
          <ArrowRight aria-hidden />
        </Button>
      </form>
    </div>
  )
}

/** Varsler (sonner) ligger utenfor skuffen; et klikk der skal ikke lukke den. */
function erVarsel(mal: EventTarget | null): boolean {
  return mal instanceof Element && mal.closest('[data-sonner-toaster]') !== null
}

export function Handlekurv() {
  const { kurv, apen, setApen } = useKurv()
  const tom = !kurv || kurv.linjer.length === 0
  const lukk = () => setApen(false)
  return (
    <Sheet open={apen} onOpenChange={setApen}>
      <SheetContent
        side="right"
        showCloseButton={false}
        // På mobil står en smal stripe av siden igjen til venstre, så de runde hjørnene (ui/sheet) ser tilsiktet ut.
        className="gap-0 bg-paper p-0 data-[side=right]:w-[calc(100%-0.75rem)] data-[side=right]:sm:max-w-md"
        onInteractOutside={(e) => {
          if (erVarsel(e.target)) e.preventDefault()
        }}
      >
        <SheetHeader className="flex-row items-start justify-between gap-4 border-b border-sand-200 px-5 pt-5 pb-4 sm:px-6">
          <div className="min-w-0">
            <SheetTitle className="text-2xl md:text-[1.75rem]">
              Handlekurv{kurv && kurv.antall > 0 ? ` (${kurv.antall})` : ''}
            </SheetTitle>
            <SheetDescription className="mt-1 text-base text-sand-ink">
              {tom
                ? 'Ingen varer ennå'
                : `${antallTekst(kurv.antall, 'vare', 'varer')} · ${kroner(kurv.delsum)}`}
            </SheetDescription>
          </div>
          <SheetClose asChild>
            <Button variant="ghost" className="-mt-1 -mr-3 shrink-0 px-3">
              <X aria-hidden />
              Lukk
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6">
          {kurv && kurv.meldinger.length > 0 && (
            <div className="pt-5">
              <Kurvmeldinger meldinger={kurv.meldinger} />
            </div>
          )}
          {tom ? (
            <div className="flex flex-col items-center py-14 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-regina-pink-50" aria-hidden>
                <ShoppingBag className="size-7 text-regina-pink" strokeWidth={1.5} />
              </span>
              <p className="mt-6 font-heading text-2xl">Handlekurven er tom</p>
              <p className="mt-2 max-w-xs text-sand-ink">Kanskje du finner noe blant nisjeduftene?</p>
              <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
                <Button asChild size="lg" onClick={lukk}>
                  <Link href="/produktkategori/duft/nisjeduft/">Se nisjeduft</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="bg-paper" onClick={lukk}>
                  <Link href="/merker/">Se alle merker</Link>
                </Button>
              </div>
            </div>
          ) : (
            <Kurvlinjer kurv={kurv} lukk={lukk} inngang />
          )}
        </div>

        {!tom && (
          <SheetFooter className="gap-0 bg-paper px-3 pt-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
            <div className="rounded-2xl bg-regina-pink-50 p-4 sm:p-5">
              <Kassedel kurv={kurv} />
              <Button asChild variant="outline" size="lg" className="mt-3 w-full bg-paper">
                <Link href="/handlekurv/" onClick={lukk}>
                  Se handlekurven
                </Link>
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
