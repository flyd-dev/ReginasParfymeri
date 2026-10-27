// Redaksjonelle valg på forsiden – satt av Flyd, ikke påstander om produktene. Produktene, prisene og tekstene
// kommer fra katalogen. Er et produkt utsolgt eller borte, faller forsiden tilbake til WooCommerces egen
// popularitet i samme kategori (src/lib/forside.ts). Testet i forside.test.ts.

export const FORSIDE = {
  /** Frilagt flaske (gjennomsiktig PNG) på papirflaten i heroen. */
  hero: 'creed-queen-of-silk',
  /** Butikkbildet i heroens ramme (nøkkel i src/content/bilder.ts). */
  heroBilde: 'disken',
  /** Utstillingsvinduet i nisjeduft-seksjonen: én duft om gangen. */
  utstilling: [
    'bdk-parfums-velvet-tonka-extrait',
    'memo-argentina-75-ml',
    'initio-side-effect-edp',
    'parfums-de-marly-althair-exclusif-75ml',
    'fugazzi-vanilla-haze-eau-de-parfum',
  ],
  /** Store kategorifliser. `sti` er kategorien, `produkt` bildet på flisen. */
  innganger: [
    { sti: ['duft', 'nisjeduft'], produkt: 'creed-aventus-for-her' },
    { sti: ['hudpleie'], produkt: 'guinot-huile-mirific-anti-age-oil' },
    { sti: ['makeup'], produkt: 'anastasia-beverly-hills-brow-gel-clear' },
    { sti: ['herre'], produkt: 'montblanc-explorer-infinite-100ml' },
  ],
} as const
