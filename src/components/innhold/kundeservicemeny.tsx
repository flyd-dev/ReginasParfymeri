import Link from 'next/link'
import { KUNDESERVICE } from '@/components/layout/lenker'
import { cn } from '@/lib/utils'

/** Rolig liste over kundeservicesidene i venstre marg på lange tekstsider (bare stor skjerm – footeren har dem). */
export function Kundeservicemeny({ aktiv }: { aktiv: string }) {
  return (
    <nav aria-label="Kundeservicesider">
      <ul className="space-y-1 border-l border-sand-200">
        {KUNDESERVICE.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              aria-current={l.href === aktiv ? 'page' : undefined}
              className={cn(
                '-ml-px flex min-h-10 items-center border-l pl-5 transition-colors duration-(--dur-fast)',
                l.href === aktiv
                  ? 'border-regina-pink text-regina-plum'
                  : 'border-transparent text-sand-ink hover:text-regina-plum',
              )}
            >
              {l.navn}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
