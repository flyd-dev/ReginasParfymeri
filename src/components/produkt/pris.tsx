import { fraKroner, kroner } from '@/lib/format'
import type { Pris as PrisType } from '@/lib/woocommerce/typer'
import { cn } from '@/lib/utils'

/** Pris slik oppdraget beskriver: «kr 949», «fra kr 2 645», og før- og etterpris ved tilbud. */
export function Pris({
  pris,
  fra,
  className,
}: {
  pris: PrisType
  /** Variable produkter med ulik pris før en variant er valgt. */
  fra?: number | null
  className?: string
}) {
  if (fra != null) return <p className={cn('tabular-nums', className)}>{fraKroner(fra)}</p>
  if (pris.tilbud) {
    return (
      <p className={cn('flex flex-wrap items-baseline gap-x-2 tabular-nums', className)}>
        <span className="text-regina-pink-strong">
          <span className="sr-only">Tilbud: </span>
          {kroner(pris.pris)}
        </span>
        <s className="text-[0.875em] text-sand-ink">
          <span className="sr-only">Før: </span>
          {kroner(pris.ordinaer)}
        </s>
      </p>
    )
  }
  return <p className={cn('tabular-nums', className)}>{kroner(pris.pris)}</p>
}
