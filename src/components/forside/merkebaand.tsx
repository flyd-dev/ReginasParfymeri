'use client'

import { Pause, Play } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { merkeUrl } from '@/lib/lenker'

/**
 * Merkekarusell som rolig bånd. Stopper ved peker, fokus og pauseknapp (WCAG 2.2.2), og står stille ved
 * redusert bevegelse. Merkenavn i Playfair – vi har ikke merkenes logoer med bruksrett.
 */
export function Merkebaand({ merker }: { merker: { navn: string; slug: string }[] }) {
  const [pause, setPause] = useState(false)
  const rad = (skjult: boolean) => (
    <ul className="flex shrink-0 items-center gap-12 pr-12" aria-hidden={skjult || undefined}>
      {merker.map((m) => (
        <li key={m.slug} className="shrink-0">
          <Link
            href={merkeUrl(m.slug)}
            tabIndex={skjult ? -1 : undefined}
            className="font-heading text-2xl whitespace-nowrap text-regina-plum transition-colors duration-(--dur-fast) hover:text-regina-pink md:text-3xl"
          >
            {m.navn}
          </Link>
        </li>
      ))}
    </ul>
  )
  return (
    <section aria-label="Merker" className="border-y border-sand-200 bg-sand-50">
      <div className="group mx-auto max-w-screen-2xl">
        <div className="overflow-hidden pt-8 pb-3 motion-reduce:overflow-x-auto">
          <div
            className="flex w-max animate-[merkebaand_60s_linear_infinite] group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused] motion-reduce:animate-none"
            style={pause ? { animationPlayState: 'paused' } : undefined}
          >
            {rad(false)}
            {rad(true)}
          </div>
        </div>
        {/* Egen rad for knappen, så merkene som glir forbi aldri ligger over den (WCAG 2.5.8). */}
        <div className="flex justify-end px-4 pb-3 motion-reduce:hidden md:px-6">
          <button
            type="button"
            onClick={() => setPause((p) => !p)}
            className="inline-flex h-11 items-center gap-2 px-2 text-sm text-sand-ink hover:text-regina-plum"
            aria-label={pause ? 'Start merkebåndet' : 'Stopp merkebåndet'}
          >
            {pause ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
            <span aria-hidden>{pause ? 'Start' : 'Stopp'}</span>
          </button>
        </div>
      </div>
    </section>
  )
}
