// Planlegging: kilde + det som finnes i staging → plan. Rene funksjoner, ingen nettverk.
//
// Produkter og varianter matches på SKU (uten SKU: produkter på slug, varianter på valg). Det som
// finnes, oppdateres bare i feltene som faktisk er ulike – en ny kjøring gir «uendret», ikke duplikater.
// Importen sletter aldri noe; det som bare finnes i staging, meldes.

import { oreTilPris, prisTilOre } from './penger'
import { valgNokkel } from './kilde'
import { attributtNokkel, normaliserHtml, normaliserNavn } from './tekst'
import type {
  Attributt,
  Avstemmingslinje,
  Eksisterende,
  Handling,
  Kategori,
  Kilde,
  Lager,
  Lagerstatus,
  Melding,
  Merke,
  Plan,
  Post,
  Produkt,
  TermOnske,
  Variasjon,
  WooProdukt,
  WooTerm,
  WooVariasjon,
} from './typer'

export function tomButikk(): Eksisterende {
  return {
    kilde: 'tom',
    kategorier: [],
    merker: [],
    merkerStottes: true,
    attributter: [],
    termer: {},
    produkter: [],
    variasjoner: {},
    innstillinger: {},
  }
}

// ---------------------------------------------------------------------------------------------
// Hovedfunksjonen
// ---------------------------------------------------------------------------------------------

export function lagPlan(kilde: Kilde, eks: Eksisterende): Plan {
  const advarsler: Melding[] = [...kilde.meldinger]
  const feil: Melding[] = [...kilde.feil]
  const blokkerende = kontrollerForutsetninger(eks, advarsler)

  const kategorier = planleggKategorier(kilde.kategorier, eks.kategorier, advarsler, feil)
  const merker = planleggMerker(kilde.merker, eks)
  const { attributter, termer } = planleggAttributter(kilde.attributter, eks)
  const skuKonflikter = finnDuplikateSkuer(kilde, advarsler)
  const produkter = planleggProdukter(kilde.produkter, eks, skuKonflikter, advarsler, feil)
  const { variasjoner, bareIStagingVariasjoner } = planleggVariasjoner(
    kilde.produkter,
    produkter,
    eks,
    skuKonflikter,
    advarsler,
    feil,
  )

  const kildeKategorier = new Set(kilde.kategorier.map((k) => k.slug))
  const kildeMerker = new Set(kilde.merker.map((m) => m.slug))
  const matchedeProdukter = new Set(produkter.map((p) => p.id).filter((id): id is number => id !== null))

  const doble = variasjoner.filter((v) => v.onske.dobbeltAv !== null).length
  const antallTermer = kilde.attributter.reduce((sum, a) => sum + a.termer.length, 0)
  const avstemming: Avstemmingslinje[] = [
    avstem('Produkter', kilde.antall.produkter, kilde.antall.produkter, produkter),
    avstem(
      'Variasjoner',
      kilde.antall.variasjoner,
      kilde.antall.variasjoner - doble,
      variasjoner,
      doble > 0 ? `${doble} doble variasjoner importeres ikke` : undefined,
    ),
    avstem('Kategorier', kilde.antall.kategorier, kilde.antall.kategorier, kategorier),
    avstem('Merker', kilde.antall.merker, kilde.merker.length, merker),
    avstem('Attributter', kilde.attributter.length, kilde.attributter.length, attributter),
    avstem('Attributtermer', antallTermer, antallTermer, termer),
  ]

  return {
    kategorier,
    merker,
    attributter,
    termer,
    produkter,
    variasjoner,
    advarsler,
    feil,
    blokkerende,
    bareIStaging: {
      kategorier: eks.kategorier.filter((k) => !kildeKategorier.has(k.slug)),
      merker: eks.merker.filter((m) => !kildeMerker.has(m.slug)),
      produkter: eks.produkter
        .filter((p) => !matchedeProdukter.has(p.id))
        .map((p) => ({ id: p.id, sku: p.sku, navn: normaliserNavn(p.name) })),
      variasjoner: bareIStagingVariasjoner,
    },
    avstemming,
  }
}

function avstem<T>(
  type: string,
  iKilden: number,
  forventet: number,
  poster: Post<T>[],
  merknad?: string,
): Avstemmingslinje {
  const telle = (h: Handling) => poster.filter((p) => p.handling === h).length
  const opprett = telle('opprett')
  const oppdater = telle('oppdater')
  const uendret = telle('uendret')
  return {
    type,
    iKilden,
    hoppesOver: telle('hopp_over'),
    forventet,
    opprett,
    oppdater,
    uendret,
    stemmer: opprett + oppdater + uendret === forventet,
    ...(merknad ? { merknad } : {}),
  }
}

// ---------------------------------------------------------------------------------------------
// Forutsetninger i staging
// ---------------------------------------------------------------------------------------------

/** Innstillinger importen forutsetter: [gruppe/id, forventet verdi, blokkerer apply?, forklaring]. */
export const INNSTILLINGER: [string, string, boolean, string][] = [
  ['general/woocommerce_currency', 'NOK', true, 'Valutaen må være NOK – kildeprisene er i NOK'],
  [
    'tax/woocommerce_prices_include_tax',
    'yes',
    true,
    'Priser må legges inn inkl. mva. – kildeprisene er inkl. mva., ellers legges mva. på en gang til',
  ],
  [
    'products/woocommerce_manage_stock',
    'yes',
    true,
    'Lagerstyring må være slått på – ellers ignorerer WooCommerce lagerantallene',
  ],
  [
    'products/woocommerce_notify_low_stock_amount',
    '2',
    false,
    'Terskelen for lavt lager er 2 i butikken i dag (Store API viser «få igjen» ved 1–2)',
  ],
]

function kontrollerForutsetninger(eks: Eksisterende, advarsler: Melding[]): string[] {
  if (eks.kilde === 'tom') return []
  const blokkerende: string[] = []
  if (!eks.merkerStottes) {
    blokkerende.push(
      'WooCommerce Brands (/wc/v3/products/brands) svarer ikke i staging – krever WooCommerce 9.6+ med Brands. ' +
        'Merkene kan ikke importeres.',
    )
  }
  for (const [id, forventet, blokkerer, forklaring] of INNSTILLINGER) {
    const verdi = eks.innstillinger[id]
    if (verdi === undefined || verdi === null) {
      advarsler.push({ kode: 'innstilling_ukjent', tekst: `Kunne ikke lese ${id}. ${forklaring}.` })
    } else if (verdi !== forventet) {
      const tekst = `${id} er «${verdi}», forventet «${forventet}». ${forklaring}.`
      if (blokkerer) blokkerende.push(tekst)
      else advarsler.push({ kode: 'innstilling_avvik', tekst })
    }
  }
  return blokkerende
}

// ---------------------------------------------------------------------------------------------
// Kategorier, merker, attributter
// ---------------------------------------------------------------------------------------------

/** Sorterer slik at en forelder alltid står før barna, uansett rekkefølge inn. Stabil. */
export function sorterForelderForBarn<T extends { slug: string; forelderSlug: string | null }>(
  liste: T[],
): T[] {
  const slugs = new Set(liste.map((k) => k.slug))
  const plassert = new Set<string>()
  const ut: T[] = []
  let igjen = [...liste]
  while (igjen.length > 0) {
    const neste: T[] = []
    for (const k of igjen) {
      if (k.forelderSlug === null || plassert.has(k.forelderSlug)) {
        ut.push(k)
        plassert.add(k.slug)
      } else if (!slugs.has(k.forelderSlug)) {
        throw new Error(`Kategorien «${k.slug}» har en forelder som ikke finnes: «${k.forelderSlug}»`)
      } else {
        neste.push(k)
      }
    }
    if (neste.length === igjen.length) throw new Error('Kategoritreet har en sirkel')
    igjen = neste
  }
  return ut
}

function planleggKategorier(
  kilde: Kategori[],
  eks: WooTerm[],
  advarsler: Melding[],
  feil: Melding[],
): Post<Kategori>[] {
  let sortert: Kategori[]
  try {
    sortert = sorterForelderForBarn(kilde)
  } catch (e) {
    feil.push({ kode: 'kategoritre', tekst: e instanceof Error ? e.message : String(e) })
    return []
  }
  const etterSlug = new Map(eks.map((k) => [k.slug, k]))
  const etterId = new Map(eks.map((k) => [k.id, k]))
  const dybde = new Map<string, number>()
  const forelderSlug = (k: WooTerm) => (k.parent ? (etterId.get(k.parent)?.slug ?? null) : null)

  return sortert.map((k) => {
    const d = k.forelderSlug === null ? 0 : (dybde.get(k.forelderSlug) ?? 0) + 1
    dybde.set(k.slug, d)
    const onske = { ...k, dybde: d }
    const nokkel = `kategori:${k.slug}`
    const finnes = etterSlug.get(k.slug)
    if (!finnes) {
      const sosken = eks.find((e) => normaliserNavn(e.name) === k.navn && forelderSlug(e) === k.forelderSlug)
      if (sosken) {
        advarsler.push({
          kode: 'kategorinavn_opptatt',
          tekst:
            `Kategorien «${k.navn}» (${k.slug}) finnes i staging med en annen slug (${sosken.slug}); ` +
            'WordPress tillater ikke to søsken med samme navn.',
        })
      }
      return { handling: 'opprett', nokkel, id: null, onske, endringer: [] }
    }
    const endringer: string[] = []
    if (normaliserNavn(finnes.name) !== k.navn) endringer.push('navn')
    if (forelderSlug(finnes) !== k.forelderSlug) endringer.push('forelder')
    return {
      handling: endringer.length > 0 ? 'oppdater' : 'uendret',
      nokkel,
      id: finnes.id,
      onske,
      endringer,
    }
  })
}

function planleggMerker(kilde: Merke[], eks: Eksisterende): Post<Merke>[] {
  const etterSlug = new Map(eks.merker.map((m) => [m.slug, m]))
  return kilde.map((m) => {
    const nokkel = `merke:${m.slug}`
    if (!eks.merkerStottes) {
      return {
        handling: 'hopp_over',
        nokkel,
        id: null,
        onske: m,
        endringer: [],
        grunn: 'Brands mangler i staging',
      }
    }
    const finnes = etterSlug.get(m.slug)
    if (!finnes) return { handling: 'opprett', nokkel, id: null, onske: m, endringer: [] }
    const endringer = normaliserNavn(finnes.name) === m.navn ? [] : ['navn']
    return {
      handling: endringer.length > 0 ? 'oppdater' : 'uendret',
      nokkel,
      id: finnes.id,
      onske: m,
      endringer,
    }
  })
}

function planleggAttributter(
  kilde: Attributt[],
  eks: Eksisterende,
): { attributter: Post<Attributt>[]; termer: Post<TermOnske>[] } {
  const etterNokkel = new Map(eks.attributter.map((a) => [attributtNokkel(a.slug), a]))
  const attributter: Post<Attributt>[] = []
  const termer: Post<TermOnske>[] = []
  for (const a of kilde) {
    const finnes = etterNokkel.get(attributtNokkel(a.slug))
    const endringer = finnes && normaliserNavn(finnes.name) !== a.navn ? ['navn'] : []
    attributter.push({
      handling: finnes ? (endringer.length > 0 ? 'oppdater' : 'uendret') : 'opprett',
      nokkel: `attributt:${a.slug}`,
      id: finnes?.id ?? null,
      onske: a,
      endringer,
    })
    const eksTermer = new Map((finnes ? (eks.termer[finnes.id] ?? []) : []).map((t) => [t.slug, t]))
    for (const t of a.termer) {
      const term = eksTermer.get(t.slug)
      const termEndringer = term && normaliserNavn(term.name) !== t.navn ? ['navn'] : []
      termer.push({
        handling: term ? (termEndringer.length > 0 ? 'oppdater' : 'uendret') : 'opprett',
        nokkel: `term:${a.slug}:${t.slug}`,
        id: term?.id ?? null,
        onske: { ...t, attributtSlug: a.slug },
        endringer: termEndringer,
      })
    }
  }
  return { attributter, termer }
}

// ---------------------------------------------------------------------------------------------
// SKU-er
// ---------------------------------------------------------------------------------------------

/**
 * Finner SKU-er som står flere ganger i kilden (produkter og varianter i samme pulje – WooCommerce
 * krever unike SKU-er på tvers). Alt meldes. Gir tilbake SKU-ene som fortsatt kolliderer når doble
 * variasjoner (som uansett hoppes over) er regnet bort; de importeres ikke.
 */
export function finnDuplikateSkuer(kilde: Kilde, advarsler: Melding[]): Set<string> {
  const forekomster = new Map<string, { hva: string; dobbel: boolean }[]>()
  const legg = (sku: string | null, hva: string, dobbel: boolean) => {
    if (!sku) return
    const liste = forekomster.get(sku) ?? []
    liste.push({ hva, dobbel })
    forekomster.set(sku, liste)
  }
  for (const p of kilde.produkter) {
    legg(p.sku, `produkt ${p.kildeId}`, false)
    for (const v of p.variasjoner) legg(v.sku, `variasjon ${v.kildeId} (${p.navn})`, v.dobbeltAv !== null)
  }
  const konflikter = new Set<string>()
  for (const [sku, liste] of forekomster) {
    if (liste.length < 2) continue
    const aktive = liste.filter((f) => !f.dobbel)
    const loses = aktive.length <= 1
    if (!loses) konflikter.add(sku)
    advarsler.push({
      kode: 'duplikat_sku',
      tekst:
        `SKU ${sku} brukes ${liste.length} ganger: ${liste.map((f) => f.hva).join(', ')}. ` +
        (loses ? 'Løses ved at den doble variasjonen hoppes over.' : 'Importeres ikke før kilden er rettet.'),
    })
  }
  return konflikter
}

// ---------------------------------------------------------------------------------------------
// Produkter
// ---------------------------------------------------------------------------------------------

function produktMelding(p: Produkt, kode: string, tekst: string): Melding {
  return { kode, tekst, kildeId: p.kildeId, sku: p.sku, navn: p.navn }
}

function planleggProdukter(
  kilde: Produkt[],
  eks: Eksisterende,
  skuKonflikter: Set<string>,
  advarsler: Melding[],
  feil: Melding[],
): Post<Produkt>[] {
  const etterSku = new Map(eks.produkter.filter((p) => p.sku).map((p) => [p.sku, p]))
  const etterSlug = new Map(eks.produkter.map((p) => [p.slug, p]))
  const variantSkuer = new Set(
    Object.values(eks.variasjoner)
      .flat()
      .map((v) => v.sku)
      .filter(Boolean),
  )
  const attributtSlugEtterId = new Map(eks.attributter.map((a) => [a.id, a.slug]))

  return kilde.map((p): Post<Produkt> => {
    const nokkel = p.sku ? `sku:${p.sku}` : `slug:${p.slug}`
    const hopp = (grunn: string, id: number | null = null): Post<Produkt> => ({
      handling: 'hopp_over',
      nokkel,
      id,
      onske: p,
      endringer: [],
      grunn,
    })

    if (p.sku && skuKonflikter.has(p.sku)) {
      feil.push(
        produktMelding(p, 'duplikat_sku', `SKU ${p.sku} står flere ganger i kilden – importeres ikke`),
      )
      return hopp('duplikat SKU i kilden')
    }
    let finnes: WooProdukt | undefined
    if (p.sku) {
      finnes = etterSku.get(p.sku)
      if (!finnes && variantSkuer.has(p.sku)) {
        feil.push(produktMelding(p, 'sku_i_bruk', `SKU ${p.sku} brukes av en variasjon i staging`))
        return hopp('SKU brukes av en variasjon i staging')
      }
      const slugTreff = etterSlug.get(p.slug)
      if (!finnes && slugTreff) {
        advarsler.push(
          produktMelding(
            p,
            'slug_opptatt',
            `Slugen «${p.slug}» brukes i staging av produkt ${slugTreff.id} med SKU «${slugTreff.sku}»; ` +
              'WooCommerce gir det nye produktet en annen slug.',
          ),
        )
      }
    } else {
      finnes = etterSlug.get(p.slug)
      advarsler.push(
        produktMelding(
          p,
          'uten_sku',
          `Produktet har ingen SKU og matches på slug «${p.slug}»${finnes ? ` (produkt ${finnes.id} i staging)` : ''}`,
        ),
      )
    }

    if (!finnes) {
      return {
        handling: 'opprett',
        nokkel,
        id: null,
        onske: p,
        endringer: [],
        sendBilder: p.bilder.length > 0,
      }
    }
    if (finnes.type !== p.type) {
      feil.push(
        produktMelding(
          p,
          'typeavvik',
          `Produkt ${finnes.id} i staging er «${finnes.type}», kilden er «${p.type}»`,
        ),
      )
      return hopp('ulik produkttype i staging', finnes.id)
    }
    const { endringer, sendBilder } = sammenlignProdukt(p, finnes, attributtSlugEtterId, advarsler)
    return {
      handling: endringer.length > 0 ? 'oppdater' : 'uendret',
      nokkel,
      id: finnes.id,
      onske: p,
      endringer,
      sendBilder,
    }
  })
}

function sammeMengde(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sa = [...a].sort()
  const sb = [...b].sort()
  return sa.every((x, i) => x === sb[i])
}

export function lagerLikt(
  onske: Lager,
  styrt: boolean | 'parent',
  antall: number | null,
  status: string,
): boolean {
  switch (onske.styring) {
    case 'antall':
      return styrt === true && antall === onske.antall && status === onske.status
    case 'status':
      return styrt === false && status === onske.status
    case 'variantene':
      return styrt === false
  }
}

function sammenlignProdukt(
  p: Produkt,
  w: WooProdukt,
  attributtSlugEtterId: Map<number, string>,
  advarsler: Melding[],
): { endringer: string[]; sendBilder: boolean } {
  const endringer: string[] = []
  if (normaliserNavn(w.name) !== normaliserNavn(p.navn)) endringer.push('navn')
  if (w.slug !== p.slug) endringer.push('slug')
  if (
    p.type === 'simple' &&
    (prisTilOre(w.regular_price) !== p.ordinaerOre || prisTilOre(w.sale_price) !== p.tilbudOre)
  ) {
    endringer.push('pris')
  }
  if (normaliserHtml(w.description) !== normaliserHtml(p.beskrivelse)) endringer.push('beskrivelse')
  if (normaliserHtml(w.short_description) !== normaliserHtml(p.kortBeskrivelse))
    endringer.push('kortBeskrivelse')
  if (
    !sammeMengde(
      w.categories.map((c) => c.slug),
      p.kategoriSlugs,
    )
  ) {
    endringer.push('kategorier')
  }

  const merker = (w.brands ?? []).map((b) => b.slug)
  if (p.merke) {
    if (!(merker.length === 1 && merker[0] === p.merke.slug)) endringer.push('merke')
  } else if (merker.length > 0) {
    advarsler.push(
      produktMelding(
        p,
        'merke_kan_ikke_fjernes',
        `Produktet har merke (${merker.join(', ')}) i staging, men ikke i kilden; REST API kan ikke fjerne det`,
      ),
    )
  }

  const stagingAttributter = w.attributes.map((a) => ({
    nokkel: a.id > 0 ? attributtNokkel(attributtSlugEtterId.get(a.id) ?? `#${a.id}`) : `lokal:${a.name}`,
    variasjon: a.variation,
    termer: a.options.map(normaliserNavn).sort(),
  }))
  const likeAttributter =
    stagingAttributter.length === p.attributter.length &&
    p.attributter.every((a) => {
      const s = stagingAttributter.find((x) => x.nokkel === attributtNokkel(a.slug))
      const termer = a.termer.map((t) => t.navn).sort()
      return s !== undefined && s.variasjon === a.variasjon && sammeMengde(s.termer, termer)
    })
  if (!likeAttributter) endringer.push('attributter')

  if (!lagerLikt(p.lager, w.manage_stock, w.stock_quantity, w.stock_status)) endringer.push('lager')

  let sendBilder = false
  if (p.bilder.length > 0 && w.images.length === 0) {
    sendBilder = true
    endringer.push('bilder')
  } else if (w.images.length !== p.bilder.length) {
    advarsler.push(
      produktMelding(
        p,
        'bildeantall_avvik',
        `Staging har ${w.images.length} bilder, kilden ${p.bilder.length}. Bildene røres ikke (unngår duplikater i mediebiblioteket).`,
      ),
    )
  }
  return { endringer, sendBilder }
}

// ---------------------------------------------------------------------------------------------
// Varianter
// ---------------------------------------------------------------------------------------------

function variasjonMelding(p: Produkt, v: Variasjon, kode: string, tekst: string): Melding {
  return {
    kode,
    tekst,
    kildeId: v.kildeId,
    sku: v.sku,
    navn: `${p.navn} – ${v.valg.map((x) => x.term.navn).join(', ')}`,
  }
}

/** Valg uttrykt med termnavn, for å matche varianter uten SKU mot staging (der `option` er navnet). */
function navneNokkel(par: { attributt: string; navn: string }[]): string {
  return par
    .map((x) => `${attributtNokkel(x.attributt)}=${normaliserNavn(x.navn).toLowerCase()}`)
    .sort()
    .join('&')
}

function planleggVariasjoner(
  kilde: Produkt[],
  produktPoster: Post<Produkt>[],
  eks: Eksisterende,
  skuKonflikter: Set<string>,
  advarsler: Melding[],
  feil: Melding[],
): { variasjoner: Post<Variasjon>[]; bareIStagingVariasjoner: Plan['bareIStaging']['variasjoner'] } {
  const forelderPost = new Map(produktPoster.map((p) => [p.onske.kildeId, p]))
  const attributtSlugEtterId = new Map(eks.attributter.map((a) => [a.id, a.slug]))
  const produktSkuer = new Set(eks.produkter.map((p) => p.sku).filter(Boolean))
  const variantEtterSku = new Map<string, number>()
  for (const [forelderId, liste] of Object.entries(eks.variasjoner)) {
    for (const v of liste) if (v.sku) variantEtterSku.set(v.sku, Number(forelderId))
  }
  const wooNokkel = (w: WooVariasjon) =>
    navneNokkel(
      w.attributes.map((a) => ({
        attributt: attributtSlugEtterId.get(a.id) ?? a.name ?? '',
        navn: a.option,
      })),
    )

  const ut: Post<Variasjon>[] = []
  const bareIStaging: Plan['bareIStaging']['variasjoner'] = []

  for (const p of kilde) {
    if (p.type !== 'variable') continue
    const forelder = forelderPost.get(p.kildeId)
    const eksVar = forelder?.id ? (eks.variasjoner[forelder.id] ?? []) : []
    const brukt = new Set<number>()

    for (const v of p.variasjoner) {
      const nokkel = v.sku ? `sku:${v.sku}` : `variasjon:${p.kildeId}:${valgNokkel(v.valg)}`
      const hopp = (grunn: string): Post<Variasjon> => ({
        handling: 'hopp_over',
        nokkel,
        id: null,
        onske: v,
        endringer: [],
        grunn,
      })

      if (v.dobbeltAv !== null) {
        advarsler.push(
          variasjonMelding(
            p,
            v,
            'dobbel_variasjon',
            `Variasjon ${v.kildeId} har samme valg som ${v.dobbeltAv}. WooCommerce bruker den første; ` +
              'denne importeres ikke og bør slettes i butikken.',
          ),
        )
        ut.push(hopp(`samme valg som variasjon ${v.dobbeltAv}`))
        continue
      }
      if (!forelder || forelder.handling === 'hopp_over') {
        ut.push(hopp('forelderen importeres ikke'))
        continue
      }
      if (v.sku && skuKonflikter.has(v.sku)) {
        feil.push(
          variasjonMelding(p, v, 'duplikat_sku', `SKU ${v.sku} står flere ganger i kilden – importeres ikke`),
        )
        ut.push(hopp('duplikat SKU i kilden'))
        continue
      }

      let finnes: WooVariasjon | undefined
      if (v.sku) {
        finnes = eksVar.find((e) => e.sku === v.sku)
        if (!finnes && (variantEtterSku.has(v.sku) || produktSkuer.has(v.sku))) {
          const hvor = variantEtterSku.has(v.sku)
            ? `en variasjon av produkt ${variantEtterSku.get(v.sku)}`
            : 'et produkt'
          feil.push(variasjonMelding(p, v, 'sku_i_bruk', `SKU ${v.sku} brukes av ${hvor} i staging`))
          ut.push(hopp('SKU brukes et annet sted i staging'))
          continue
        }
      } else {
        const onsket = navneNokkel(v.valg.map((x) => ({ attributt: x.attributtSlug, navn: x.term.navn })))
        finnes = eksVar.find((e) => !brukt.has(e.id) && wooNokkel(e) === onsket)
        advarsler.push(
          variasjonMelding(p, v, 'variasjon_uten_sku', 'Variasjonen har ingen SKU og matches på valget'),
        )
      }

      if (!finnes) {
        ut.push({
          handling: 'opprett',
          nokkel,
          id: null,
          onske: v,
          endringer: [],
          sendBilder: v.bilde !== null,
        })
        continue
      }
      brukt.add(finnes.id)
      const { endringer, sendBilder } = sammenlignVariasjon(v, finnes, wooNokkel)
      ut.push({
        handling: endringer.length > 0 ? 'oppdater' : 'uendret',
        nokkel,
        id: finnes.id,
        onske: v,
        endringer,
        sendBilder,
      })
    }

    if (forelder?.id) {
      for (const e of eksVar) {
        if (!brukt.has(e.id)) bareIStaging.push({ id: e.id, forelderId: forelder.id, sku: e.sku })
      }
    }
  }
  return { variasjoner: ut, bareIStagingVariasjoner: bareIStaging }
}

function sammenlignVariasjon(
  v: Variasjon,
  w: WooVariasjon,
  wooNokkel: (w: WooVariasjon) => string,
): { endringer: string[]; sendBilder: boolean } {
  const endringer: string[] = []
  if (prisTilOre(w.regular_price) !== v.ordinaerOre || prisTilOre(w.sale_price) !== v.tilbudOre)
    endringer.push('pris')
  if (!lagerLikt(v.lager, w.manage_stock, w.stock_quantity, w.stock_status)) endringer.push('lager')
  const onsket = navneNokkel(v.valg.map((x) => ({ attributt: x.attributtSlug, navn: x.term.navn })))
  if (wooNokkel(w) !== onsket) endringer.push('attributter')
  if (normaliserHtml(w.description) !== normaliserHtml(v.beskrivelse)) endringer.push('beskrivelse')
  let sendBilder = false
  if (v.bilde !== null && (!w.image || !w.image.id)) {
    sendBilder = true
    endringer.push('bilde')
  }
  return { endringer, sendBilder }
}

// ---------------------------------------------------------------------------------------------
// Nyttelast til WooCommerce REST API v3
// ---------------------------------------------------------------------------------------------

/** Slår opp ID-er i staging. Brukes når planen utføres (ID-ene finnes først da for nye objekter). */
export interface IdOppslag {
  kategori(slug: string): number | undefined
  merke(slug: string): number | undefined
  attributt(slug: string): number | undefined
  bilde(src: string): number | undefined
}

export class ManglerId extends Error {
  constructor(hva: string) {
    super(`Mangler ID i staging for ${hva}`)
    this.name = 'ManglerId'
  }
}

function krev(id: number | undefined, hva: string): number {
  if (id === undefined) throw new ManglerId(hva)
  return id
}

type LagerPayload = { manage_stock: boolean; stock_quantity?: number; stock_status?: Lagerstatus }

function lagerPayload(lager: Lager): LagerPayload {
  switch (lager.styring) {
    case 'antall':
      return { manage_stock: true, stock_quantity: lager.antall, stock_status: lager.status }
    case 'status':
      return { manage_stock: false, stock_status: lager.status }
    case 'variantene':
      // WooCommerce avleder status for et variabelt produkt fra variantene.
      return { manage_stock: false }
  }
}

export interface ProduktPayload extends Partial<LagerPayload> {
  id?: number
  type?: 'simple' | 'variable'
  status?: 'publish'
  name?: string
  slug?: string
  sku?: string
  regular_price?: string
  sale_price?: string
  description?: string
  short_description?: string
  categories?: { id: number }[]
  brands?: { id: number }[]
  attributes?: { id: number; position: number; visible: boolean; variation: boolean; options: string[] }[]
  images?: { src: string; alt: string }[]
  date_created?: string
}

export interface VariasjonPayload extends Partial<LagerPayload> {
  id?: number
  sku?: string
  regular_price?: string
  sale_price?: string
  description?: string
  attributes?: { id: number; option: string }[]
  image?: { id: number } | { src: string }
  menu_order?: number
}

const PRODUKTFELT = [
  'navn',
  'slug',
  'pris',
  'beskrivelse',
  'kortBeskrivelse',
  'kategorier',
  'merke',
  'attributter',
  'lager',
]
const VARIANTFELT = ['pris', 'lager', 'attributter', 'beskrivelse']

/**
 * Nyttelast for ett produkt. Ved `opprett` sendes alt; ved `oppdater` bare feltgruppene som er ulike.
 * Bilder sendes som `{src, alt}` (WooCommerce laster dem ned), i kildens rekkefølge.
 */
export function produktPayload(post: Post<Produkt>, ider: IdOppslag): ProduktPayload {
  const p = post.onske
  const ny = post.handling === 'opprett'
  if (!ny && post.id === null) throw new Error(`Produkt ${post.nokkel} skal oppdateres, men mangler ID`)
  const felt = new Set(ny ? PRODUKTFELT : post.endringer)
  const ut: ProduktPayload = ny
    ? { type: p.type, status: 'publish', date_created: p.opprettet }
    : { id: post.id ?? 0 }
  if (ny && p.sku) ut.sku = p.sku
  if (felt.has('navn')) ut.name = p.navn
  if (felt.has('slug')) ut.slug = p.slug
  if (felt.has('pris') && p.type === 'simple') {
    if (!ny || p.ordinaerOre !== null)
      ut.regular_price = p.ordinaerOre === null ? '' : oreTilPris(p.ordinaerOre)
    if (!ny || p.tilbudOre !== null) ut.sale_price = p.tilbudOre === null ? '' : oreTilPris(p.tilbudOre)
  }
  if (felt.has('beskrivelse') && (!ny || p.beskrivelse)) ut.description = p.beskrivelse
  if (felt.has('kortBeskrivelse') && (!ny || p.kortBeskrivelse)) ut.short_description = p.kortBeskrivelse
  if (felt.has('kategorier')) {
    ut.categories = p.kategoriSlugs.map((slug) => ({ id: krev(ider.kategori(slug), `kategorien ${slug}`) }))
  }
  if (felt.has('merke') && p.merke)
    ut.brands = [{ id: krev(ider.merke(p.merke.slug), `merket ${p.merke.slug}`) }]
  if (felt.has('attributter') && (!ny || p.attributter.length > 0)) {
    ut.attributes = p.attributter.map((a) => ({
      id: krev(ider.attributt(a.slug), `attributtet ${a.slug}`),
      position: a.posisjon,
      visible: true,
      variation: a.variasjon,
      options: a.termer.map((t) => t.navn),
    }))
  }
  if (felt.has('lager')) Object.assign(ut, lagerPayload(p.lager))
  if (post.sendBilder && p.bilder.length > 0) ut.images = p.bilder.map((b) => ({ src: b.src, alt: b.alt }))
  return ut
}

/** Nyttelast for én variasjon. Bilde: ID når bildet alt finnes i staging, ellers `{src}`. */
export function variasjonPayload(
  post: Post<Variasjon>,
  ider: IdOppslag,
  utenBilde = false,
): VariasjonPayload {
  const v = post.onske
  const ny = post.handling === 'opprett'
  if (!ny && post.id === null) throw new Error(`Variasjon ${post.nokkel} skal oppdateres, men mangler ID`)
  const felt = new Set(ny ? VARIANTFELT : post.endringer)
  const ut: VariasjonPayload = ny ? { menu_order: v.rekkefolge } : { id: post.id ?? 0 }
  if (ny && v.sku) ut.sku = v.sku
  if (felt.has('pris')) {
    ut.regular_price = oreTilPris(v.ordinaerOre)
    if (!ny || v.tilbudOre !== null) ut.sale_price = v.tilbudOre === null ? '' : oreTilPris(v.tilbudOre)
  }
  if (felt.has('lager')) Object.assign(ut, lagerPayload(v.lager))
  if (felt.has('attributter')) {
    ut.attributes = v.valg.map((x) => ({
      id: krev(ider.attributt(x.attributtSlug), `attributtet ${x.attributtSlug}`),
      option: x.term.navn,
    }))
  }
  if (felt.has('beskrivelse') && (!ny || v.beskrivelse)) ut.description = v.beskrivelse
  if (post.sendBilder && v.bilde !== null && !utenBilde) {
    const id = ider.bilde(v.bilde)
    ut.image = id !== undefined ? { id } : { src: v.bilde }
  }
  return ut
}

/** Payload for kategorier: forelder som ID (0 = toppnivå). */
export function kategoriPayload(
  post: Post<Kategori>,
  ider: Pick<IdOppslag, 'kategori'>,
): { id?: number; name?: string; slug?: string; parent?: number } {
  const k = post.onske
  const forelder =
    k.forelderSlug === null ? 0 : krev(ider.kategori(k.forelderSlug), `kategorien ${k.forelderSlug}`)
  if (post.handling === 'opprett') return { name: k.navn, slug: k.slug, parent: forelder }
  const ut: { id: number; name?: string; parent?: number } = { id: post.id ?? 0 }
  if (post.endringer.includes('navn')) ut.name = k.navn
  if (post.endringer.includes('forelder')) ut.parent = forelder
  return ut
}
