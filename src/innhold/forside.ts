import type { Bildenokkel } from './bilder'

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

/** Flaten bak frilagte produktbilder i en inngang. */
export type Inngangsflate = 'plomme' | 'rosa' | 'rosa-dus' | 'sand'

/**
 * Inngangene i «Hva leter du etter?». Tekstene er våre egne, korte veivisere – ingen produktpåstander.
 * Et kort viser enten et av Reginas egne butikkbilder (`foto`, nøkkel i BILDER) eller frilagte
 * produktbilder fra kategorien (`flasker`, slug). Brukes bare produkter som finnes, er på lager og har
 * gjennomsiktig bakgrunn; ellers vises et vanlig produktbilde fra kategorien.
 */
export const INNGANGER = [
  {
    slug: 'nisjeduft',
    tekst: 'Creed, Initio, Parfums de Marly, BDK og flere',
    plass: 'stor',
    flasker: ['memo-mafa-75-ml', 'creed-aventus-for-her', 'memo-argentina-75-ml'],
    flate: 'plomme',
  },
  { slug: 'hudpleie', tekst: 'Ansikt, kropp, rens og sol', plass: 'hoy', foto: 'salong' },
  { slug: 'makeup', tekst: 'Lepper, øyne, bryn og negler', plass: 'vanlig', foto: 'disken' },
  {
    slug: 'har',
    tekst: 'Pleie, styling og hårpynt',
    plass: 'vanlig',
    flasker: ['ida-warg-repair-hair-mask-300ml'],
    flate: 'rosa-dus',
  },
  {
    slug: 'herre',
    tekst: 'Duft, barbering og pleie',
    plass: 'vanlig',
    flasker: ['montblanc-explorer-infinite-shower-gel-150ml'],
    flate: 'sand',
  },
  {
    slug: 'gavesett',
    tekst: 'Ferdige gaver og sett',
    plass: 'vanlig',
    flasker: ['ahava-holiday-2026-skin-deep-trio'],
    flate: 'rosa',
  },
  { slug: 'duftlys-og-duftpinner', tekst: 'Duft til hjemmet', plass: 'bred', foto: 'duftpinner' },
] as const satisfies readonly {
  slug: string
  tekst: string
  plass: 'stor' | 'hoy' | 'bred' | 'vanlig'
  foto?: Bildenokkel
  flasker?: readonly string[]
  flate?: Inngangsflate
}[]

/** Flasken som står foran butikkdøren i heroen. Første som finnes, er på lager og er frilagt. */
export const HERO_FLASKER = [
  'creed-queen-of-silk',
  'creed-aventus-for-her',
  'parfums-de-marly-athenais',
] as const

/** Merkene i det rosa båndet under heroen, i denne rekkefølgen. Merker som mangler, hoppes over. */
export const MERKEBAAND = [
  'creed',
  'initio',
  'parfums-de-marly',
  'bdk-parfums',
  'memo',
  'fugazzi',
  'ormonde-jayne',
  'essential-parfums',
  'molecules',
  'van-cleef-arpels',
  'montblanc',
  'haugescent',
  'susanne-kaufmann',
  'guinot',
  'ahava',
  'anastasia-beverly-hills',
  'ida-warg',
  'mavala',
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
