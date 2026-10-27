import { FORDELER } from '@/content/butikk'

/** Bekreftede fordeler fra Reginas egne vilkår (src/content/butikk.ts). Ingen påfunne løfter. */
export function Toppstripe() {
  return (
    <div className="bg-regina-plum text-sand-50">
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
