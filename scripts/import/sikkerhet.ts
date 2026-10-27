// Vern mot å treffe Reginas produksjon. Det finnes bevisst ikke noe flagg som overstyrer dette.

/** Vertsnavn som alltid er produksjon. */
const PRODUKSJON = ['reginaparfymeri.no', 'nettbutikk.reginaparfymeri.no', 'www.reginaparfymeri.no']
const PRODUKSJONSDOMENE = 'reginaparfymeri.no'

/** Ord som må stå som eget ledd i en undervert av reginaparfymeri.no for at den regnes som staging. */
const STAGING_ORD = new Set(['staging', 'stage'])

export class ProduksjonAvvist extends Error {
  constructor(melding: string) {
    super(melding)
    this.name = 'ProduksjonAvvist'
  }
}

/** Gir `true` når vertsnavnet er Reginas produksjon eller en undervert som ikke tydelig er staging. */
export function erProduksjonsvert(vertsnavn: string): boolean {
  const vert = vertsnavn.toLowerCase().replace(/\.+$/, '')
  if (PRODUKSJON.includes(vert)) return true
  if (!vert.endsWith(`.${PRODUKSJONSDOMENE}`)) return false
  const undervert = vert.slice(0, -(PRODUKSJONSDOMENE.length + 1))
  const ledd = undervert.split(/[.-]/)
  return !ledd.some((del) => STAGING_ORD.has(del))
}

/**
 * Kontrollerer `WC_STAGING_URL` og gir tilbake rot-URL-en uten avsluttende skråstrek.
 * Krever https, avviser produksjon, innebygd brukernavn/passord, spørring og fragment.
 */
export function kontrollerStagingUrl(verdi: string): string {
  let url: URL
  try {
    url = new URL(verdi.trim())
  } catch {
    throw new Error('WC_STAGING_URL er ikke en gyldig URL')
  }
  if (url.protocol !== 'https:') throw new Error('WC_STAGING_URL må bruke https')
  if (url.username || url.password)
    throw new Error('WC_STAGING_URL kan ikke inneholde brukernavn eller passord')
  if (url.search || url.hash) throw new Error('WC_STAGING_URL kan ikke ha spørring eller fragment')
  if (erProduksjonsvert(url.hostname)) {
    throw new ProduksjonAvvist(
      `Avbryter: ${url.hostname} er Reginas produksjon (eller ikke tydelig staging). Importen kjører bare mot staging.`,
    )
  }
  // Godta også at noen limer inn API-roten (…/wp-json eller …/wp-json/wc/v3).
  const sti = url.pathname.replace(/\/+$/, '').replace(/\/wp-json(\/wc\/v3)?$/, '')
  return `${url.origin}${sti}`
}
