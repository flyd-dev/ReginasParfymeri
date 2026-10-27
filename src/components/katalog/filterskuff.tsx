'use client'

import { SlidersHorizontal } from 'lucide-react'
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

/** Filtrene i en skuff på mobil. Innholdet er de samme lenkene som på stor skjerm. */
export function Filterskuff({
  antallAktive,
  treff,
  children,
}: {
  antallAktive: number
  treff: number
  children: ReactNode
}) {
  // Skuffen blir stående åpen mens man velger; hvert valg er en lenke, og antallet oppdateres fra serveren.
  const [apen, setApen] = useState(false)
  return (
    <Sheet open={apen} onOpenChange={setApen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="lg:hidden">
          <SlidersHorizontal aria-hidden />
          Filtrer{antallAktive > 0 ? ` (${antallAktive})` : ''}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[90vw] max-w-sm gap-0 bg-sand-50 p-0">
        <SheetHeader className="border-b border-sand-200 px-5 py-4">
          <SheetTitle className="font-heading text-2xl font-medium">Filtrer</SheetTitle>
          <SheetDescription>{treff} produkter</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5">{children}</div>
        <div className="border-t border-sand-200 p-4">
          <Button className="w-full" onClick={() => setApen(false)}>
            Vis {treff} produkter
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
