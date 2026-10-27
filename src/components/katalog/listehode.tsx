// Bygget etter «Ecommerce Category Page» (Mohammad Shehadeh / Hirael, MIT) på 21st.dev – https://21st.dev/@mohammadshehadeh/components/ecommerce-04. Egen kode; ingen kode er kopiert.
//
// Fra forbildet: liten overtittel i versaler, stor tittel og en kort ingress over listen. Ingressen vises bare
// når det finnes ekte tekst (WooCommerce har ingen kategoribeskrivelser i dag) – ellers står tittelen alene.

import type { ReactNode } from 'react'
import { AvdekkTekst, type Tekstdel } from '@/components/bevegelse/avdekk-tekst'
import { Inn } from '@/components/bevegelse/inn'

/**
 * Hodet over en produktliste. Tittelen avsløres ord for ord (AvdekkTekst), og overtittel, ingress og det som står
 * under (underkategorier, søkefelt) glir inn etter hverandre. Uten JavaScript eller ved redusert bevegelse står
 * alt der fra start.
 */
export function Listehode({
  overtittel,
  tittel,
  ingress,
  children,
}: {
  overtittel: string
  /** Tekst, eller deler med egen stil (f.eks. et skjult «Søk: » for skjermlesere). */
  tittel: string | Tekstdel[]
  ingress?: ReactNode
  /** Underkategorier, søkefelt o.l. under ingressen. */
  children?: ReactNode
}) {
  return (
    <header className="mt-8 mb-10 md:mt-10 md:mb-14">
      <Inn som="p" className="text-sm tracking-[0.2em] text-sand-ink uppercase">
        {overtittel}
      </Inn>
      <AvdekkTekst
        som="h1"
        i={1}
        deler={typeof tittel === 'string' ? [tittel] : tittel}
        className="mt-3 max-w-4xl text-4xl md:text-6xl"
      />
      {ingress && (
        <Inn som="p" i={3} className="mt-4 max-w-2xl leading-relaxed text-sand-ink md:mt-5 md:text-lg">
          {ingress}
        </Inn>
      )}
      {children && (
        <Inn i={4} className="mt-7 max-w-4xl">
          {children}
        </Inn>
      )}
    </header>
  )
}
