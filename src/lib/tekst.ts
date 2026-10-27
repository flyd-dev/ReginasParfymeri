// Tekstbehandling for katalogdata fra WooCommerce: dekoding av HTML-entiteter,
// rolig versalbruk i visningsnavn og norsk skrivemåte for mål («50 ml»).
// Dette endrer bare hvordan teksten vises – aldri hva den sier.

const NAVNGITTE: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  laquo: '«',
  raquo: '»',
  hellip: '…',
  trade: '™',
  reg: '®',
  copy: '©',
  deg: '°',
  aring: 'å',
  Aring: 'Å',
  oslash: 'ø',
  Oslash: 'Ø',
  aelig: 'æ',
  AElig: 'Æ',
  ouml: 'ö',
  Ouml: 'Ö',
  auml: 'ä',
  Auml: 'Ä',
  uuml: 'ü',
  Uuml: 'Ü',
  eacute: 'é',
  Eacute: 'É',
  egrave: 'è',
  Egrave: 'È',
  ecirc: 'ê',
  ocirc: 'ô',
  Ocirc: 'Ô',
  iuml: 'ï',
  ccedil: 'ç',
  times: '×',
}

export function dekodHtml(tekst: string): string {
  return tekst.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (hele, kode: string) => {
    if (kode[0] === '#') {
      const tall =
        kode[1] === 'x' || kode[1] === 'X' ? parseInt(kode.slice(2), 16) : parseInt(kode.slice(1), 10)
      return Number.isFinite(tall) && tall > 0 && tall < 0x110000 ? String.fromCodePoint(tall) : hele
    }
    return NAVNGITTE[kode] ?? hele
  })
}

/** Fjerner HTML-tagger og dekoder entiteter. Brukes på korte felter som navn. */
export function rensTekst(html: string): string {
  return dekodHtml(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

/** «50ml» → «50 ml», «30 ML» → «30 ml», «1,5 ml» uendret. */
export function normaliserMal(tekst: string): string {
  return tekst.replace(/(\d)\s*(ml|g|gr|kg|cl|l)\b/gi, (_hele, tall: string, enhet: string) => {
    const liten = enhet.toLowerCase()
    return `${tall} ${liten === 'gr' ? 'g' : liten}`
  })
}

const SMAA_ORD = new Set([
  'de',
  'du',
  'la',
  'le',
  'les',
  'of',
  'and',
  'for',
  'the',
  'with',
  'à',
  'og',
  'til',
  'med',
  'i',
  'på',
  'av',
  'en',
  'et',
])

const BEHOLD = new Map<string, string>([
  ['EDP', 'EdP'],
  ['EDT', 'EdT'],
  ['EDC', 'EdC'],
  ['SPF', 'SPF'],
  ['UV', 'UV'],
  ['BDK', 'BDK'],
  ['JJDK', 'JJDK'],
  ['II', 'II'],
  ['III', 'III'],
  ['IV', 'IV'],
  ['XL', 'XL'],
  ['AHA', 'AHA'],
  ['BHA', 'BHA'],
  ['CC', 'CC'],
  ['BB', 'BB'],
  ['DNA', 'DNA'],
  ['IDC', 'IDC'],
  ['GC', 'GC'],
  ['MII', 'MII'],
  ['HAAN', 'HAAN'],
  ['AHAVA', 'AHAVA'],
])

function harSmaaBokstaver(tekst: string): boolean {
  return /\p{Ll}/u.test(tekst)
}

/**
 * Gjør et navn skrevet i versaler om til rolig skrivemåte («LAYTON EDP SPRAY» → «Layton EdP Spray»).
 * Navn som allerede har små bokstaver, beholdes – da har noen valgt skrivemåten med vilje.
 */
export function roligeVersaler(tekst: string): string {
  if (harSmaaBokstaver(tekst)) return tekst
  let forste = true
  return tekst.replace(/[\p{L}\p{N}'’]+/gu, (ord) => {
    const fast = BEHOLD.get(ord)
    const erForste = forste
    forste = false
    if (fast) return fast
    // Tall med enhet («100ML») blir små bokstaver; koder som «M01» beholdes.
    if (/\d/.test(ord)) return /^\d+(?:[.,]\d+)?\p{L}+$/u.test(ord) ? ord.toLowerCase() : ord
    const liten = ord.toLocaleLowerCase('nb-NO')
    if (!erForste && SMAA_ORD.has(liten)) return liten
    return liten.charAt(0).toLocaleUpperCase('nb-NO') + liten.slice(1)
  })
}

function sammenlignbar(tekst: string): string {
  return tekst
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9æø]/g, '')
}

/**
 * Navnet slik det vises i flaten: uten merkeprefiks («CREED – Aventus» → «Aventus») når merket vises
 * for seg, med rolig versalbruk og norsk skrivemåte for mål.
 */
export function lagVisningsnavn(navn: string, merkenavn: string | null): string {
  let rest = navn.trim()
  const deler = rest.split(/\s+[–—-]\s+/)
  if (merkenavn && deler.length > 1) {
    const prefiks = sammenlignbar(deler[0] ?? '')
    const merke = sammenlignbar(merkenavn)
    // Prefikset regnes som merket når det ene starter med det andre («AHAVA SOAP» / «AHAVA»,
    // «ANASTASIA» / «ANASTASIA BEVERLY HILLS») eller de er nesten like («FUGUAZZI» / «FUGAZZI»).
    const likt =
      prefiks.length > 2 && (prefiks.startsWith(merke) || merke.startsWith(prefiks) || nesten(prefiks, merke))
    if (likt) {
      const hode = deler[0] ?? ''
      // «AHAVA SOAP – …»: behold det som står etter merket i prefikset.
      const overskudd = sammenlignbar(hode).startsWith(merke) ? hode.slice(merkenavn.length).trim() : ''
      rest = [overskudd.replace(/^[-–—\s]+/, ''), ...deler.slice(1)].filter(Boolean).join(' – ')
    }
  } else if (merkenavn) {
    // «MAVALA MINI COLOR 16» – merket står først uten tankestrek.
    const ord = rest.split(/\s+/)
    const merkeord = merkenavn.split(/\s+/).length
    const hode = ord.slice(0, merkeord).join(' ')
    if (ord.length > merkeord && sammenlignbar(hode) === sammenlignbar(merkenavn))
      rest = ord.slice(merkeord).join(' ')
  }
  // Hvert ledd for seg: «SOAP – Soothing Salt» → «Soap – Soothing Salt».
  const rolig = rest
    .split(/\s+[–—]\s+/)
    .map(roligeVersaler)
    .join(' – ')
  return normaliserMal(rolig)
    .replace(/[ \t\n]+/g, ' ')
    .trim()
}

/** Levenshtein-avstand ≤ 1 for korte navn – fanger skrivefeil som «FUGUAZZI». */
function nesten(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0
  let j = 0
  let feil = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++
      j++
      continue
    }
    feil++
    if (feil > 1) return false
    if (a.length > b.length) i++
    else if (b.length > a.length) j++
    else {
      i++
      j++
    }
  }
  return feil + (a.length - i) + (b.length - j) <= 1
}

/** Normaliserer søketekst: små bokstaver, uten aksenter (ö → o, é → e, å → a), æ og ø beholdes. */
export function sokbar(tekst: string): string {
  return tekst
    .toLocaleLowerCase('nb-NO')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/** URL-vennlig slug for bruk i lenker vi bygger selv. */
export function lagSlug(tekst: string): string {
  return sokbar(tekst.replace(/æ/gi, 'ae').replace(/ø/gi, 'o')).replace(/\s+/g, '-')
}
