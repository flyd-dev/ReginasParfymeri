// Mobilutgaven av megamenyen (megameny.tsx), med samme oppsett: små kolonneoverskrifter og menypunkter med
// navn og en andrelinje fra kategoritreet – etter «Rich Navigation Menu» (shadcnui-blocks, MIT) på 21st.dev –
// https://21st.dev/@shadcnui-blocks/components/navigation-menu-06. Egen kode; ingen kode er kopiert.
// Radene glir inn fra venstre én etter én når skuffen åpnes, og underpunktene når en kategori åpnes
// (liste-inn.ts, etter «Animated List» – Dillion Verma, Magic UI, MIT).
'use client'

import { ArrowRight, Menu } from 'lucide-react'
import Link from 'next/link'
import { useId } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { kategoriUrl } from '@/lib/lenker'
import { menybeskrivelse, type Menypunkt } from '@/lib/meny'
import { SEKUNDAERLENKER } from './lenker'
import { listeInn, listeInnFraVenstre, plass } from './liste-inn'

const kolonneoverskrift = 'text-xs font-semibold tracking-[0.16em] text-sand-ink uppercase'

/** Som raden i megamenyen: lenken omslutter navnet og dekker raden med ::after, andrelinjen er beskrivelsen. */
function Rad({ punkt, i }: { punkt: Menypunkt; i: number }) {
  const id = useId()
  return (
    <li
      style={plass(i)}
      className={`relative py-2.5 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-regina-pink-strong has-[a:focus-visible]:outline-solid ${listeInn}`}
    >
      <SheetClose asChild>
        <Link
          href={kategoriUrl(punkt.sti)}
          aria-describedby={id}
          className="block text-base font-medium text-regina-plum no-underline transition-colors duration-(--dur-fast) after:absolute after:inset-0 focus-visible:outline-none active:text-regina-pink-strong"
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
        className="-ml-2 inline-flex size-11 items-center justify-center transition-[scale] duration-(--dur-fast) ease-out active:scale-90 lg:hidden"
        aria-label="Meny"
      >
        <Menu className="size-6" aria-hidden />
      </SheetTrigger>
      <SheetContent side="left" className="w-[88vw] max-w-sm gap-0 overflow-y-auto bg-sand-50 p-0">
        <SheetHeader className="border-b border-sand-200 px-5 py-4">
          <SheetTitle className="font-heading text-2xl font-medium">Meny</SheetTitle>
        </SheetHeader>
        <nav aria-label="Hovedmeny" className="px-5 pt-6 pb-10">
          <p className={`${kolonneoverskrift} ${listeInnFraVenstre}`} style={plass(1)}>
            Kategorier
          </p>
          <Accordion type="multiple" className="mt-2">
            {meny.map((punkt, i) => (
              <AccordionItem
                key={punkt.sti.join('/')}
                value={punkt.sti.join('/')}
                style={plass(i + 2)}
                className={`border-sand-200 ${listeInnFraVenstre}`}
              >
                <AccordionTrigger className="py-4 text-xl hover:no-underline aria-expanded:text-regina-pink-strong">
                  {punkt.navn}
                </AccordionTrigger>
                <AccordionContent className="[&_a]:no-underline">
                  <ul className="pb-3">
                    <li className={listeInn} style={plass(0)}>
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
                    {punkt.barn.map((u, j) => (
                      <Rad key={u.sti.join('/')} punkt={u} i={j + 1} />
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className={`${kolonneoverskrift} mt-10 ${listeInnFraVenstre}`} style={plass(meny.length + 2)}>
            Regina
          </p>
          <ul className="mt-2 divide-y divide-sand-200 border-y border-sand-200">
            {SEKUNDAERLENKER.map((l, i) => (
              <li key={l.href} className={listeInnFraVenstre} style={plass(meny.length + 3 + i)}>
                <SheetClose asChild>
                  <Link
                    href={l.href}
                    className="group/lenke flex items-center justify-between py-3.5 text-base transition-colors duration-(--dur-fast) active:text-regina-pink-strong"
                  >
                    {l.navn}
                    <ArrowRight
                      className="size-4 text-sand-ink transition-transform duration-(--dur-slow) ease-ut group-hover/lenke:translate-x-1 group-active/lenke:translate-x-1"
                      aria-hidden
                    />
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
