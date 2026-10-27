'use client'

import { Pause, Play } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { merkeUrl } from '@/lib/lenker'
import { cn } from '@/lib/utils'

type Merke = { navn: string; slug: string }

/**
 * Merkebåndet på plum: merkenavn i Playfair (annethvert kursivt) med rosa skilletegn, og under en roligere rad
 * med de neste merkene – mindre, kursive og i motsatt retning, som de doble radene i «Marquee» (Magic UI, MIT).
 * Begge stopper ved peker, fokus og pauseknapp (WCAG 2.2.2), og står stille ved redusert bevegelse. Vi har ikke
 * merkenes logoer med bruksrett.
 */
export function Merkebaand({ merker, merker2 = [] }: { merker: Merke[]; merker2?: Merke[] }) {
  const [pause, setPause] = useState(false)
  const rad = (liste: Merke[], skjult: boolean, liten: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={skjult || undefined}>
      {liste.map((m, i) => (
        <li key={m.slug} className="flex shrink-0 items-center">
          <Link
            href={merkeUrl(m.slug)}
            tabIndex={skjult ? -1 : undefined}
            className={cn(
              'font-heading whitespace-nowrap transition-colors duration-(--dur-fast) hover:text-regina-pink',
              liten
                ? 'px-5 text-lg text-sand-100 italic md:px-7 md:text-xl'
                : 'px-6 text-2xl text-sand-50 md:px-9 md:text-[2.125rem]',
              !liten && i % 2 && 'italic',
            )}
          >
            {m.navn}
          </Link>
          <span
            className={cn('rotate-45 bg-regina-pink', liten ? 'size-1 opacity-70' : 'size-1.5')}
            aria-hidden
          />
        </li>
      ))}
    </ul>
  )
  const spor = (liste: Merke[], liten: boolean) => (
    <div
      className={cn(
        'flex w-max motion-reduce:animate-none',
        // Andre rad går motsatt vei og saktere, så båndet holder seg rolig.
        liten
          ? 'animate-[merkebaand_110s_linear_infinite_reverse]'
          : 'animate-[merkebaand_70s_linear_infinite]',
        // Stopper når peker eller fokus er i radene – ikke på knappen, så «Start» virker med en gang.
        'group-focus-within/baand:[animation-play-state:paused] group-hover/baand:[animation-play-state:paused]',
      )}
      style={pause ? { animationPlayState: 'paused' } : undefined}
    >
      {rad(liste, false, liten)}
      {rad(liste, true, liten)}
    </div>
  )
  return (
    <section aria-label="Merker" className="bg-regina-plum">
      <div className="group/baand">
        <div className="overflow-hidden pt-7 pb-5 motion-reduce:overflow-x-auto md:pt-9 md:pb-6">
          {spor(merker, false)}
        </div>
        {merker2.length > 0 && (
          <div className="overflow-hidden border-t border-white/10 py-4 motion-reduce:overflow-x-auto md:py-5">
            {spor(merker2, true)}
          </div>
        )}
      </div>
      {/* Egen rad for knappen, så merkene som glir forbi aldri ligger over den (WCAG 2.5.8). Én knapp for begge. */}
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
    </section>
  )
}
