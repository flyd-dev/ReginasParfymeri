'use client'

import { Pause, Play } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { merkeUrl } from '@/lib/lenker'

/**
 * Merkebåndet på plum: merkenavn i Playfair (annethvert kursivt) med rosa skilletegn. Stopper ved peker, fokus og
 * pauseknapp (WCAG 2.2.2), og står stille ved redusert bevegelse. Vi har ikke merkenes logoer med bruksrett.
 */
export function Merkebaand({ merker }: { merker: { navn: string; slug: string }[] }) {
  const [pause, setPause] = useState(false)
  const rad = (skjult: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={skjult || undefined}>
      {merker.map((m, i) => (
        <li key={m.slug} className="flex shrink-0 items-center">
          <Link
            href={merkeUrl(m.slug)}
            tabIndex={skjult ? -1 : undefined}
            className={`px-6 font-heading text-2xl whitespace-nowrap text-sand-50 transition-colors duration-(--dur-fast) hover:text-regina-pink md:px-9 md:text-[2.125rem] ${i % 2 ? 'italic' : ''}`}
          >
            {m.navn}
          </Link>
          <span className="size-1.5 rotate-45 bg-regina-pink" aria-hidden />
        </li>
      ))}
    </ul>
  )
  return (
    <section aria-label="Merker" className="bg-regina-plum">
      <div className="group">
        <div className="overflow-hidden py-7 motion-reduce:overflow-x-auto md:py-9">
          <div
            className="flex w-max animate-[merkebaand_70s_linear_infinite] group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused] motion-reduce:animate-none"
            style={pause ? { animationPlayState: 'paused' } : undefined}
          >
            {rad(false)}
            {rad(true)}
          </div>
        </div>
        {/* Egen rad for knappen, så merkene som glir forbi aldri ligger over den (WCAG 2.5.8). */}
        <div className="mx-auto flex max-w-screen-2xl justify-end px-4 pb-2 motion-reduce:hidden md:px-6">
          <button
            type="button"
            onClick={() => setPause((p) => !p)}
            className="inline-flex h-11 items-center gap-2 px-2 text-sm text-sand-100 hover:text-white"
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
