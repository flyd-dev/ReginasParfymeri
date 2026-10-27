// Rader som kommer inn én etter én når en meny, skuff eller dialog åpnes – etter «Animated List» (Dillion Verma,
// Magic UI, MIT) på 21st.dev – https://21st.dev/@dillionverma/components/animated-list. Egen kode; ingen kode er
// kopiert. Fra forbildet: hvert element kommer inn etter det forrige med en fast forsinkelse. Her med CSS
// (tw-animate-css sin «enter»: opacity og transform), uten fjærer og uten at lista fortsetter av seg selv.
//
// Animasjonen kjører når elementet settes inn i DOM-en, altså hver gang innholdet åpnes. Ved redusert bevegelse er
// varighet og forsinkelse 0 (tokens.css), og alt står der med en gang.

import type { CSSProperties } from 'react'

/** Klassene for én rad. Plassen i rekken settes med `plass(i)`; etter ti rader kommer resten samtidig. */
export const listeInn =
  'animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-backwards ease-ut [--tw-animation-duration:var(--dur-slow)] [--tw-animation-delay:calc(min(var(--i,0),10)*var(--stagger)*0.6)]'

/** Samme inngang, men glir inn fra venstre (rader i en skuff som åpnes fra venstre). */
export const listeInnFraVenstre =
  'animate-in fade-in-0 slide-in-from-left-4 fill-mode-backwards ease-ut [--tw-animation-duration:var(--dur-slow)] [--tw-animation-delay:calc(min(var(--i,0),10)*var(--stagger)*0.6)]'

/** Plass i rekken (0, 1, 2 …) som stil – forsinkelsen er i × 0,6 × --stagger. */
export function plass(i: number): CSSProperties {
  return { '--i': i } as CSSProperties
}
