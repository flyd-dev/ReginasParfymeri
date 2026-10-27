# Regina Parfymeri – ny nettbutikk

Ny nettbutikk for **Regina Parfymeri** (Regina Haraldsgaten AS, Haraldsgata 138, Haugesund), laget av **Flyd**.
WooCommerce er fortsatt motoren: produkter, priser, lager, kasse, Vipps, Diller og «Min konto». Denne flaten
(Next.js) står foran og håndterer alt fram til «Gå til kassen». Oppdraget står i [`docs/oppdrag.md`](docs/oppdrag.md).

> **Status 27.10.2026:** Fase 0–6 er bygget. Flaten kjører mot ekte produktdata (1 082 produkter fra Reginas
> Store API, bare lesing). Kurvoverføringen til WooCommerces kasse er skrevet og testet mot en falsk
> WooCommerce, men **spiken er ikke kjørt i staging ennå** – det finnes ingen staging-WordPress. Se
> «Gjenstår» nederst.

## Kom i gang

```bash
pnpm install
pnpm dev                    # http://localhost:3000 (prototype: DATA_SOURCE=json, lokal handlekurv)
pnpm build && pnpm start    # produksjonsbygg
```

Krever Node 22 og pnpm 10. Ingen nøkler trengs for prototypen. Alle miljøvariabler står i
[`.env.example`](.env.example).

```bash
pnpm verify                 # typecheck + lint + enhetstester + build
pnpm test:e2e               # Playwright (starter selv servere og en falsk WooCommerce)
pnpm katalog:hent           # nytt utdrag fra Store API (bare GET) → data/, docs/redirects.csv, docs/data-issues.md
pnpm import:staging         # tørrkjøring av import til staging-WooCommerce (--apply skriver)
node scripts/skjermbilder.mjs fase-x   # skjermbilder til docs/screenshots/ (server må kjøre)
```

## Arkitektur

| Del                    | Hvor                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| Flate                  | Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui (Radix), lucide-react |
| Designtokens           | `src/styles/tokens.css` (verdier fra oppdraget §4), kontrasttest i `tokens.test.ts`                    |
| Datalag                | `src/lib/woocommerce/` – `DATA_SOURCE=json` (data/products.json) eller `woocommerce` (Store API)       |
| Filtre, søk, sortering | `src/lib/katalog/sporring.ts` – rene funksjoner, filtrene ligger i adressen                            |
| Handlekurv             | `src/lib/kurv/` – lokal (prototype) eller Store API-kurv med Cart-Token (staging)                      |
| Kasse og «Min konto»   | WooCommerce selv. Overføring via mu-plugin: `wordpress/mu-plugins/regina-headless/`                    |
| Innhold fra WordPress  | Kampanjebanner (start/slutt), åpningstider, «gi meg beskjed» – samme mu-plugin                         |
| Import til staging     | `scripts/import_to_woocommerce.ts` (idempotent på SKU, tørrkjøring som standard, nekter produksjon)    |
| Data                   | `scripts/refresh_from_store.py` → `raw/`, `scripts/build_catalog.py` → `data/`                         |

Detaljer, kontrakter og testoppskrift for kassen: [`docs/architecture.md`](docs/architecture.md).

## Sider

- **Forside** – hero (plassholder for film), merkebånd, nytt i nettbutikken, kategori-inngang, nisjeduft,
  bestselgere (WooCommerces popularitet), historien siden 1863, behandlinger, kundeklubb, besøk butikken.
- **Kategori** `/produktkategori/<sti>/` – filtre for underkategori, merke, pris, størrelse, farge, lager og
  tilbud, sortering, antall treff, «Vis flere». Virker uten JavaScript, og filtrene kan deles.
- **Produkt** `/produkt/<slug>/` – galleri (opptil 8 bilder), variantvalg, pris og lager per variant, «gi meg
  beskjed» ved utsolgt, beskrivelse (og tekst når den mangler), relaterte produkter, JSON-LD.
- **Merker** `/merker/` (A–Å og «Merker kun i butikken»), **merkeside** `/brand/<slug>/`.
- **Søk** – hurtigsøk (kommandopalett, «/» eller Ctrl/Cmd+K) og `/sok/`.
- **Handlekurv** (skuff og `/handlekurv/`) → «Gå til kassen».
- **Innhold** – om oss, behandlinger, kundeklubb, kontakt med kart, frakt og levering, angrerett og retur,
  kjøpsvilkår, personvern (med informasjonskapsler). Tekstene er Reginas egne fra dagens nettsider.
- **SEO** – samme adresser som i dag (alle 1 082 produktadresser er like), 301 der noe er endret
  ([`docs/redirects.csv`](docs/redirects.csv)), `sitemap.xml`, `robots.txt` (stengt til lansering),
  kanoniske adresser og Open Graph.

## Kvalitet (målt 27.10.2026)

- **Tester:** enhetstester (vitest) for datalag, filtre/søk, pris, kurv, Store API-kontrakten, signaturer,
  kampanjer, kontrast og omdirigeringer, og importen. Playwright: søk → produkt → variant → kurv → kassen på
  desktop og mobil, WooCommerce-kurv mot falsk Store API med overføring til kassen, filtre, kjøp uten
  JavaScript og axe (WCAG 2.1 AA) på ni sider.
- **Lighthouse mobil** (lokal `next start`, varm cache): ytelse 90–95, tilgjengelighet 96–100, beste praksis
  100 på forside, kategori og produkt. LCP 2,7–3,5 s i labmålingen – målet på 2,5 s må måles på nytt på
  Vercel (CDN og bildebuffer). SEO 100 når bygget lages med `INDEKSERING=pa`; til lansering er siden bevisst
  stengt for søkemotorer.

## Gjenstår (krever Marius/Regina eller staging)

1. **Staging-WordPress** med WooCommerce, Vipps i testmodus og Diller → kjør spiken
   (`docs/architecture.md` §8) og importen (`pnpm import:staging --apply`).
2. **Diller i Vipps Checkout** – trolig ikke støttet av Diller-pluginen i dag; må avklares med Diller.
3. **21st.dev-komponentene** – valgt og logget i [`docs/components.md`](docs/components.md), men ikke
   installert: gratisnivået gir 2 per døgn, og dagens kvote var brukt. Flaten er bygget med shadcn/ui i
   mellomtiden.
4. Avklaringer i [`docs/data-issues.md`](docs/data-issues.md): Guerlain-produktet, åpningstider, fraktpriser,
   kundeklubbens fordeler, Vipps-plugin, merkeregister, personvernerklæring, bruksrett til bilder, logo,
   sandfarger og film til forsiden.

Mer: [`docs/beslutninger.md`](docs/beslutninger.md), [`docs/designretning.md`](docs/designretning.md),
[`docs/bildekilder.md`](docs/bildekilder.md), [`docs/funn-kundereise.md`](docs/funn-kundereise.md),
skjermbilder i [`docs/screenshots/`](docs/screenshots/).
