// Tekstverktøy for importen: HTML-entiteter, ren tekst → enkel HTML, slugs og sammenligning.

const NAVNGITTE_ENTITETER: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: String.fromCodePoint(0xa0),
  laquo: '«',
  raquo: '»',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
}

/** Gjør om HTML-entiteter (`&amp;`, `&#8211;`, `&#x2013;`) til tegn. Ukjente står urørt. */
export function dekodEntiteter(tekst: string): string {
  return tekst.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (hele, kode: string) => {
    if (kode.startsWith('#')) {
      const heks = kode[1] === 'x' || kode[1] === 'X'
      const tall = heks ? Number.parseInt(kode.slice(2), 16) : Number.parseInt(kode.slice(1), 10)
      return Number.isFinite(tall) && tall > 0 && tall <= 0x10ffff ? String.fromCodePoint(tall) : hele
    }
    return NAVNGITTE_ENTITETER[kode.toLowerCase()] ?? hele
  })
}

export function escapeHtml(tekst: string): string {
  return tekst.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Ren tekst fra data/products.json → enkel HTML til WooCommerce. Kilden har bare `<p>` og `<br>`
 * i originalen; tom linje skiller avsnitt og enkelt linjeskift blir `<br />`, som i butikken i dag.
 */
export function tekstTilHtml(tekst: string): string {
  const avsnitt = tekst
    .replace(/\r\n?/g, '\n')
    .trim()
    .split(/\n{2,}/)
    .map((del) => del.trim())
    .filter((del) => del.length > 0)
  return avsnitt
    .map(
      (del) =>
        `<p>${del
          .split('\n')
          .map((linje) => escapeHtml(linje.trim()))
          .join('<br />\n')}</p>`,
    )
    .join('\n')
}

/** For å sammenligne HTML fra staging med det vi ville sendt: entiteter, `<br>` og mellomrom jevnes ut. */
export function normaliserHtml(html: string): string {
  return dekodEntiteter(html)
    .replace(/<br\s*\/?>/gi, '<br>')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim()
}

/** For navn på kategorier, merker og termer: WordPress lagrer `&` som `&amp;`. */
export function normaliserNavn(navn: string): string {
  return dekodEntiteter(navn).replace(/\s+/g, ' ').trim()
}

/**
 * Slug slik WordPress lager den for attributtnavn (`sanitize_title`): små bokstaver, norske tegn
 * translitterert (ø → o, å → a, æ → ae), alt annet enn a–z og 0–9 blir bindestrek.
 */
export function lagSlug(tekst: string): string {
  return tekst
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** `pa_storrelse` og `storrelse` er samme attributt (WooCommerce fjerner prefikset ved opprettelse). */
export function attributtNokkel(slug: string): string {
  return slug.replace(/^pa_/, '')
}

/** For å sammenligne merkenavn uten hensyn til store/små bokstaver og aksenter. */
export function sammenlignbar(tekst: string): string {
  return normaliserNavn(tekst).toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
}
