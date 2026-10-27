import type { ReactNode } from 'react'
import { Brodsmuler } from '@/components/layout/brodsmuler'

export function Innholdsside({
  tittel,
  kicker,
  ingress,
  children,
}: {
  tittel: string
  kicker?: string
  ingress?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mx-auto max-w-screen-2xl px-4 pt-6 pb-10 md:px-6">
      <Brodsmuler smuler={[{ navn: tittel }]} />
      <header className="mt-8 mb-12 max-w-3xl">
        {kicker && <p className="text-sm tracking-[0.2em] text-sand-ink uppercase">{kicker}</p>}
        <h1 className="mt-2 text-4xl md:text-6xl">{tittel}</h1>
        {ingress && <div className="mt-5 text-lg text-sand-ink">{ingress}</div>}
      </header>
      {children}
    </div>
  )
}
