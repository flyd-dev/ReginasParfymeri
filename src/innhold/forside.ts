// Utvalg på forsiden. Satt av Flyd for konseptet – Regina velger selv i den ferdige løsningen.
// Produktene hentes fra katalogen med slug; mangler en (utgått, utsolgt), hoppes den over.

export const UTVALGTE_NISJEDUFTER = [
  'parfums-de-marly-delina-edp-spray',
  'initio-side-effect-edp',
  'fugazzi-vanilla-haze-eau-de-parfum',
  'creed-aventus-2',
  'bdk-parfums-gris-charnel-extrait-100-ml',
  'ormonde-jayne-damask-edp-88ml',
  'memo-irish-leather-75-ml',
  'essential-parfums-velvet-iris-100ml',
] as const

/** Inngangene i «Hva leter du etter?». Tekstene er våre egne, korte veivisere – ingen produktpåstander. */
export const INNGANGER = [
  { slug: 'nisjeduft', tekst: 'Creed, Initio, Parfums de Marly, BDK og flere' },
  { slug: 'hudpleie', tekst: 'Ansikt, kropp, rens og sol' },
  { slug: 'makeup', tekst: 'Lepper, øyne, bryn og negler' },
  { slug: 'har', tekst: 'Pleie, styling og hårpynt' },
  { slug: 'herre', tekst: 'Duft, barbering og pleie' },
  { slug: 'gavesett', tekst: 'Ferdige gaver og sett' },
  { slug: 'duftlys-og-duftpinner', tekst: 'Duft til hjemmet' },
] as const

/** Hovedmenyen: hver post samler én eller flere toppkategorier fra WooCommerce. */
export const MENY = [
  { id: 'duft', etikett: 'Duft', kategorier: ['duft'] },
  { id: 'hudpleie', etikett: 'Hudpleie', kategorier: ['hudpleie'] },
  { id: 'makeup', etikett: 'Makeup', kategorier: ['makeup'] },
  { id: 'har', etikett: 'Hår', kategorier: ['har'] },
  { id: 'herre', etikett: 'Herre', kategorier: ['herre'] },
  { id: 'gaver', etikett: 'Gaver og tilbehør', kategorier: ['tilbehor', 'accessories'] },
] as const
