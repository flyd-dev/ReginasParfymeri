// Bygget etter «Ecommerce Category Page» (Mohammad Shehadeh / Hirael, MIT) på 21st.dev – https://21st.dev/@mohammadshehadeh/components/ecommerce-04. Egen kode; ingen kode er kopiert.
//
// Fra forbildet: på små skjermer ligger filtrene i et ark nedenfra med tittel og kort forklaring, og en fast bunn
// med «fjern alle» og en primærknapp som viser antall treff.

'use client'

import { SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { antallTekst } from '@/lib/format'

/** Filtrene i et ark på mobil. Innholdet er de samme lenkene som på stor skjerm. */
export function Filterskuff({
  antallAktive,
  treff,
  nullstill,
  children,
}: {
  antallAktive: number
  treff: number
  /** Adressen uten filtre. */
  nullstill: string
  children: ReactNode
}) {
  // Arket blir stående åpent mens man velger; hvert valg er en lenke, og antallet oppdateres fra serveren.
  const [apen, setApen] = useState(false)
  return (
    <Sheet open={apen} onOpenChange={setApen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="bg-paper lg:hidden">
          <SlidersHorizontal aria-hidden />
          Filtrer{antallAktive > 0 ? ` (${antallAktive})` : ''}
        </Button>
      </SheetTrigger>
      {/* Hvitt ark med runde hjørner øverst (ui/sheet); bunnen holder seg over hjemmelinjen (safe area). */}
      <SheetContent side="bottom" className="max-h-[88dvh] gap-0 border-sand-200 bg-paper p-0">
        <SheetHeader className="gap-1 border-b border-sand-200 px-5 pt-6 pb-4">
          <SheetTitle className="text-2xl">Filtrer</SheetTitle>
          <SheetDescription className="text-base text-sand-ink">
            {antallTekst(treff, 'produkt', 'produkter')} – antallet oppdateres for hvert valg.
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">{children}</div>
        <div className="flex gap-3 border-t border-sand-200 bg-paper px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {antallAktive > 0 && (
            <Button asChild variant="outline" size="lg" className="bg-paper">
              <Link href={nullstill} scroll={false} rel="nofollow">
                Fjern alle
              </Link>
            </Button>
          )}
          <Button size="lg" className="flex-1" onClick={() => setApen(false)}>
            Vis {antallTekst(treff, 'produkt', 'produkter')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
