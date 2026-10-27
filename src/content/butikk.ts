// Fakta om Regina som vises i flaten. Alt her er hentet fra Reginas egne sider – kilde og dato
// står ved hvert punkt. Står det ikke her, skal det ikke stå i flaten (ingen påfunne løfter).

export const KILDER = {
  hjemmeside: 'https://reginaparfymeri.no/ (lest 26.10.2026)',
  omOss: 'https://nettbutikk.reginaparfymeri.no/om-oss/ (endret 10.09.2025)',
  frakt: 'https://nettbutikk.reginaparfymeri.no/frakt-levering/ (endret 15.12.2025)',
  retur: 'https://nettbutikk.reginaparfymeri.no/angrerett-og-retur/ (endret 15.12.2025)',
  betingelser: 'https://nettbutikk.reginaparfymeri.no/betingelser/ (endret 15.12.2025)',
  personvern: 'https://reginaparfymeri.no/personvernerklaering/ (endret 07.12.2020)',
  oppdrag: 'Oppdragsbeskrivelsen fra Flyd, §1 (27.10.2026)',
} as const

export const BUTIKK = {
  navn: 'Regina Parfymeri',
  selskap: 'Regina Haraldsgaten AS',
  orgnr: '980 314 677',
  adresse: { gate: 'Haraldsgata 138', postnr: '5527', sted: 'Haugesund' },
  beliggenhet: 'Midt i Haugesund sentrum, rett overfor Viktoriahjørnet i Haraldsgaten',
  telefon: { visning: '948 97 061', lenke: 'tel:+4794897061' },
  telefonButikk: { visning: '52 72 62 62', lenke: 'tel:+4752726262' },
  epost: 'velkommen.regina@gmail.com',
  kart: 'https://goo.gl/maps/eqBZry7PXJH7VWB56',
  timebestilling: 'https://www.ledigtime.no/regina/step1',
  instagram: { navn: '@regina_hgsd', lenke: 'https://instagram.com/regina_hgsd' },
  facebook: { navn: 'reginahgsd', lenke: 'https://www.facebook.com/reginahgsd' },
  nettbutikk: 'https://nettbutikk.reginaparfymeri.no',
  betingelser: 'https://nettbutikk.reginaparfymeri.no/betingelser/',
} as const

/** Om Regina – fra «Om oss» i nettbutikken og forsiden på reginaparfymeri.no. */
export const HISTORIE = {
  grunnlagt: 1863,
  etablert: 1970,
  tekst: [
    'Regina er et av Norges eldste frittstående parfymerier. Historien begynner i 1863, da Grethes tippoldefar startet Nilsen & Sønner. AS Regina ble etablert i 1970.',
    'I dag driver Grethe Kongshavn, femte generasjon i familien, butikken sammen med datteren Maria og to dyktige medarbeidere – en engasjert firkløver som brenner for fagkunnskap, personlig service og ekte skjønnhetsglede.',
  ],
  autorisert: 'Regina er autorisert forhandler av alle merkevarene butikken fører.',
  /** Tidslinjen på forsiden. Bare årstall og hendelser med kilde – ingen utfylling. */
  tidslinje: [
    { aar: '1863', tekst: 'Grethes tippoldefar starter Nilsen & Sønner i Haugesund.' },
    { aar: '1970', tekst: 'AS Regina blir etablert.' },
    {
      aar: 'I dag',
      tekst:
        'Grethe Kongshavn, femte generasjon, driver butikken i Haraldsgata 138 sammen med datteren Maria.',
    },
  ],
} as const

export const HUDPLEIE = {
  tekst:
    'I Reginas andre etasje finner du hudpleieavdelingen, som tilbyr kroppsbehandlinger fra topp til tå for hele familien. Pust ut, slapp av og nyt!',
} as const

/** Nisjeduft – Reginas egen beskrivelse (reginaparfymeri.no). */
export const NISJE = {
  merker: ['Creed', 'Initio Parfums Privés', 'Parfums de Marly', 'Fugazzi', 'BDK', 'Ormonde Jayne'],
  tekst:
    'Parfymer skapt med høy konsentrasjon av eksklusive råvarer, dybde og karakter – ofte produsert i begrensede opplag. Regina er en av få butikker i Norge som har autorisasjon til å føre disse merkene fysisk i butikk, og den eneste i Haugesund.',
  veiledning:
    'Når du besøker oss, tar vi oss tid til å bli kjent med deg og det du liker, slik at vi kan hjelpe deg å finne en duft som føles som din egen signatur.',
} as const

/** Levering – fra «Frakt & Levering». Prisene settes i kassen av WooCommerce; dette er bare informasjon. */
export const LEVERING = {
  fra: 'Alle ordre sendes med Posten fra butikken i Haugesund.',
  alternativer: [
    {
      navn: 'Pakke i postkasse',
      pris: '79 kr',
      tekst:
        'Normalt 1–5 virkedager. Kan bare sendes til adressen du er folkeregistrert på. Gjelder ikke bestillinger over 2 000 kr.',
    },
    {
      navn: 'Pakke til hentested',
      pris: '100 kr',
      tekst: 'Forventet 1–5 virkedager til ditt nærmeste utleveringssted.',
    },
    {
      navn: 'Hent i butikken',
      pris: 'Gratis',
      tekst:
        'Du får beskjed når varene er klare i Haraldsgata. Gjelder så lenge butikken har alle de bestilte varene på lager.',
    },
  ],
} as const

/** Retur – fra «Angrerett & Retur». */
export const RETUR = {
  kort: '14 dagers åpent kjøp',
  tekst: [
    'Du har 14 dagers åpent kjøp når du handler i nettbutikken, regnet fra dagen du mottar bestillingen (gjelder ikke kjøp i butikken).',
    'Produktet må være uåpnet og i originalforpakning med forsegling. Kontakt oss på e-post, så sender vi returskjema og returetikett.',
    'Ved retur av bestillinger under 1 000 kr trekkes et returgebyr på 39 kr.',
  ],
} as const

/** Kort, bekreftede fordeler til toppstripen. Ingen påfunne løfter. */
export const FORDELER = [
  'Sendes med Posten fra butikken i Haugesund',
  'Hent gratis i butikken i Haraldsgata',
  '14 dagers åpent kjøp',
] as const

/**
 * Merker i den fysiske butikken som ikke selges i nettbutikken. Fra listen «Merker i butikk» på
 * nettbutikkens forside og reginaparfymeri.no, 26.10.2026: «Enkelte av våre eksklusive merker – som
 * Sisley, Guerlain, Chanel og Hermès – er dessverre ikke tilgjengelige i nettbutikken grunnet
 * restriksjoner fra leverandørene.» Slugen er den samme som i dagens butikk der merket har en side der
 * (/brand/hermes-paris/ osv.), så adressen beholdes.
 */
export const KUN_I_BUTIKKEN = [
  { navn: 'Chanel', slug: 'chanel' },
  { navn: 'Sisley', slug: 'sisley' },
  { navn: 'Guerlain', slug: 'guerlain' },
  { navn: 'Hermès', slug: 'hermes-paris' },
  { navn: 'Tom Ford', slug: 'tom-ford' },
  { navn: 'Laura Mercier', slug: 'laura-mercier' },
  { navn: 'Clarins', slug: 'clarins' },
  { navn: 'Estée Lauder', slug: 'estee-lauder' },
  { navn: 'Sensai', slug: 'sensai' },
  { navn: 'Carolina Herrera', slug: 'carolina-herrera' },
  { navn: 'Boucheron', slug: 'boucheron' },
  { navn: 'Issey Miyake', slug: 'issey-miyake' },
  { navn: 'Narciso Rodriguez', slug: 'narciso-rodriguez' },
  { navn: 'Jean Paul Gaultier', slug: 'jean-paul-gaultier' },
  { navn: 'Thierry Mugler', slug: 'thierry-mugler' },
  { navn: 'Paco Rabanne', slug: 'paco-rabanne' },
  { navn: 'Dolce & Gabbana', slug: 'dolce-gabbana' },
  { navn: 'Versace', slug: 'versace' },
  { navn: 'Hugo Boss', slug: 'hugo-boss' },
  { navn: 'Coach', slug: 'coach' },
  { navn: 'Karl Lagerfeld', slug: 'karl-lagerfeld' },
] as const

export const KUN_I_BUTIKKEN_TEKST =
  'Enkelte av våre eksklusive merker kan ikke selges på nett på grunn av restriksjoner fra leverandørene. Du finner dem i butikken i Haraldsgata – ring oss eller kom innom, så hjelper vi deg.'

/**
 * Produkter der det er uklart om de kan selges på nett. Vi bestemmer det ikke selv: de vises slik
 * WooCommerce sier (kjøpbare) til Regina/Marius har avklart. Meldt i docs/data-issues.md.
 */
export const AVKLARES = [
  {
    merke: 'guerlain',
    grunn:
      'Guerlain står på listen over merker som ikke kan selges på nett, men «GUERLAIN – Mon Guerlain Xmas» ligger i nettbutikken i dag.',
  },
] as const

/** Hudpleieavdelingen i andre etasje (oppdraget §1 og reginaparfymeri.no). */
export const BEHANDLINGER = {
  etasje: '2. etasje',
  tekst: HUDPLEIE.tekst,
  timebestilling: BUTIKK.timebestilling,
} as const
