import { FORDELER } from '@/content/butikk'

/**
 * Bekreftede fordeler fra Reginas egne vilkår (src/content/butikk.ts). Ingen påfunne løfter. Stripen er Reginas
 * rosa (R-32): hvit tekst på regina-pink-strong holder 5,8:1.
 */
export function Toppstripe() {
  return (
    <div className="bg-regina-pink-strong text-white">
      <ul className="mx-auto flex max-w-screen-2xl items-center justify-center gap-x-8 px-4 py-2 text-[0.8125rem] tracking-wide">
        {FORDELER.map((f, i) => (
          <li key={f} className={i === 0 ? '' : 'hidden md:block'}>
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}
