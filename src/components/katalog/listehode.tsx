// Bygget etter «Ecommerce Category Page» (Mohammad Shehadeh / Hirael, MIT) på 21st.dev – https://21st.dev/@mohammadshehadeh/components/ecommerce-04. Egen kode; ingen kode er kopiert.
//
// Fra forbildet: liten overtittel i versaler, stor tittel og en kort ingress over listen. Ingressen vises bare
// når det finnes ekte tekst (WooCommerce har ingen kategoribeskrivelser i dag) – ellers står tittelen alene.

import type { ReactNode } from 'react'
import { AvdekkTekst, type Tekstdel } from '@/components/bevegelse/avdekk-tekst'
import { Inn } from '@/components/bevegelse/inn'

/**
 * Hodet over en produktliste: en innfelt, lys rosa boks med runde hjørner (R-32, som seksjonene på flyd.no), med
 * overtittel bak en rosa prikk, stor tittel og ingress. Tittelen avsløres ord for ord (AvdekkTekst), og overtittel,
 * ingress og det som står under (underkategorier, søkefelt) glir inn etter hverandre. Uten JavaScript eller ved
 * redusert bevegelse står alt der fra start. Sekundærteksten er sand-ink-deep, som holder kontrasten på rosa flate.
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
    <header className="mt-6 mb-8 rounded-3xl bg-regina-pink-50 px-5 py-8 md:mt-8 md:mb-12 md:px-10 md:py-12 lg:px-14 lg:py-14">
      <Inn
        som="p"
        className="flex items-center gap-2.5 text-sm tracking-[0.2em] text-sand-ink-deep uppercase"
      >
        <span className="size-1.5 shrink-0 rounded-full bg-regina-pink" aria-hidden />
        {overtittel}
      </Inn>
      <AvdekkTekst
        som="h1"
        i={1}
        deler={typeof tittel === 'string' ? [tittel] : tittel}
        className="mt-4 max-w-4xl text-4xl md:text-6xl"
      />
      {/* Ingressen kan bli LCP på mobil: den glir på plass uten å tones inn, så den males fra første bilde. */}
      {ingress && (
        <Inn
          som="p"
          variant="glid"
          i={3}
          className="mt-4 max-w-2xl leading-relaxed text-sand-ink-deep md:mt-5 md:text-lg"
        >
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
