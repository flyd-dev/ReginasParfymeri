// Kundeklubben drives i Diller (oppdraget §1). Fordelene er ikke bestemt eller oppgitt ennå, og vises ikke før
// Regina har gitt dem – ingen påfunne fordeler. Innmeldingslenken settes i NEXT_PUBLIC_DILLER_INNMELDING_URL
// når Diller-oppsettet er klart. Se docs/data-issues.md.
//
// Det finnes ingen nyhetsbrevtjeneste: innmeldingsblokkene (footer og /kundeklubb/) lenker til Diller, eller
// forteller at innmeldingen skjer i kassen. Ingen e-postfelt som ikke sender noe.

export const KUNDEKLUBB = {
  navn: 'Reginas kundeklubb',
  /** Oppdraget §1 og §7.7: klubben kjøres i Diller, og innmelding skjer også i kassen via pluginen. */
  drift: 'Kundeklubben drives i Diller.',
  iKassen: 'Du kan melde deg inn når du handler i nettbutikken, i kassen.',
  /** Innmeldingsblokken på /kundeklubb/: med Diller-lenke, eller uten (da i kassen). */
  tittel: 'Bli medlem',
  hosDiller: 'Innmeldingen skjer hos Diller.',
  kryssAv: 'Kryss av for kundeklubben i kassen når du handler.',
  /** Fylles inn av Regina, f.eks. ['Bonus på kjøp', …]. Tom liste = vises ikke. */
  fordeler: [] as string[],
} as const

/** Dillers innmeldingsside når den er satt opp, ellers null. */
export function dillerInnmelding(): string | null {
  return process.env.NEXT_PUBLIC_DILLER_INNMELDING_URL || null
}
