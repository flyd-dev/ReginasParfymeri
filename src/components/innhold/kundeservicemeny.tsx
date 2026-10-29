import Link from 'next/link'
import { KUNDESERVICE } from '@/components/layout/lenker'
import { Prikk } from '@/components/layout/prikk'
import { cn } from '@/lib/utils'

/**
 * Rolig liste over kundeservicesidene i venstre marg på lange tekstsider (bare stor skjerm – footeren har dem).
 * Lenkene er piller (R-32); siden man står på har lys rosa flate og rosa prikk.
 */
export function Kundeservicemeny({ aktiv }: { aktiv: string }) {
  return (
    <nav aria-label="Kundeservicesider">
      <ul className="space-y-1">
        {KUNDESERVICE.map((l) => {
          const her = l.href === aktiv
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={her ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-full px-4 transition-colors duration-(--dur-fast)',
                  her
                    ? 'bg-regina-pink-50 font-medium text-regina-plum'
                    : 'text-sand-ink hover:bg-sand-100 hover:text-regina-plum',
                )}
              >
                {her && <Prikk />}
                {l.navn}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
