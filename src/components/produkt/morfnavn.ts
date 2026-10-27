// Navnene til den delte overgangen mellom produktkortet og produktsiden (morf.tsx, galleri.tsx, overganger.css).
// Egen fil uten 'use client', så server-komponentene (produktkort.tsx) kan bruke dem.

/** view-transition-name for bildet av en vare – bare ett element om gangen på siden har det. */
export const morfnavn = (produktId: number) => `produktbilde-${produktId}`

/** view-transition-class for bildet; overganger.css styler ::view-transition-group(.produktbilde). */
export const MORFKLASSE = 'produktbilde'

/** Overgangstypen produktkortet sender med navigasjonen (Link transitionTypes, :active-view-transition-type). */
export const TIL_PRODUKT = 'til-produkt'
