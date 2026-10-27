// Mobilutgaven av megamenyen (megameny.tsx), med samme oppsett: små kolonneoverskrifter og menypunkter med
// navn og en andrelinje fra kategoritreet – etter «Rich Navigation Menu» (shadcnui-blocks, MIT) på 21st.dev –
// https://21st.dev/@shadcnui-blocks/components/navigation-menu-06. Egen kode; ingen kode er kopiert.
'use client'

import { ArrowRight, Menu } from 'lucide-react'
import Link from 'next/link'
import { useId } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { kategoriUrl } from '@/lib/lenker'
import { menybeskrivelse, type Menypunkt } from '@/lib/meny'
import { SEKUNDAERLENKER } from './lenker'

const kolonneoverskrift = 'text-xs font-semibold tracking-[0.16em] text-sand-ink uppercase'

/** Som raden i megamenyen: lenken omslutter navnet og dekker raden med ::after, andrelinjen er beskrivelsen. */
function Rad({ punkt }: { punkt: Menypunkt }) {
  const id = useId()
  return (
    <li className="relative py-2.5 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-regina-pink-strong has-[a:focus-visible]:outline-solid">
      <SheetClose asChild>
        <Link
          href={kategoriUrl(punkt.sti)}
          aria-describedby={id}
          className="block text-base font-medium text-regina-plum no-underline after:absolute after:inset-0 focus-visible:outline-none"
        >
          {punkt.navn}
        </Link>
      </SheetClose>
      <p id={id} className="line-clamp-1 text-sm text-sand-ink">
        {menybeskrivelse(punkt)}
      </p>
    </li>
  )
}

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
        <nav aria-label="Hovedmeny" className="px-5 pt-6 pb-10">
          <p className={kolonneoverskrift}>Kategorier</p>
          <Accordion type="multiple" className="mt-2">
            {meny.map((punkt) => (
              <AccordionItem
                key={punkt.sti.join('/')}
                value={punkt.sti.join('/')}
                className="border-sand-200"
              >
                <AccordionTrigger className="py-4 text-xl hover:no-underline aria-expanded:text-regina-pink-strong">
                  {punkt.navn}
                </AccordionTrigger>
                <AccordionContent className="[&_a]:no-underline">
                  <ul className="pb-3">
                    <li>
                      <SheetClose asChild>
                        <Link
                          href={kategoriUrl(punkt.sti)}
                          className="inline-flex items-center gap-1.5 py-2 text-base font-medium text-regina-pink-strong"
                        >
                          Alt i {punkt.navn.toLocaleLowerCase('nb')} ({punkt.antall})
                          <ArrowRight className="size-4" aria-hidden />
                        </Link>
                      </SheetClose>
                    </li>
                    {punkt.barn.map((u) => (
                      <Rad key={u.sti.join('/')} punkt={u} />
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className={`${kolonneoverskrift} mt-10`}>Regina</p>
          <ul className="mt-2 divide-y divide-sand-200 border-y border-sand-200">
            {SEKUNDAERLENKER.map((l) => (
              <li key={l.href}>
                <SheetClose asChild>
                  <Link href={l.href} className="flex items-center justify-between py-3.5 text-base">
                    {l.navn}
                    <ArrowRight className="size-4 text-sand-ink" aria-hidden />
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
