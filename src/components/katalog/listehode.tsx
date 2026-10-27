// Bygget etter «Ecommerce Category Page» (Mohammad Shehadeh / Hirael, MIT) på 21st.dev – https://21st.dev/@mohammadshehadeh/components/ecommerce-04. Egen kode; ingen kode er kopiert.
//
// Fra forbildet: liten overtittel i versaler, stor tittel og en kort ingress over listen. Ingressen vises bare
// når det finnes ekte tekst (WooCommerce har ingen kategoribeskrivelser i dag) – ellers står tittelen alene.

import type { ReactNode } from 'react'

export function Listehode({
  overtittel,
  tittel,
  ingress,
  children,
}: {
  overtittel: string
  tittel: ReactNode
  ingress?: ReactNode
  /** Underkategorier, søkefelt o.l. under ingressen. */
  children?: ReactNode
}) {
  return (
    <header className="mt-8 mb-10 md:mt-10 md:mb-14">
      <p className="text-sm tracking-[0.2em] text-sand-ink uppercase">{overtittel}</p>
      <h1 className="mt-3 max-w-4xl text-4xl md:text-6xl">{tittel}</h1>
      {ingress && (
        <p className="mt-4 max-w-2xl leading-relaxed text-sand-ink md:mt-5 md:text-lg">{ingress}</p>
      )}
      {children && <div className="mt-7 max-w-4xl">{children}</div>}
    </header>
  )
}
