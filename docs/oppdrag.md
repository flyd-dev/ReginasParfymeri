# Ny nettbutikk for Regina Parfymeri – oppdrag til Claude Code

Du skal bygge en ny nettbutikk for **Regina Parfymeri AS** i Haugesund. Oppdraget utføres av Flyd. WooCommerce skal fortsatt være motoren bak butikken. Les hele dokumentet før du begynner, og følg fasene i rekkefølge.

Denne mappen inneholder:

| Fil | Innhold |
|---|---|
| `data/products.json` | **Alle 1 082 ekte produkter** fra dagens butikk (navn, merke, pris, SKU, lager, beskrivelse, kategorier, varianter, bilder, original-URL) |
| `data/products.csv` | Samme data i regnearkformat for gjennomgang |
| `data/categories.json` | Kategoritreet (7 hovedkategorier med underkategorier og antall produkter) |
| `data/brands.json` | 78 merker, normalisert, med antall produkter |
| `data/catalog_summary.md` | Oversikt og kjente datahull |
| `scripts/refresh_from_store.py` | Henter katalogen på nytt fra den live butikken, inkludert pris/lager per variant |
| `scripts/build_catalog.py` | Bygger `data/`-filene fra rådata (merkenormalisering, kategoristier) |

Data ble hentet 27.10.2026 fra `https://nettbutikk.reginaparfymeri.no/wp-json/wc/store/v1/`. Kjør `refresh_from_store.py` og deretter `build_catalog.py .` før import, så du jobber med ferske priser og lagerstatus.

---

## 1. Om kunden

- Et av Norges eldste frittstående parfymerier, startet i 1863 som «Nilsen & Sønner». Eieren, Grethe Kongshavn, er femte generasjon.
- Butikken ligger i Haraldsgata 138 i Haugesund sentrum, vis-à-vis Viktoriahjørnet. Hudpleieavdelingen i andre etasje tilbyr behandlinger.
- Profil: eksklusive **nisjedufter** (Creed, Parfums de Marly, Initio, BDK, Ormonde Jayne, Memo, Escentric Molecules, Fugazzi m.fl.), hudpleie (Susanne Kaufmann, Guinot, AHAVA), makeup, hår og tilbehør.
- De sender varer til hele landet. Telefon: 948 97 061.
- Noen merker (Chanel, Hermès, Sisley, Guerlain m.fl.) **kan ikke selges på nett** på grunn av leverandørrestriksjoner. Nettbutikken skal vise at disse finnes i den fysiske butikken og invitere kunden til å ta kontakt eller komme innom, men de skal ikke kunne kjøpes på nett.
- Ny kasse (POS) bruker WooCommerce, så **WooCommerce er fasit for produkter, priser og lager.** Lojalitetsklubb skal kjøres i **Diller**. Regnskap går i PowerOffice (håndteres av Flyd separat; ikke bygg det inn i frontend).

## 2. Mål

1. En nettbutikk som føles like eksklusiv som den fysiske butikken: varm, redaksjonell og personlig. Den skal ikke se ut som et standardtema.
2. Kundens **rosa farge** og en **dus sandfarget bakgrunn** skal bære identiteten (se §4).
3. Rask og enkel handel på mobil, med Vipps som førstevalg.
4. Lett å holde oppdatert. Den gamle butikken viste en påskekampanje i slutten av oktober. Kampanjer må derfor ha start- og sluttdato og forsvinne av seg selv.
5. Ingen tap av SEO fra dagens butikk.

## 3. Teknisk arkitektur

### Anbefalt løsning: headless storefront + WooCommerce

- **Backend:** WordPress + WooCommerce (nyeste stabile). Det er fasit for produkter, varianter, lager, ordre, kunder og kuponger.
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui, med komponenter fra **21st.dev** (se §5). Hostes på Vercel.
- **Data inn i frontend:** WooCommerce **Store API** (`/wp-json/wc/store/v1/`) for produkter, kategorier, søk og handlekurv. Bruk ISR/`revalidate` for katalogsider, og revalider ved WooCommerce-webhooks (`product.updated`, `product.created`, `product.deleted`) via en beskyttet `/api/revalidate`-rute.
- **Kasse:** Både Vipps MobilePay-pluginen (*Pay with Vipps and MobilePay for WooCommerce*, med Vipps Checkout) og *Diller Loyalty*-pluginen (innmelding og kuponger i kassen) lever i WooCommerce sin egen kasse. **Kassen og «Min konto» skal derfor kjøres av WooCommerce**, med et lett tema som matcher designet. Det kan for eksempel ligge på `kasse.reginaparfymeri.no` eller under samme domene. Frontend håndterer alt frem til «Gå til kassen».

### Fase 0 er en spike, og den kommer før all UI

Bevis at handlekurven kan overføres fra Next.js (Store API, `Cart-Token`) til WooCommerce-kassen uten at kunden mister varene sine. Det kan for eksempel gjøres med et lite mu-plugin-endepunkt som tar imot cart-token, laster kurven inn i WC-sesjonen og videresender til `/kasse`. Spiken er godkjent når en testordre med to varer, én av dem en variant, går gjennom Vipps i testmodus, og Diller-innmelding vises i kassen.

**Hvis spiken feiler,** stopp og legg frem alternativene for Marius før du går videre. Alternativene er (a) et klassisk blokkbasert WooCommerce-tema der 21st.dev-komponentene portes til blokker/PHP, eller (b) en egen kasse via Store API `/checkout`, men bare hvis Vipps-pluginen støtter det.

### Miljøer og sikkerhet

- Bygg mot et **staging**-WordPress, aldri mot den live butikken. Den live butikken leses bare via det offentlige Store API-et.
- Hemmeligheter (WooCommerce consumer key/secret, revalidate-secret, Vipps-testnøkler) ligger i `.env.local` og Vercel env, aldri i repoet og aldri i chat.
- Spør Marius før du gjør noe av dette: endrer DNS/domener, installerer plugins på produksjon, skriver til produksjons-WooCommerce eller sender e-post/SMS til kunder.

## 4. Design

### Farger (design tokens)

Den rosa fargen er hentet direkte fra dagens to nettsider. Sandfargene er et forslag til «dus sand» som må godkjennes av kunden. Legg dem inn som CSS-variabler og Tailwind-tokens, slik at de kan justeres ett sted.

| Token | Verdi | Bruk |
|---|---|---|
| `--regina-pink` | `#E9168C` | **Kundens rosa.** Logo, aksenter, badges («Nyhet»), dekor, store overskrifter, hover-flater |
| `--regina-pink-strong` | `#C2106F` | Rosa **tekst**, lenker og knapper med hvit tekst (AA-kontrast) |
| `--regina-plum` | `#3F132E` | Primær tekst og primærknapp (fra dagens butikk) |
| `--sand-50` | `#F4EDE4` | **Hovedbakgrunn** (dus sand) |
| `--sand-100` | `#EADFD2` | Seksjoner, kort, footer |
| `--sand-200` | `#D9CBB8` | Linjer, rammer, skillere |
| `--sand-ink` | `#7A6555` | Sekundærtekst, metadata |
| `--paper` | `#FBF8F4` | Bakgrunn bak produktbilder |

**Kontrastregler (WCAG 2.1 AA). Disse er målt og må følges:**

- `#E9168C` på sand gir 3,65:1, og hvit tekst på `#E9168C` gir 4,24:1. Den rene rosa fargen er dermed **bare** for stor tekst (24px+, eller 19px+ fet), ikoner, flater og dekor, aldri for brødtekst eller små knappetekster.
- Bruk `#C2106F` for rosa lenker og tekst (5,03:1 på sand) og for rosa knapper med hvit tekst (5,84:1).
- Plum på sand gir 13,45:1, og den kombinasjonen er standard for tekst.
- Rosa skal være en **aksent**, ikke en flate. Tommelfingerregel: cirka 5–10 % rosa, resten sand og plum.

### Typografi

Behold dagens fonter: **Playfair Display** til overskrifter og **Poppins** til brødtekst og UI. Last dem via `next/font`. Brødtekst skal være minst 16px. Dagens butikk bruker 12px, og det er for lite.

### Logo

- Butikklogo: `https://nettbutikk.reginaparfymeri.no/wp-content/uploads/2025/06/LOGO-REGINA-PARFYMERI-3-scaled-e1750620926182.png`
- Hvit SVG-logo: `https://reginaparfymeri.no/wp-content/uploads/2020/12/regina_hvit.svg`

Last ned logoene til `public/brand/`. Be Marius om original vektorlogo fra kunden hvis kvaliteten ikke holder.

### Uttrykk

- **Stikkord:** eksklusiv nisjeparfymeri, varm, redaksjonell og personlig. Familiebedrift siden 1863. Rolig luksus, ikke høylytt.
- **Mye luft** og store produktbilder. Overskrifter i Playfair kan gjerne ha kursiv aksent. Tynne sand-200-linjer brukes i stedet for skygger. Hjørner skal være rette eller nesten rette (dagens butikk bruker 0–2px), så unngå bobleaktige, avrundede kort.
- **Produktbilder:** De fleste ekte produktbildene har hvit bakgrunn. Legg dem på `--paper` med `mix-blend-mode: multiply`, eller i kvadratiske «paper»-flater, så de ikke ser ut som hvite bokser på sand. Test på flere bildetyper (webp/jpg/png finnes).
- **Mikroanimasjoner** skal være diskrete (fade/slide, 150–250 ms) og respektere `prefers-reduced-motion`.
- **Unngå:** generiske AI-gradienter, lilla/blå SaaS-uttrykk, glassmorfisme, stockbilder av modeller presentert som om de er fra butikken, og emojier i UI.

## 5. 21st.dev – slik skal du bruke det

Bruk nettleseren din til å åpne **https://21st.dev** og finne komponenter, temaer, ikoner og video/hero-elementer.

1. **Søk per seksjon.** Søk etter: navbar/mega-meny, hero (også video-hero), produktkort, produktkarusell, merke-/logokarusell, kategori-grid, filtre/facets, søkedialog (command palette), drawer-handlekurv, produktgalleri, tabs/accordion, nyhetsbrev, footer, testimonials/sitat, timeline (historien siden 1863), kart/kontakt og toast.
2. **Vurder 2–3 kandidater per seksjon** opp mot designet i §4. Velg den som lar seg tilpasse til sand/plum/rosa uten å miste karakter.
3. **Installer med nøyaktig kommandoen som står på komponentsiden.** Formatet er vanligvis `npx shadcn@latest add "https://21st.dev/r/<forfatter>/<komponent>"`. Kopier den derfra i stedet for å gjette URL-en. Lim aldri inn kode manuelt hvis kommandoen finnes, for da kan avhengigheter mangle.
4. **Restyle til tokens.** Ingen hardkodede farger fra komponenten skal bli igjen. Søk etter `#`, `bg-`, `text-` og `from-`/`to-` etter installasjon.
5. **Logg hvert valg** i `docs/components.md`: URL, forfatter, lisens, hvorfor den ble valgt, og hva som er endret.
6. **Ikoner:** Bruk ett ikonsett gjennomgående (lucide-react via shadcn, eller et sett du finner på 21st.dev). Ikke bland sett.
7. **Video:** Hent komponenten (video-hero, bakgrunnsvideo) fra 21st.dev, men **bruk aldri demovideoen i produksjon.** Bruk en plassholder i sandtone med plakatbilde frem til kunden leverer egen film fra butikken. Merk plassholderen tydelig i koden og i `docs/components.md`.

## 6. Produktdata – vi bruker ekte produkter

- **Kilde:** `data/products.json`. Ikke finn på produkter, priser, merker eller beskrivelser. Tekst som mangler skal vises som at den mangler, ikke fylles med generert innhold.
- **Import til staging-WooCommerce:** Skriv et importskript (`scripts/import_to_woocommerce.ts` eller `.py`) mot WooCommerce REST API (`/wp-json/wc/v3/`) som oppretter kategorier (med hierarki fra `categories.json`), merker (WooCommerce Brands-taksonomi, fra feltet `brand`), produkter, variantattributter (`Størrelse`, `Farge`) og varianter med pris/lager fra `raw/variations_raw.json`, og som sideloader bildene fra `images[].src`. Skriptet må være idempotent: matche på SKU og oppdatere i stedet for å duplisere. Kjør først en tørrkjøring som skriver en rapport.
- **Prototype før import er klar:** Frontend kan lese `products.json` direkte bak et `DATA_SOURCE=json|woocommerce`-flagg. Bildene kan lastes fra `nettbutikk.reginaparfymeri.no` (legg domenet i `next.config` `images.remotePatterns`) til de er migrert.
- **Priser** er i NOK inkludert MVA. Vis dem som `kr 949` (nb-NO, ingen desimaler når de er ,00). Varianter vises som «fra kr 2 645».

### Kjente datahull

Håndter disse i UI, og lag en liste til kunden i `docs/data-issues.md`:

- **116 produkter mangler beskrivelse.** Vis merke, kategori og en tekst som «Spør oss i butikken om dette produktet».
- **124 produkter er utsolgt.** Vis «Utsolgt» og «Gi meg beskjed når den er tilbake» (WooCommerce waitlist eller e-postskjema). De skal ikke skjules.
- **4 produkter har ikke gjenkjent merke:** NISSE HÅNDSÅPE 300 ML, Bambus Q-tips – 300 stk, Exclamation 50ml, PL3 Lebepomade.
- Merkenavn i kildedata er inkonsekvente (for eksempel «LÖVENGRIP»/«LÖWENGRIP», «PARFUMES DE MARLEY», «FUGUAZZI»). `build_catalog.py` normaliserer dem. Bruk `brand`-feltet, ikke prefikset i produktnavnet.
- Kategorinavn er lagret med VERSALER. Vis dem i normal skrift («Nisjeduft», «Hår», «Tilbehør»), men behold slugene.
- **Guerlain** står på listen over merker som ikke kan selges på nett, men «GUERLAIN – Mon Guerlain Xmas» ligger i nettbutikken i dag. Flagg dette til Marius, og ikke bestem selv om produktet skal være kjøpbart.
- 5 produkter er på tilbud: vis før- og etterpris.

## 7. Sider og funksjoner

1. **Forside:** hero (kampanje eller video), nyheter, bestselgere, nisjeduft-seksjon, merkekarusell, kategori-inngang, historien (1863 → i dag), behandlinger i 2. etasje, kundeklubb, besøk butikken.
2. **Kategoriside:** filtre for underkategori, merke, pris, på lager og størrelse/farge. Sortering. Antall treff. Filtrene skal ligge i URL-en, så de kan deles.
3. **Produktside:** galleri (opptil 8 bilder), variantvalg, pris, lagerstatus, legg i kurv, beskrivelse i accordion, «Kun i butikk»-merking der det gjelder, relaterte produkter fra samme merke og kategori, JSON-LD `Product`.
4. **Merkeoversikt (A–Å) og merkeside:** Ha med en egen seksjon for «Merker kun i butikken» (Chanel, Hermès, Sisley, Guerlain m.fl.) med kontaktknapp. Ingen kjøpsknapp.
5. **Søk:** hurtigsøk (command palette) med produkter, merker og kategorier.
6. **Handlekurv:** drawer, med overføring til WooCommerce-kassen (§3).
7. **Kundeklubb (Diller):** fordelsside og innmelding. Innmelding skjer også i kassen via pluginen.
8. **Innhold:** Om oss, Behandlinger, Kontakt (adresse, telefon, kart), Frakt og retur, Personvern, Kjøpsvilkår.
9. **Kampanjebanner:** styres fra WordPress (ACF/options eller en enkel CPT) med tekst, lenke, startdato og sluttdato. Banneret skjules automatisk etter sluttdato.
10. **Cookie-samtykke** i tråd med GDPR. Analyse lastes først etter samtykke.

Åpningstider er ikke bekreftet. Instagram oppgir «10-18 (10-16)». Hent dem fra WordPress-innstillinger og be Marius bekrefte før lansering. Ikke hardkod dem.

## 8. Kvalitetskrav

- **Språk:** nb-NO overalt (`<html lang="nb">`, datoer, valuta). Engelske komponenttekster («Add to wishlist», «Quick view», «Search» – slik de står i dagens butikk) skal oversettes.
- **SEO:** Behold dagens URL-struktur (`/produkt/<slug>/`, `/produktkategori/<sti>/`, `/brand/<slug>/`), eller lag 301-redirects for hver URL i `products.json` (`source_url`). Dynamiske `<title>`/meta, Open Graph, `sitemap.xml`, `robots.txt` og kanoniske URL-er.
- **Ytelse:** Lighthouse mobil ≥ 90 på forside, kategori- og produktside. LCP < 2,5 s. Bilder via `next/image` med riktige `sizes`.
- **Tilgjengelighet:** WCAG 2.1 AA. Tastaturnavigasjon i meny, filtre og drawer. Synlig fokus i plum/rosa. Alt-tekst på bilder, med produktnavn som fallback.
- **Responsivt:** test på 375, 768, 1280 og 1536px.
- **Kode:** TypeScript strict, ESLint/Prettier, komponenter i `components/`, data-lag i `lib/woocommerce/`. Ingen hemmeligheter i klientkode.
- **Test:** Playwright e2e for flyten søk → produkt → variant → kurv → kassen (staging/testmodus).

## 9. Arbeidsrekkefølge

| Fase | Innhold | Ferdig når |
|---|---|---|
| 0 | Spike: kurv-overføring + Vipps test + Diller i kassen (§3) | Testordre gjennomført, notat i `docs/architecture.md` |
| 1 | Prosjektoppsett, tokens, fonter, logo, layout (header/footer) | Skjermbilder av header/footer på sand, kontrastsjekk OK |
| 2 | 21st.dev-research og komponentvalg | `docs/components.md` med valg per seksjon, sendt til Marius |
| 3 | Katalog: kategori, produkt, merke, søk – mot `products.json` | Alle 1 082 produkter kan vises, filtre fungerer |
| 4 | Import til staging-WooCommerce + bytte til `DATA_SOURCE=woocommerce` | Importrapport uten feil, antall matcher |
| 5 | Kurv, kasse-overføring, kundeklubb, kampanjebanner, innholdssider | e2e-test grønn |
| 6 | SEO/redirects, ytelse, tilgjengelighet, `docs/data-issues.md` | Lighthouse ≥ 90, redirect-liste komplett |

Ta skjermbilder av forside, kategori- og produktside (mobil og desktop) etter fase 1, 3 og 5 og legg dem i `docs/screenshots/`, så Marius kan vise kunden fremdriften.

## 10. Spør heller enn å gjette

Stopp og spør Marius ved:

- valg som påvirker kunden (sandfarger, logo, Guerlain-produktet, åpningstider, fraktpriser)
- alt som skriver til produksjon
- avvik fra arkitekturen i §3
