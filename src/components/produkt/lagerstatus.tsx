import type { Lager } from '@/lib/woocommerce/typer'
import { cn } from '@/lib/utils'

/** Lagerstatus fra WooCommerce. «Få igjen» bare når WooCommerce melder lav beholdning. */
export function Lagerstatus({ lager, className }: { lager: Lager; className?: string }) {
  const tekst =
    lager.status === 'utsolgt'
      ? 'Utsolgt'
      : lager.status === 'fa-igjen'
        ? lager.antall === 1
          ? 'Bare 1 igjen'
          : `Få igjen (${lager.antall})`
        : 'På lager'
  return (
    <p
      className={cn(
        'inline-flex items-center gap-2 text-sm',
        lager.status === 'utsolgt'
          ? 'text-status-feil'
          : lager.status === 'fa-igjen'
            ? 'text-status-varsel'
            : 'text-status-ok',
        className,
      )}
    >
      <span className="size-2 rounded-full bg-current" aria-hidden />
      {tekst}
    </p>
  )
}
