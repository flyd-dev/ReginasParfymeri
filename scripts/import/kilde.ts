// Gjør kildefilene om til en normalisert kilde for importen. Rene funksjoner – ingen filer, ingen nettverk.
//
// Produktene kommer fra data/products.json. Varianter får pris, lager og SKU fra raw/variations_raw.json
// (Store API-format) og bruker products.json bare som reserve og til kontroll.

import { kronerTilOre, minsteEnhetTilOre } from './penger'
import { dekodEntiteter, lagSlug, normaliserNavn, sammenlignbar, tekstTilHtml } from './tekst'
import type {
  Attributt,
  Bilde,
  Kategori,
  KategoriJson,
  Kilde,
  KildeFiler,
  Lager,
  Melding,
  Merke,
  Produkt,
  ProduktAttributt,
  ProduktJson,
  Term,
  Variasjon,
  VariasjonJson,
} from './typer'

/**
 * Merker som bare selges i den fysiske butikken. Kopi av `KUN_I_BUTIKKEN` i flatens butikkfakta
 * (src/content/butikk.ts), hentet fra Reginas egne sider 26.10.2026: «Enkelte av våre eksklusive
 * merker – som Sisley, Guerlain, Chanel og Hermès – er dessverre ikke tilgjengelige i nettbutikken
 * grunnet restriksjoner fra leverandørene.» Importen skal ikke avhenge av flaten, derfor kopien.
 */
export const MERKER_KUN_I_BUTIKK = [
  'Chanel',
  'Sisley',
  'Guerlain',
  'Hermès',
  'Tom Ford',
  'Laura Mercier',
  'Clarins',
  'Estée Lauder',
  'Sensai',
  'Carolina Herrera',
  'Boucheron',
  'Issey Miyake',
  'Narciso Rodriguez',
  'Jean Paul Gaultier',
  'Thierry Mugler',
  'Paco Rabanne',
  'Dolce & Gabbana',
  'Versace',
  'Hugo Boss',
  'Coach',
  'Karl Lagerfeld',
] as const

/** Attributtene oppdraget nevner. Andre globale attributter i kilden opprettes også, men meldes. */
const KJENTE_ATTRIBUTTER = new Set(['pa_storrelse', 'pa_farge'])

/** Store API sin standardgrense for antall i kurven når lageret ikke begrenser det. */
export const UBEGRENSET = 9999

export interface Lagerdata {
  iLager: boolean
  /** Store API `low_stock_remaining`: gjenstående når det er under terskelen, ellers `null`. */
  lavtLager: number | null
  /** Store API `add_to_cart.maximum` (= `max_quantity`). Under 9999 betyr at lageret begrenser. */
  maks: number
  /** WooCommerces egen tekst, f.eks. «3 på lager» eller «Utsolgt». */
  tekst: string
  solgtEnkeltvis?: boolean
  restordre?: boolean
}

export type Lagermerknad = 'lager_uenig' | 'mulig_negativt_lager'

/**
 * Lagerstrategien. Vi vet bare det Store API viste 26.10.2026, ikke eksakt beholdning:
 * - På lager og et faktisk antall (maks i kurven < 9999, `low_stock_remaining` eller «N på lager» –
 *   og alle som finnes er enige) → lagerstyring med det antallet.
 * - Utsolgt og `low_stock_remaining = 0` → butikken styrer lageret og har 0 eller mindre → lagerstyring, 0.
 * - Ellers → ingen lagerstyring, bare `stock_status` (på lager / utsolgt).
 * Antallet er det som var tilgjengelig for nettkunder (beholdning minus reservasjoner i kurver).
 */
export function tolkLager(data: Lagerdata): { lager: Lager; merknad: Lagermerknad | null } {
  if (data.restordre) {
    return { lager: { styring: 'status', status: 'onbackorder', grunnlag: 'restordre' }, merknad: null }
  }
  const treff = /^(\d+)\s+på lager$/i.exec(data.tekst.trim())
  const fraTekst = treff ? Number(treff[1]) : null

  if (data.iLager) {
    const kandidater: number[] = []
    if (data.maks < UBEGRENSET && !data.solgtEnkeltvis) kandidater.push(data.maks)
    if (data.lavtLager !== null && data.lavtLager > 0) kandidater.push(data.lavtLager)
    if (fraTekst !== null) kandidater.push(fraTekst)
    const forste = kandidater[0]
    if (forste === undefined) {
      return {
        lager: { styring: 'status', status: 'instock', grunnlag: 'på lager, antall ikke oppgitt' },
        merknad: null,
      }
    }
    if (kandidater.some((k) => k !== forste)) {
      return {
        lager: { styring: 'status', status: 'instock', grunnlag: 'på lager, antallene i kilden er uenige' },
        merknad: 'lager_uenig',
      }
    }
    return {
      lager: { styring: 'antall', antall: forste, status: 'instock', grunnlag: 'antall fra Store API' },
      merknad: null,
    }
  }

  if (data.lavtLager === 0) {
    return {
      lager: {
        styring: 'antall',
        antall: 0,
        status: 'outofstock',
        grunnlag: 'utsolgt med lagerstyring (low_stock_remaining = 0)',
      },
      // Store API gir maks < 9999 for en utsolgt vare bare når beholdningen er negativ.
      merknad: data.maks < UBEGRENSET ? 'mulig_negativt_lager' : null,
    }
  }
  return {
    lager: { styring: 'status', status: 'outofstock', grunnlag: 'utsolgt, antall ikke oppgitt' },
    merknad: null,
  }
}

function flatKategorier(tre: KategoriJson[], feil: Melding[]): Kategori[] {
  const ut: Kategori[] = []
  const sett = new Set<string>()
  // Bredde først: hele nivå 0, så nivå 1 osv. Da kommer en forelder alltid før barna.
  let nivaa = tre.map((node) => ({ node, forelder: null as string | null }))
  let dybde = 0
  while (nivaa.length > 0) {
    const neste: { node: KategoriJson; forelder: string | null }[] = []
    for (const { node, forelder } of nivaa) {
      if (sett.has(node.slug)) {
        feil.push({ kode: 'dobbel_kategori', tekst: `Kategorien «${node.slug}» står flere ganger i treet` })
        continue
      }
      sett.add(node.slug)
      ut.push({ slug: node.slug, navn: normaliserNavn(node.name), forelderSlug: forelder, dybde })
      for (const barn of node.children ?? []) neste.push({ node: barn, forelder: node.slug })
    }
    nivaa = neste
    dybde += 1
  }
  return ut
}

function attributtSlug(navn: string): string {
  return `pa_${lagSlug(navn)}`
}

function produktMelding(p: ProduktJson, kode: string, tekst: string): Melding {
  return { kode, tekst, kildeId: p.id, sku: p.sku || null, navn: dekodEntiteter(p.name) }
}

export function byggKilde(filer: KildeFiler): Kilde {
  const meldinger: Melding[] = []
  const feil: Melding[] = []
  const kategorier = flatKategorier(filer.kategorier, feil)
  const kjenteKategorier = new Set(kategorier.map((k) => k.slug))

  const merker: Merke[] = []
  const merkeEtterSlug = new Map<string, Merke>()
  for (const m of filer.merker) {
    if (merkeEtterSlug.has(m.slug)) {
      feil.push({ kode: 'dobbelt_merke', tekst: `Merket «${m.slug}» står flere ganger i data/brands.json` })
      continue
    }
    const merke = { slug: m.slug, navn: normaliserNavn(m.name) }
    merker.push(merke)
    merkeEtterSlug.set(m.slug, merke)
  }

  const kunIButikk = new Set<string>(MERKER_KUN_I_BUTIKK.map((navn) => sammenlignbar(navn)))
  const attributter = new Map<string, { navn: string; termer: Map<string, string> }>()
  const brukteRaa = new Set<string>()
  const produkter: Produkt[] = []

  for (const p of filer.produkter) {
    const navn = dekodEntiteter(p.name)
    if (p.type !== 'simple' && p.type !== 'variable') {
      feil.push(produktMelding(p, 'ukjent_type', `Produkttypen «${p.type}» støttes ikke av importen`))
      continue
    }

    // Merke
    let merke: Merke | null = null
    if (p.brand_slug) {
      merke = merkeEtterSlug.get(p.brand_slug) ?? null
      if (!merke) {
        merke = { slug: p.brand_slug, navn: normaliserNavn(p.brand ?? p.brand_slug) }
        merker.push(merke)
        merkeEtterSlug.set(merke.slug, merke)
        meldinger.push(
          produktMelding(p, 'merke_utenfor_listen', `Merket «${merke.navn}» mangler i brands.json`),
        )
      }
    } else {
      meldinger.push(produktMelding(p, 'mangler_merke', 'Produktet har ikke noe merke og må merkes manuelt'))
    }
    const pwbMerke = p.legacy_brand
      ? { slug: p.legacy_brand.slug, navn: normaliserNavn(p.legacy_brand.name) }
      : null
    if (merke && !pwbMerke) {
      meldinger.push(
        produktMelding(
          p,
          'merke_uten_pwb',
          `Merket «${merke.navn}» er utledet av produktnavnet; produktet har ikke PWB-merke i dag`,
        ),
      )
    }
    const merkenavn = [merke?.navn, pwbMerke?.navn].filter((n): n is string => Boolean(n))
    if (merkenavn.some((n) => kunIButikk.has(sammenlignbar(n)))) {
      meldinger.push(
        produktMelding(
          p,
          'kun_i_butikk',
          `«${merkenavn[0]}» står på listen over merker som ikke selges på nett. Importeres uendret – må avklares.`,
        ),
      )
    }

    // Kategorier
    const kategoriSlugs: string[] = []
    for (const k of p.categories) {
      if (kjenteKategorier.has(k.slug)) kategoriSlugs.push(k.slug)
      else meldinger.push(produktMelding(p, 'ukjent_kategori', `Kategorien «${k.slug}» finnes ikke i treet`))
    }

    // Beskrivelser
    const beskrivelse = tekstTilHtml(p.description)
    if (!beskrivelse)
      meldinger.push(produktMelding(p, 'mangler_beskrivelse', 'Produktet har ingen beskrivelse'))
    const kortBeskrivelse = tekstTilHtml(p.short_description)

    // Pris (enkle produkter; variable får pris på variantene)
    let ordinaerOre: number | null = null
    let tilbudOre: number | null = null
    if (p.type === 'simple') {
      try {
        const ordinaer = p.regular_price ?? p.price
        ordinaerOre = ordinaer === null ? null : kronerTilOre(ordinaer)
        const salg = p.sale_price === null ? null : kronerTilOre(p.sale_price)
        if (p.on_sale && salg !== null && ordinaerOre !== null && salg < ordinaerOre) tilbudOre = salg
      } catch (e) {
        feil.push(produktMelding(p, 'ugyldig_pris', e instanceof Error ? e.message : String(e)))
        continue
      }
      if (ordinaerOre === null) {
        meldinger.push(produktMelding(p, 'mangler_pris', 'Enkelt produkt uten pris – kan ikke kjøpes'))
      }
      if (p.on_sale && tilbudOre !== null) {
        meldinger.push(
          produktMelding(
            p,
            'tilbud_uten_periode',
            'På tilbud i kilden; tilbudsperioden er ukjent, så tilbudsprisen står til den fjernes',
          ),
        )
      } else if (p.on_sale) {
        meldinger.push(
          produktMelding(p, 'tilbud_uten_tilbudspris', 'Merket på tilbud uten lavere tilbudspris'),
        )
      }
    }

    // Attributter
    const produktAttributter: ProduktAttributt[] = []
    let attributtFeil = false
    p.attributes.forEach((a, posisjon) => {
      if (a.options.length !== a.option_slugs.length) {
        feil.push(
          produktMelding(p, 'ugyldig_attributt', `Attributtet «${a.name}» har ulikt antall navn og slugs`),
        )
        attributtFeil = true
        return
      }
      const slug = attributtSlug(a.name)
      const termer: Term[] = a.option_slugs.map((s, i) => ({
        slug: s,
        navn: normaliserNavn(a.options[i] ?? s),
      }))
      const global = attributter.get(slug) ?? {
        navn: normaliserNavn(a.name),
        termer: new Map<string, string>(),
      }
      for (const t of termer) {
        const tidligere = global.termer.get(t.slug)
        if (tidligere !== undefined && tidligere !== t.navn) {
          meldinger.push(
            produktMelding(
              p,
              'termnavn_avvik',
              `Termen ${slug}/${t.slug} heter både «${tidligere}» og «${t.navn}»`,
            ),
          )
        } else {
          global.termer.set(t.slug, t.navn)
        }
      }
      attributter.set(slug, global)
      produktAttributter.push({ slug, posisjon, variasjon: a.variation, termer })
    })
    if (attributtFeil) continue

    // Bilder: samme rekkefølge som kilden, uten gjentatte bilder
    const sett = new Set<string>()
    const bilder: Bilde[] = []
    for (const b of p.images) {
      const src = b.src.trim()
      if (!src || sett.has(src)) continue
      sett.add(src)
      bilder.push({ src, alt: b.alt ?? '' })
    }
    if (bilder.length < p.images.length) {
      meldinger.push(
        produktMelding(
          p,
          'doble_bilder',
          `Samme bilde står flere ganger i galleriet (${p.images.length} → ${bilder.length} bilder)`,
        ),
      )
    }

    // Lager og varianter
    let lager: Lager
    const variasjoner: Variasjon[] = []
    if (p.type === 'simple') {
      const tolket = tolkLager({
        iLager: p.in_stock,
        lavtLager: p.low_stock_remaining,
        maks: p.max_quantity,
        tekst: p.stock_text,
        restordre: p.on_backorder ?? false,
      })
      lager = tolket.lager
      if (tolket.merknad) meldinger.push(produktMelding(p, tolket.merknad, lagermerknadTekst(tolket.merknad)))
      if (p.variations.length > 0) {
        meldinger.push(
          produktMelding(p, 'varianter_paa_enkelt', 'Enkelt produkt med varianter – variantene hoppes over'),
        )
      }
    } else {
      lager = { styring: 'variantene' }
      p.variations.forEach((v, rekkefolge) => {
        brukteRaa.add(String(v.id))
        const variasjon = byggVariasjon(filer, p, v, rekkefolge, variasjoner, meldinger, feil)
        if (variasjon) variasjoner.push(variasjon)
      })
      const forelderStyrt = p.low_stock_remaining !== null || p.max_quantity < UBEGRENSET
      const iLager = variasjoner.filter(
        (v) => v.lager.styring !== 'variantene' && v.lager.status === 'instock',
      )
      if (forelderStyrt || (!p.in_stock && iLager.length > 0)) {
        meldinger.push(
          produktMelding(
            p,
            'forelder_lager_avvik',
            `Forelderen har eget lager i butikken (${p.in_stock ? 'på lager' : 'utsolgt'}, ` +
              `low_stock_remaining ${p.low_stock_remaining ?? '–'}, maks ${p.max_quantity}) mens ` +
              `${iLager.length} av ${variasjoner.length} varianter er på lager. Forelderen importeres uten ` +
              'lagerstyring, så WooCommerce avleder status fra variantene.',
          ),
        )
      }
    }

    produkter.push({
      kildeId: p.id,
      type: p.type,
      navn,
      slug: p.slug,
      sku: p.sku?.trim() || null,
      merke,
      pwbMerke,
      kategoriSlugs,
      beskrivelse,
      kortBeskrivelse,
      ordinaerOre,
      tilbudOre,
      lager,
      attributter: produktAttributter,
      bilder,
      variasjoner,
      opprettet: p.date_created,
      kildeUrl: p.source_url,
    })
  }

  for (const id of Object.keys(filer.variasjonerRaa)) {
    if (!brukteRaa.has(id)) {
      meldinger.push({
        kode: 'raadata_uten_produkt',
        tekst: `Variasjon ${id} i raw/variations_raw.json har ikke noe produkt`,
      })
    }
  }

  const ferdigeAttributter: Attributt[] = [...attributter].map(([slug, a]) => ({
    slug,
    navn: a.navn,
    termer: [...a.termer].map(([termSlug, navn]) => ({ slug: termSlug, navn })),
  }))
  for (const a of ferdigeAttributter) {
    if (!KJENTE_ATTRIBUTTER.has(a.slug)) {
      const antall = produkter.filter((p) => p.attributter.some((pa) => pa.slug === a.slug)).length
      meldinger.push({
        kode: 'ekstra_attributt',
        tekst:
          `Kilden har også den globale attributten «${a.navn}» (${a.slug}, ${a.termer.length} termer) på ` +
          `${antall} produkt(er). Den opprettes, ellers kan variantene ikke importeres.`,
      })
    }
  }

  return {
    kategorier,
    merker,
    attributter: ferdigeAttributter,
    produkter,
    meldinger,
    feil,
    antall: {
      produkter: filer.produkter.length,
      enkle: filer.produkter.filter((p) => p.type === 'simple').length,
      variable: filer.produkter.filter((p) => p.type === 'variable').length,
      variasjoner: filer.produkter.reduce(
        (sum, p) => sum + (p.type === 'variable' ? p.variations.length : 0),
        0,
      ),
      kategorier: kategorier.length,
      merker: filer.merker.length,
    },
  }
}

function lagermerknadTekst(merknad: Lagermerknad): string {
  return merknad === 'lager_uenig'
    ? 'Antallene i kilden (maks i kurv, low_stock_remaining, lagertekst) er uenige – importeres uten lagerstyring'
    : 'Utsolgt, men Store API begrenset kurven til 1 – beholdningen er trolig negativ i butikken. Importeres som 0.'
}

function byggVariasjon(
  filer: KildeFiler,
  p: ProduktJson,
  v: VariasjonJson,
  rekkefolge: number,
  tidligere: Variasjon[],
  meldinger: Melding[],
  feil: Melding[],
): Variasjon | null {
  const raa = filer.variasjonerRaa[String(v.id)]
  const melding = (kode: string, tekst: string): Melding => ({
    kode,
    tekst,
    kildeId: v.id,
    sku: raa?.sku || v.sku || null,
    navn: `${dekodEntiteter(p.name)} – ${Object.values(v.attribute_labels).join(', ')}`,
  })
  if (!raa)
    meldinger.push(melding('mangler_raadata', 'Mangler i raw/variations_raw.json – bruker products.json'))
  else if (raa.parent !== p.id) {
    feil.push(melding('feil_forelder', `raw/variations_raw.json sier forelder ${raa.parent}, ikke ${p.id}`))
    return null
  }

  const sku = (raa ? raa.sku : v.sku)?.trim() || null
  if (raa && (v.sku ?? '') !== (raa.sku ?? '')) {
    meldinger.push(
      melding('sku_avvik_kilder', `SKU «${v.sku}» i products.json, «${raa.sku}» i rådata – bruker rådata`),
    )
  }

  let ordinaerOre: number
  let tilbudOre: number | null = null
  try {
    if (raa) {
      if (raa.prices.currency_code !== 'NOK') throw new Error(`Valuta ${raa.prices.currency_code}, ikke NOK`)
      const enhet = raa.prices.currency_minor_unit
      ordinaerOre = minsteEnhetTilOre(raa.prices.regular_price, enhet)
      const salg = minsteEnhetTilOre(raa.prices.sale_price, enhet)
      if (raa.on_sale && salg < ordinaerOre) tilbudOre = salg
      if (v.regular_price !== null && kronerTilOre(v.regular_price) !== ordinaerOre) {
        meldinger.push(
          melding('prisavvik_kilder', 'Ordinær pris er ulik i products.json og rådata – bruker rådata'),
        )
      }
    } else {
      const ordinaer = v.regular_price ?? v.price
      if (ordinaer === null) throw new Error('Variasjonen har ingen pris')
      ordinaerOre = kronerTilOre(ordinaer)
      const salg = v.sale_price === null ? null : kronerTilOre(v.sale_price)
      if (v.on_sale && salg !== null && salg < ordinaerOre) tilbudOre = salg
    }
  } catch (e) {
    feil.push(melding('ugyldig_pris', e instanceof Error ? e.message : String(e)))
    return null
  }
  if (tilbudOre !== null) {
    meldinger.push(melding('tilbud_uten_periode', 'Variasjonen er på tilbud; tilbudsperioden er ukjent'))
  }

  const tolket = raa
    ? tolkLager({
        iLager: raa.is_in_stock,
        lavtLager: raa.low_stock_remaining,
        maks: raa.add_to_cart.maximum,
        tekst: raa.stock_availability.text,
        solgtEnkeltvis: raa.sold_individually,
        restordre: raa.is_on_backorder,
      })
    : tolkLager({
        iLager: v.in_stock,
        lavtLager: v.low_stock_remaining,
        maks: v.max_quantity,
        tekst: v.stock_text,
      })
  if (tolket.merknad) meldinger.push(melding(tolket.merknad, lagermerknadTekst(tolket.merknad)))

  const valg = Object.entries(v.attributes).map(([navn, termSlug]) => ({
    attributtSlug: attributtSlug(navn),
    term: { slug: termSlug, navn: normaliserNavn(v.attribute_labels[navn] ?? termSlug) },
  }))
  for (const { attributtSlug: slug, term } of valg) {
    const pa = p.attributes.find((a) => attributtSlug(a.name) === slug)
    if (!pa || !pa.option_slugs.includes(term.slug)) {
      feil.push(melding('ukjent_variantvalg', `Valget ${slug}=${term.slug} finnes ikke på produktet`))
      return null
    }
  }

  // Samme valg som en tidligere variasjon: WooCommerce bruker den første. Kilden har merket dem
  // med `duplicate_of`; vi sjekker i tillegg selv, så en umerket dobbel også blir fanget.
  const nokkel = valgNokkel(valg)
  const lik = tidligere.find((t) => t.dobbeltAv === null && valgNokkel(t.valg) === nokkel)
  const dobbeltAv = v.duplicate_of ?? lik?.kildeId ?? null
  if (v.duplicate_of !== undefined && lik && lik.kildeId !== v.duplicate_of) {
    meldinger.push(
      melding('dobbel_uenig', `duplicate_of=${v.duplicate_of}, men første med samme valg er ${lik.kildeId}`),
    )
  }

  return {
    kildeId: v.id,
    forelderKildeId: p.id,
    sku,
    valg,
    ordinaerOre,
    tilbudOre,
    lager: tolket.lager,
    beskrivelse: tekstTilHtml(v.description),
    bilde: v.image?.trim() || null,
    rekkefolge,
    dobbeltAv,
  }
}

export function valgNokkel(valg: Variasjon['valg']): string {
  return valg
    .map((v) => `${v.attributtSlug}=${v.term.slug}`)
    .sort()
    .join('&')
}
