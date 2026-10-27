'use client'

import { Menu } from 'lucide-react'
import Link from 'next/link'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { kategoriUrl } from '@/lib/lenker'
import type { Menypunkt } from '@/lib/meny'
import { SEKUNDAERLENKER } from './lenker'

export function Mobilmeny({ meny }: { meny: Menypunkt[] }) {
  return (
    <Sheet>
      <SheetTrigger
        className="-ml-2 inline-flex size-11 items-center justify-center lg:hidden"
        aria-label="Meny"
      >
        <Menu className="size-6" aria-hidden />
      </SheetTrigger>
      <SheetContent side="left" className="w-[88vw] max-w-sm gap-0 overflow-y-auto bg-sand-50 p-0">
        <SheetHeader className="border-b border-sand-200 px-5 py-4">
          <SheetTitle className="font-heading text-2xl font-medium">Meny</SheetTitle>
        </SheetHeader>
        <nav aria-label="Hovedmeny" className="px-5 pb-8">
          <Accordion type="multiple">
            {meny.map((punkt) => (
              <AccordionItem
                key={punkt.sti.join('/')}
                value={punkt.sti.join('/')}
                className="border-sand-200"
              >
                <AccordionTrigger className="py-4 text-base font-medium hover:no-underline">
                  {punkt.navn}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1 pb-2">
                    <li>
                      <SheetClose asChild>
                        <Link
                          href={kategoriUrl(punkt.sti)}
                          className="block py-2 font-medium text-regina-pink-strong"
                        >
                          Alt i {punkt.navn.toLocaleLowerCase('nb')} ({punkt.antall})
                        </Link>
                      </SheetClose>
                    </li>
                    {punkt.barn.map((u) => (
                      <li key={u.sti.join('/')}>
                        <SheetClose asChild>
                          <Link href={kategoriUrl(u.sti)} className="block py-2">
                            {u.navn}
                          </Link>
                        </SheetClose>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <ul className="mt-6 space-y-1">
            {SEKUNDAERLENKER.map((l) => (
              <li key={l.href}>
                <SheetClose asChild>
                  <Link href={l.href} className="block py-2.5">
                    {l.navn}
                  </Link>
                </SheetClose>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
