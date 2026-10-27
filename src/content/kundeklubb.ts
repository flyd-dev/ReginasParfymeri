// Kundeklubben drives i Diller (oppdraget §1). Fordelene er ikke bestemt eller oppgitt ennå, og vises ikke før
// Regina har gitt dem – ingen påfunne fordeler. Innmeldingslenken settes i NEXT_PUBLIC_DILLER_INNMELDING_URL
// når Diller-oppsettet er klart. Se docs/data-issues.md.

export const KUNDEKLUBB = {
  /** Fylles inn av Regina, f.eks. ['Bonus på kjøp', …]. Tom liste = vises ikke. */
  fordeler: [] as string[],
} as const
