// Bygget etter «Editorial Hero» (felipemenezes098, MIT) på 21st.dev – https://21st.dev/@felipemenezes098/components/hero-05. Egen kode; ingen kode er kopiert.

import Image from 'next/image'
import type { ReactNode } from 'react'
import type { Fotografi } from '@/content/bilder'

/**
 * Sidehero for innholdssidene: kort tagline til venstre, stor Playfair-overskrift og ingress til høyre, og en bred
 * medieflate under. Juridiske sider får bare tekstdelen. Ingen fargeovergang over bildet (demoen toner bildet ut
 * mot hvitt) – flaten har rene kanter. Bare bildet toner inn; teksten står i ro, så kontrasten aldri måles på
 * halvgjennomsiktig tekst.
 */
export function Sidehero({
  overskrift,
  tagline,
  ingress,
  media,
}: {
  overskrift: ReactNode
  tagline?: ReactNode
  ingress?: ReactNode
  media?: ReactNode
}) {
  return (
    <header className="mt-10 md:mt-14">
      <div className="grid gap-y-7 lg:grid-cols-12 lg:gap-x-8">
        {tagline && (
          <p className="max-w-xs text-sand-ink lg:col-span-4 lg:col-start-1 lg:row-start-1 lg:self-end lg:pb-1">
            {tagline}
          </p>
        )}
        <div className="lg:col-span-6 lg:col-start-7 lg:row-start-1">
          <h1 className="text-[clamp(2.25rem,1.3rem+3.3vw,4.5rem)] leading-[1.04] tracking-[-0.015em] break-words">
            {overskrift}
          </h1>
          {ingress && <div className="mt-7 max-w-xl text-lg text-sand-ink md:text-xl">{ingress}</div>}
        </div>
      </div>
      {media && <div className="mt-12 md:mt-16">{media}</div>}
    </header>
  )
}

/**
 * Bred bildeflate i heroen. Reginas bilder er bare ~1000 px brede, så flaten holder seg innenfor
 * `max-w-screen-2xl` og `sizes` sier det. `utsnitt` er object-position (f.eks. «50% 40%»).
 */
export function Mediebilde({ foto, utsnitt = '50% 50%' }: { foto: Fotografi; utsnitt?: string }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-sand-100 sm:aspect-[16/9] lg:aspect-[16/7]">
      <Image
        src={foto.bilde}
        alt={foto.alt}
        fill
        preload
        sizes="(min-width: 1536px) 1488px, (min-width: 768px) calc(100vw - 3rem), calc(100vw - 2rem)"
        className="object-cover duration-(--dur-slow) ease-out animate-in fade-in zoom-in-[1.02]"
        style={{ objectPosition: utsnitt }}
      />
    </div>
  )
}
