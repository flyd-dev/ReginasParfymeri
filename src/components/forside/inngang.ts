// Klasser til inngangene på forsiden som bygger på «Inngang» i globals.css. Står her som hele strenger, så
// Tailwind finner dem.

/**
 * Fotografi i et teppe (`<Inn variant="teppe">` › `.teppe` › bildet): bildet skaleres ned fra 1,08 mens teppet glir
 * opp, så det ser ut som det trer fram – store flater, 1100 ms. Den skalerte tilstanden gjelder bare før
 * inngangen og bare med [data-bevegelse]; uten JavaScript og ved redusert bevegelse står bildet i ro.
 * Bare til fotografier: produktbilder med multiply skal ikke skaleres utenfor papiret.
 */
export const TEPPEBILDE =
  'transition-transform duration-(--dur-lang) ease-ut [[data-bevegelse]_[data-inn]:not([data-synlig])>.teppe>&]:scale-[1.08]'
