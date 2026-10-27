import type { ReactNode } from 'react'
import { Brodsmuler } from '@/components/layout/brodsmuler'
import { cn } from '@/lib/utils'
import { Sidehero } from './sidehero'

/**
 * Ramme for innholdssidene. `redaksjonell` gir sideheroen (tagline til venstre, overskrift og ingress til høyre,
 * medieflate under); uten den beholdes den enkle toppen (kundeklubb, kurv og kasse). `overskrift` erstatter
 * sidenavnet i h1 når heroen har en egen tittel – sidenavnet står da i brødsmulene. `tekstkolonne` setter
 * innholdet under overskriften i høyre kolonne (lange tekster som vilkår og personvern); `marg` står da i venstre
 * kolonne på stor skjerm, f.eks. lenker til de andre kundeservicesidene.
 */
export function Innholdsside({
  tittel,
  kicker,
  ingress,
  children,
  redaksjonell = false,
  overskrift,
  media,
  tekstkolonne = false,
  marg,
}: {
  tittel: string
  kicker?: string
  ingress?: ReactNode
  children: ReactNode
  redaksjonell?: boolean
  overskrift?: ReactNode
  media?: ReactNode
  tekstkolonne?: boolean
  marg?: ReactNode
}) {
  if (redaksjonell) {
    return (
      <div className="mx-auto max-w-screen-2xl px-4 pt-6 pb-10 md:px-6">
        <Brodsmuler smuler={[{ navn: tittel }]} />
        <Sidehero overskrift={overskrift ?? tittel} tagline={kicker} ingress={ingress} media={media} />
        <div
          className={cn(
            media ? 'mt-16 md:mt-24' : 'mt-12 md:mt-16',
            tekstkolonne && 'border-t border-sand-200 pt-12 md:pt-16 lg:grid lg:grid-cols-12 lg:gap-x-8',
          )}
        >
          {tekstkolonne ? (
            <>
              {marg && (
                <div className="hidden lg:col-span-3 lg:block">
                  <div className="sticky top-48">{marg}</div>
                </div>
              )}
              <div className="lg:col-span-6 lg:col-start-7">{children}</div>
            </>
          ) : (
            children
          )}
        </div>
      </div>
    )
  }
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
