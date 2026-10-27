// Rapportene: reports/import-dry-run.md + .json (tørrkjøring) og reports/import-apply.md (--apply).

import { INNSTILLINGER } from './plan'
import type { Etterkontroll } from './les'
import type { Objekttype, UtforResultat } from './utfor'
import type { Kilde, Lager, Melding, Plan, Post } from './typer'

export interface RapportMeta {
  tidspunkt: Date
  /** `null` = offline mot tom butikk. */
  staging: string | null
  miljo: string[]
  produkterPerKall: number
}

/** Hardt mellomrom som tusenskille, f.eks. «1 082». */
const TUSENSKILLE = String.fromCodePoint(0xa0)
const tall = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, TUSENSKILLE)
const tid = (d: Date) => `${d.toISOString().slice(0, 16).replace('T', ' ')} UTC`
const jaNei = (b: boolean) => (b ? 'ja' : '**nei**')
const celle = (tekst: string) => tekst.replace(/\|/g, '\\|').replace(/\n/g, ' ')

/** Rekkefølge og overskrift for advarslene i rapporten. `maks` begrenser listen i markdown (alt står i JSON). */
const GRUPPER: { kode: string; tittel: string; forklaring?: string; maks?: number }[] = [
  {
    kode: 'dobbel_variasjon',
    tittel: 'Doble variasjoner – importeres ikke',
    forklaring:
      'Samme valg som en tidligere variasjon. WooCommerce bruker den første; resten bør slettes i butikken.',
  },
  { kode: 'duplikat_sku', tittel: 'Duplikate SKU-er i kilden' },
  {
    kode: 'kun_i_butikk',
    tittel: 'Merker som ikke selges på nett',
    forklaring:
      'Merket står på Reginas liste over merker som bare selges i butikken (restriksjoner fra leverandøren). ' +
      'Produktet er flagget, ikke endret.',
  },
  {
    kode: 'mangler_merke',
    tittel: 'Mangler merke',
    forklaring: 'Importeres uten merke – må merkes manuelt.',
  },
  { kode: 'mangler_beskrivelse', tittel: 'Mangler beskrivelse', maks: 200 },
  { kode: 'forelder_lager_avvik', tittel: 'Lager på forelder og varianter er uenige' },
  {
    kode: 'mulig_negativt_lager',
    tittel: 'Trolig negativ beholdning i butikken',
    forklaring:
      'Utsolgt, men Store API begrenset kurven til 1 – skjer når beholdningen er under 0. Importeres som 0.',
  },
  {
    kode: 'tilbud_uten_periode',
    tittel: 'Tilbud uten kjent periode',
    forklaring:
      'Tilbudsprisen er ekte data, men start- og sluttdato er ikke med i kilden. Den står til den fjernes.',
  },
  {
    kode: 'doble_bilder',
    tittel: 'Samme bilde flere ganger i galleriet',
    forklaring: 'Lastes opp én gang; rekkefølgen ellers som i kilden.',
  },
  { kode: 'ekstra_attributt', tittel: 'Attributter utover Størrelse og Farge' },
  {
    kode: 'merke_uten_pwb',
    tittel: 'Merke utledet av produktnavnet',
    forklaring: 'Produktet har ikke PWB-merke i butikken i dag; merket i importen er gjenkjent fra navnet.',
    maks: 10,
  },
  { kode: 'uten_sku', tittel: 'Produkter uten SKU (matches på slug)' },
  { kode: 'variasjon_uten_sku', tittel: 'Variasjoner uten SKU (matches på valg)' },
  { kode: 'slug_opptatt', tittel: 'Slug brukes allerede i staging' },
  { kode: 'bildeantall_avvik', tittel: 'Ulikt antall bilder i staging og kilden', maks: 50 },
  { kode: 'merke_kan_ikke_fjernes', tittel: 'Merke i staging som ikke finnes i kilden' },
  { kode: 'innstilling_avvik', tittel: 'Innstillinger i staging som avviker' },
  { kode: 'innstilling_ukjent', tittel: 'Innstillinger som ikke kunne leses' },
]

function grupper(
  meldinger: Melding[],
): { kode: string; tittel: string; forklaring?: string; maks: number; liste: Melding[] }[] {
  const etterKode = new Map<string, Melding[]>()
  for (const m of meldinger) etterKode.set(m.kode, [...(etterKode.get(m.kode) ?? []), m])
  const ut: { kode: string; tittel: string; forklaring?: string; maks: number; liste: Melding[] }[] = []
  for (const g of GRUPPER) {
    const liste = etterKode.get(g.kode)
    if (!liste) continue
    ut.push({ ...g, maks: g.maks ?? 100, liste })
    etterKode.delete(g.kode)
  }
  for (const [kode, liste] of etterKode) ut.push({ kode, tittel: kode, maks: 100, liste })
  return ut
}

function meldingLinje(m: Melding): string {
  const hvem = [
    m.navn ? `**${m.navn}**` : null,
    m.kildeId ? `#${m.kildeId}` : null,
    m.sku ? `SKU ${m.sku}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
  return `- ${hvem ? `${hvem} – ` : ''}${m.tekst}`
}

function meldingsliste(meldinger: Melding[], tomTekst: string): string[] {
  if (meldinger.length === 0) return [tomTekst, '']
  const linjer: string[] = []
  for (const g of grupper(meldinger)) {
    linjer.push(`### ${g.tittel} (${tall(g.liste.length)})`, '')
    if (g.forklaring) linjer.push(g.forklaring, '')
    linjer.push(...g.liste.slice(0, g.maks).map(meldingLinje))
    if (g.liste.length > g.maks)
      linjer.push(`- … og ${tall(g.liste.length - g.maks)} til (se JSON-rapporten)`)
    linjer.push('')
  }
  return linjer
}

export interface Lagertall {
  enkle: Record<string, number>
  variasjoner: Record<string, number>
  enheter: number
}

function lagerKategori(l: Lager): string {
  if (l.styring === 'variantene') return 'Lager på variantene (variabelt produkt)'
  if (l.styring === 'antall')
    return l.antall > 0 ? 'Lagerstyring med antall (på lager)' : 'Lagerstyring, antall 0 (utsolgt)'
  if (l.status === 'instock') return 'Uten lagerstyring – på lager'
  if (l.status === 'outofstock') return 'Uten lagerstyring – utsolgt'
  return 'Uten lagerstyring – restordre'
}

export function lagertall(plan: Plan): Lagertall {
  const enkle: Record<string, number> = {}
  const variasjoner: Record<string, number> = {}
  let enheter = 0
  for (const p of plan.produkter) {
    if (p.handling === 'hopp_over') continue
    const k = lagerKategori(p.onske.lager)
    enkle[k] = (enkle[k] ?? 0) + 1
    if (p.onske.lager.styring === 'antall') enheter += p.onske.lager.antall
  }
  for (const v of plan.variasjoner) {
    if (v.handling === 'hopp_over') continue
    const k = lagerKategori(v.onske.lager)
    variasjoner[k] = (variasjoner[k] ?? 0) + 1
    if (v.onske.lager.styring === 'antall') enheter += v.onske.lager.antall
  }
  return { enkle, variasjoner, enheter }
}

function avstemmingstabell(plan: Plan): string[] {
  return [
    '| Type | I kilden | Hoppes over | Skal finnes etter import | Opprettes | Oppdateres | Uendret | Stemmer |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | :---: |',
    ...plan.avstemming.map(
      (a) =>
        `| ${a.type} | ${tall(a.iKilden)} | ${tall(a.hoppesOver)} | ${tall(a.forventet)} | ${tall(a.opprett)} | ` +
        `${tall(a.oppdater)} | ${tall(a.uendret)} | ${jaNei(a.stemmer)} |`,
    ),
  ]
}

const LAGERSTRATEGI = [
  'Kilden sier bare om en vare er på lager og – når butikken styrer lageret – hvor mange som kunne legges i',
  'kurven da utdraget ble tatt (Store API: `add_to_cart.maximum`, `low_stock_remaining` og teksten «N på lager»).',
  'Eksakt beholdning er ukjent. Derfor:',
  '',
  '- **Lagerstyring med antall** bare der kilden gir et faktisk antall: på lager og maks i kurven under 9999,',
  '  `low_stock_remaining` eller «N på lager» – og alle tallene som finnes er like. Antallet er det som var',
  '  tilgjengelig for nettkunder (beholdning minus reservasjoner i åpne kurver).',
  '- **Lagerstyring med 0** for utsolgte varer med `low_stock_remaining = 0` (butikken styrer lageret og har 0',
  '  eller mindre). Negativ beholdning kan ikke leses ut og importeres som 0.',
  '- **Uten lagerstyring**, bare `stock_status` (på lager / utsolgt), når antallet ikke er kjent.',
  '- **Variable produkter** får ingen lagerstyring på forelderen; lageret står på hver variant, og WooCommerce',
  '  avleder status for produktet.',
  '- Ingen restordre (ingen i kilden). Lageret i staging er et øyeblikksbilde og skal ikke synkes tilbake.',
]

function lagerSeksjon(plan: Plan): string[] {
  const t = lagertall(plan)
  const rader = [
    'Lagerstyring med antall (på lager)',
    'Lagerstyring, antall 0 (utsolgt)',
    'Uten lagerstyring – på lager',
    'Uten lagerstyring – utsolgt',
    'Uten lagerstyring – restordre',
    'Lager på variantene (variabelt produkt)',
  ].filter((r) => t.enkle[r] !== undefined || t.variasjoner[r] !== undefined)
  return [
    ...LAGERSTRATEGI,
    '',
    '| Lager i importen | Produkter | Variasjoner |',
    '| --- | ---: | ---: |',
    ...rader.map((r) => `| ${r} | ${tall(t.enkle[r] ?? 0)} | ${tall(t.variasjoner[r] ?? 0)} |`),
    '',
    `Til sammen ${tall(t.enheter)} enheter med lagerstyring.`,
    '',
  ]
}

function forutsetninger(): string[] {
  return [
    '- WooCommerce 9.6 eller nyere med **Brands** (`/wc/v3/products/brands`).',
    ...INNSTILLINGER.map(
      ([id, verdi, blokkerer, forklaring]) =>
        `- \`${id}\` = \`${verdi}\`: ${forklaring}${blokkerer ? ' (stopper --apply)' : ''}.`,
    ),
    '- REST API-nøkkel med **lese- og skrivetilgang** for `--apply` (lesetilgang holder for tørrkjøring).',
    '- Pene permalenker (`/wp-json/` må svare).',
    '- Staging må kunne laste ned bildene fra Reginas mediebibliotek (se «Til avklaring»).',
  ]
}

function avklaringer(kilde: Kilde, plan: Plan): string[] {
  const utenPwb = plan.advarsler.filter((m) => m.kode === 'merke_uten_pwb').length
  const pwb = new Set(kilde.produkter.map((p) => p.pwbMerke?.slug).filter(Boolean)).size
  const bilder = plan.produkter.filter((p) => p.sendBilder).reduce((sum, p) => sum + p.onske.bilder.length, 0)
  // Variantbilder som ikke allerede står i produktets galleri, lastes ned for seg (hvert bilde én gang).
  const galleri = new Map(kilde.produkter.map((p) => [p.kildeId, new Set(p.bilder.map((b) => b.src))]))
  const variantbilder = new Set(
    plan.variasjoner
      .filter(
        (v) => v.sendBilder && v.onske.bilde && !galleri.get(v.onske.forelderKildeId)?.has(v.onske.bilde),
      )
      .map((v) => v.onske.bilde),
  ).size
  return [
    `1. **Merker: Perfect WooCommerce Brands → WooCommerce Brands.** Dagens butikk bruker PWB (taksonomien`,
    `   \`pwb-brand\`, ${pwb} merker i bruk på produktene). Importen legger merkene i WooCommerce Brands`,
    `   (\`product_brand\`, ${tall(kilde.merker.length)} merker fra \`data/brands.json\`). Må avklares: skal butikken gå over til`,
    '   WooCommerce Brands, hva skjer med PWB-pluginen, og skal gamle `/brand/<slug>/`-adresser sendes videre',
    `   (\`data/legacy_brands.json\`)? ${tall(utenPwb)} produkter har ikke PWB-merke i dag og får et merke utledet av navnet.`,
    `2. **Bildene** (${tall(bilder)} produktbilder og ${tall(variantbilder)} egne variantbilder i denne planen; variantbilder`,
    '   som står i produktets galleri, gjenbrukes) lastes ned av staging-serveren fra produksjonens mediebibliotek',
    '   (`nettbutikk.reginaparfymeri.no/wp-content/uploads/…`) når de sideloades. Det er bare lesing, men det er',
    '   trafikk mot produksjon. Alternativ: kopier `uploads` til staging først. Ved oppdatering sendes bilder bare',
    '   når produktet i staging ikke har noen, så en ny kjøring ikke fyller mediebiblioteket med kopier.',
    '3. **Beskrivelser** importeres fra den rene teksten i `data/products.json` som enkel HTML (avsnitt og',
    '   linjeskift). Originalen har bare `<p>` og `<br>`, så formateringen er den samme.',
    '4. **Tilbud:** tilbudsprisene er med, men tilbudsperioden finnes ikke i kilden.',
    '5. **Rabatter og frakt** (Woo Discount Rules, Posten/Bring) og vekt/mål er ikke en del av kilden og importeres ikke.',
  ]
}

function endringsliste<T>(tittel: string, poster: Post<T>[], maks = 100): string[] {
  const oppdater = poster.filter((p) => p.handling === 'oppdater')
  if (oppdater.length === 0) return []
  const linjer = [`### ${tittel}: ${tall(oppdater.length)} oppdateres`, '']
  linjer.push(
    ...oppdater.slice(0, maks).map((p) => `- \`${p.nokkel}\` (#${p.id}): ${p.endringer.join(', ')}`),
  )
  if (oppdater.length > maks) linjer.push(`- … og ${tall(oppdater.length - maks)} til (se JSON-rapporten)`)
  linjer.push('')
  return linjer
}

function hoppetOverListe(plan: Plan): string[] {
  const alle = [
    ...plan.produkter.filter((p) => p.handling === 'hopp_over').map((p) => ({ type: 'Produkt', p })),
    ...plan.variasjoner.filter((p) => p.handling === 'hopp_over').map((p) => ({ type: 'Variasjon', p })),
    ...plan.merker.filter((p) => p.handling === 'hopp_over').map((p) => ({ type: 'Merke', p })),
  ]
  if (alle.length === 0) return ['Ingen.', '']
  return [
    ...alle.map(
      ({ type, p }) =>
        `- ${type} \`${p.nokkel}\` (kilde #${'kildeId' in p.onske ? String(p.onske.kildeId) : '–'}): ${p.grunn ?? ''}`,
    ),
    '',
  ]
}

export function torrkjoringsrapport(
  kilde: Kilde,
  plan: Plan,
  meta: RapportMeta,
): { md: string; json: string } {
  const stemmer = plan.avstemming.every((a) => a.stemmer)
  const mal = meta.staging
    ? `staging ${meta.staging} – eksisterende data lest med GET, forskjellen vises under`
    : 'offline – ingen nøkler i miljøet. Planlagt mot en tom butikk; ingen nettverkskall er gjort.'
  const md = [
    '# Import til staging – tørrkjøring',
    '',
    `Generert ${tid(meta.tidspunkt)} av \`scripts/import_to_woocommerce.ts\` (standard er tørrkjøring; ingen skrivende kall).`,
    '',
    `- **Mål:** ${mal}`,
    ...meta.miljo.map((m) => `- ${m}`),
    `- **Kilde:** \`data/products.json\` (${tall(kilde.antall.produkter)} produkter: ${tall(kilde.antall.enkle)} enkle, ` +
      `${tall(kilde.antall.variable)} variable), \`raw/variations_raw.json\` (${tall(kilde.antall.variasjoner)} variasjoner, ` +
      `pris/lager/SKU), \`data/categories.json\` (${tall(kilde.antall.kategorier)} kategorier), \`data/brands.json\` ` +
      `(${tall(kilde.antall.merker)} merker)`,
    `- **Resultat:** ${stemmer ? 'alle antall stemmer med kilden' : '**avvik i avstemmingen** – se tabellen'} · ` +
      `${tall(plan.advarsler.length)} advarsler · ${tall(plan.feil.length)} feil · ${tall(plan.blokkerende.length)} blokkerende`,
    meta.staging
      ? '- **Neste steg:** `--apply` skriver planen til staging og teller opp etterpå (`reports/import-apply.md`).'
      : '- **Neste steg:** sett `WC_STAGING_URL`, `WC_STAGING_KEY` og `WC_STAGING_SECRET` og kjør på nytt for å se ' +
        'forskjellen mot staging; `--apply` skriver.',
    '',
    '## Avstemming mot kilden',
    '',
    ...avstemmingstabell(plan),
    '',
    ...plan.avstemming.filter((a) => a.merknad).map((a) => `${a.type}: ${a.merknad}.`),
    '',
    '## Lager',
    '',
    ...lagerSeksjon(plan),
    ...(meta.staging
      ? [
          '## Endringer mot staging',
          '',
          ...endringsliste('Kategorier', plan.kategorier),
          ...endringsliste('Merker', plan.merker),
          ...endringsliste('Attributter', plan.attributter),
          ...endringsliste('Termer', plan.termer),
          ...endringsliste('Produkter', plan.produkter),
          ...endringsliste('Variasjoner', plan.variasjoner),
          ...(plan.avstemming.every((a) => a.oppdater === 0)
            ? ['Ingenting som finnes i staging, må oppdateres – det er likt kilden.', '']
            : []),
          '### Finnes bare i staging (røres ikke – importen sletter aldri)',
          '',
          `- Kategorier: ${tall(plan.bareIStaging.kategorier.length)}${
            plan.bareIStaging.kategorier.length
              ? ` (${plan.bareIStaging.kategorier
                  .slice(0, 20)
                  .map((k) => k.slug)
                  .join(', ')})`
              : ''
          }`,
          `- Merker: ${tall(plan.bareIStaging.merker.length)}`,
          `- Produkter: ${tall(plan.bareIStaging.produkter.length)}`,
          `- Variasjoner på importerte produkter: ${tall(plan.bareIStaging.variasjoner.length)}`,
          '',
        ]
      : []),
    '## Hoppes over',
    '',
    ...hoppetOverListe(plan),
    `## Advarsler (${tall(plan.advarsler.length)})`,
    '',
    ...meldingsliste(plan.advarsler, 'Ingen.'),
    `## Feil (${tall(plan.feil.length)})`,
    '',
    ...(plan.feil.length ? [...plan.feil.map(meldingLinje), ''] : ['Ingen.', '']),
    `## Blokkerende (${tall(plan.blokkerende.length)})`,
    '',
    ...(plan.blokkerende.length
      ? [...plan.blokkerende.map((b) => `- ${b}`), '']
      : [
          meta.staging
            ? 'Ingen – `--apply` kan kjøres.'
            : 'Ikke kontrollert (offline). Kontrolleres mot staging når nøklene er satt.',
          '',
        ]),
    '## Forutsetninger i staging',
    '',
    ...forutsetninger(),
    '',
    '## Til avklaring',
    '',
    ...avklaringer(kilde, plan),
    '',
  ].join('\n')

  const json = JSON.stringify(
    {
      generert: meta.tidspunkt.toISOString(),
      modus: 'tørrkjøring',
      mal: meta.staging ?? 'offline (tom butikk)',
      kilde: kilde.antall,
      avstemming: plan.avstemming,
      lager: lagertall(plan),
      blokkerende: plan.blokkerende,
      feil: plan.feil,
      advarsler: plan.advarsler,
      bareIStaging: plan.bareIStaging,
      plan: {
        kategorier: plan.kategorier,
        merker: plan.merker,
        attributter: plan.attributter,
        termer: plan.termer,
        produkter: plan.produkter,
        variasjoner: plan.variasjoner,
      },
    },
    null,
    2,
  )
  return { md, json: `${json}\n` }
}

const TYPENAVN: Record<Objekttype, string> = {
  kategorier: 'Kategorier',
  merker: 'Merker',
  attributter: 'Attributter',
  termer: 'Attributtermer',
  produkter: 'Produkter',
  variasjoner: 'Variasjoner',
}

export function applyRapport(
  kilde: Kilde,
  plan: Plan,
  meta: RapportMeta,
  resultat: UtforResultat | null,
  kontroll: Etterkontroll | null,
  stoppet: string | null,
): string {
  const linjer = [
    '# Import til staging – apply',
    '',
    `Generert ${tid(meta.tidspunkt)} av \`scripts/import_to_woocommerce.ts --apply\` mot ${meta.staging ?? 'ukjent'}.`,
    `Produkter ble sendt i kall på maks ${meta.produkterPerKall}; alt annet i kall på maks 100.`,
    '',
  ]
  if (stoppet) linjer.push(`> **Stoppet:** ${stoppet}`, '')

  if (resultat) {
    linjer.push(
      '## Hva som ble skrevet',
      '',
      '| Type | Opprettet | Oppdatert | Uendret | Fantes allerede | Hoppet over | Feilet |',
      '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
      ...(Object.keys(TYPENAVN) as Objekttype[]).map((type) => {
        const t = resultat.telling[type]
        return (
          `| ${TYPENAVN[type]} | ${tall(t.opprettet)} | ${tall(t.oppdatert)} | ${tall(t.uendret)} | ` +
          `${tall(t.fantesAllerede)} | ${tall(t.hoppetOver)} | ${tall(t.feilet)} |`
        )
      }),
      '',
    )
  }

  if (kontroll) {
    const rad = (navn: string, k: { forventet: number; funnet: number }) =>
      `| ${navn} | ${tall(k.forventet)} | ${tall(k.funnet)} | ${jaNei(k.forventet === k.funnet)} |`
    linjer.push(
      '## Opptelling i staging etter importen',
      '',
      'Lest på nytt med GET etter skrivingen og matchet mot kilden på SKU (slug for produkter uten SKU).',
      '',
      '| Type | Forventet fra kilden | Funnet i staging | Stemmer |',
      '| --- | ---: | ---: | :---: |',
      rad('Produkter', kontroll.produkter),
      rad(`Variasjoner (${tall(kilde.antall.variasjoner)} minus doble)`, kontroll.variasjoner),
      rad('Kategorier', kontroll.kategorier),
      rad('Merker', kontroll.merker),
      '',
      kontroll.stemmer ? 'Alt fra kilden finnes i staging.' : '**Ikke alt fra kilden finnes i staging:**',
      '',
    )
    for (const [navn, k] of [
      ['Produkter', kontroll.produkter],
      ['Variasjoner', kontroll.variasjoner],
      ['Kategorier', kontroll.kategorier],
      ['Merker', kontroll.merker],
    ] as const) {
      if (k.mangler.length > 0) {
        linjer.push(
          `- ${navn} som mangler (${tall(k.mangler.length)}): ${k.mangler
            .slice(0, 50)
            .map((m) => `\`${celle(m)}\``)
            .join(', ')}`,
        )
      }
    }
    linjer.push('')
  }

  if (resultat) {
    linjer.push(`## Feil under skrivingen (${tall(resultat.feil.length)})`, '')
    linjer.push(...(resultat.feil.length ? resultat.feil.map((f) => `- ${f.tekst}`) : ['Ingen.']), '')
    if (resultat.advarsler.length) {
      linjer.push(
        `## Merknader under skrivingen (${tall(resultat.advarsler.length)})`,
        '',
        ...resultat.advarsler.map((a) => `- ${a.tekst}`),
        '',
      )
    }
  }

  linjer.push('## Planen', '', ...avstemmingstabell(plan), '')
  if (plan.blokkerende.length)
    linjer.push('### Blokkerende', '', ...plan.blokkerende.map((b) => `- ${b}`), '')
  linjer.push(
    `### Advarsler fra planen (${tall(plan.advarsler.length)})`,
    '',
    ...grupper(plan.advarsler).map((g) => `- ${g.tittel}: ${tall(g.liste.length)}`),
    '',
    'Detaljene står i tørrkjøringsrapporten (`reports/import-dry-run.md`).',
    '',
  )
  return linjer.join('\n')
}
