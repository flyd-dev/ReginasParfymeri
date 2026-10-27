# Regina Parfymeri – konsept for ny nettbutikk

Konsept utarbeidet av **Flyd** for Regina Parfymeri (Regina Haraldsgaten AS, Haraldsgata 138, Haugesund).
En fungerende, presentasjonsklar nettbutikk bygget som en _headless_ flate foran Reginas eksisterende
WooCommerce – med Reginas egne produkter, priser, varianter, lagerstatus, merker og bilder.

> **Status:** konsept. Produktdata er ekte (lest fra Reginas offentlige WooCommerce Store API), men
> kassen er ikke koblet til betaling – ingen bestilling kan sendes. Se «Hva er ekte og hva er demo» under.

## Kom i gang

```bash
pnpm install
pnpm dev                 # http://localhost:3000
```

Produksjonsbygg (det som bør vises for kunden – raskere og uten utviklingsmerket i hjørnet):

```bash
pnpm build && pnpm start # http://localhost:3000
```

Krever Node 22 og pnpm 10. Ingen nøkler eller miljøvariabler er nødvendige for å kjøre konseptet.

Skjermbilder av forsiden, kategori, produkt, handlekurv og kasse på desktop og mobil ligger i
`docs/skjermbilder/`.

### Demonstrasjon – foreslått rekkefølge

1. **Forsiden** – den rosa løperen fra butikkdøren i Haraldsgata ruller ut på siden og leder inn i kategoriene.
2. **Meny → Duft → Nisjeduft** (megameny med tastatur, mus og berøring).
3. **Filtrer** på merke (f.eks. Initio), se antall treff, aktive filtre og «Nullstill».
4. **Side Effect EdP** – trykk «Legg i handlekurven» uten størrelse (du blir bedt om å velge), velg 90 ml,
   se prisen endre seg, legg i kurven (bildet flyr til kurven, kurven åpner seg).
5. I kurven: endre antall, fjern, legg til igjen, **Gå til kassen** – oppsummering og leveringsvalg.
6. **Søk** «vanilje» eller «creed aventus»; på forsiden: «Finn duften etter noten du liker».
7. **Merker** – A–Å og merkene som bare finnes i butikken.
8. Mobil (390 px): meny med nivåer, filterskuff, fast kjøpslinje på produktsiden.

## Hva er implementert

- **Forside** med kollasj-hero (butikkfasaden i en bue, en frilagt flaske med pris, et bilde fra disken),
  rosa merkebånd med pauseknapp, kategorikort med Reginas egne bilder og frilagte produkter, et
  utstillingsvindu for nisjeduft (én duft om gangen, med pauseknapp), personlig veiledning/historie,
  utforsk etter duftnote, merker i kolonner, «Bare i butikken», hudpleieavdelingen, spørsmål og svar og
  «Velkommen inn» med butikkbildene i bevegelse. Bunnteksten avdekkes under siden på store skjermer.
- **Header** som glir bort ved rulling nedover og kommer tilbake ved rulling opp; megameny med butikkbilde.
- **Kategori, merke, søk og tilbud** – filtrering (type, merke, pris, lager, tilbud, duftnote) med antall per
  valg, sortering, aktive filtre, «vis flere», filterskuff på mobil, tomme treff og lastetilstand.
  Filtrene ligger i adressen og kan deles.
- **Produktside** – galleri (miniatyrer på stor skjerm, sveip på mobil), variantvalg med pris og lager per
  størrelse/farge, antall, kjøpsknapp, fast kjøpslinje på mobil, duftpyramide når notene er oppgitt,
  beskrivelse, verifiserte leverings- og returopplysninger, relaterte produkter.
- **Handlekurv** som skuff – riktig variant, antall, pris, delsum, fjerning, tom tilstand, lasting, feil, og
  kontroll mot gjeldende pris og lager (gammel pris rettes og forklares).
- **Kasse (oversikt)** – gjennomgang før Reginas kasse. I konseptmodus er betaling tydelig ikke aktivert.
- **Merker A–Å, Om Regina, Levering/retur/kontakt, 404 og feilside.**
- **Søk** i dialog med forslag (produkter, merker, kategorier, duftnoter) og egen resultatside.

## Teknisk

- Next.js 16 (App Router), React 19, TypeScript, CSS-moduler med semantiske tokens
  (`src/styles/tokens.css`). Ingen UI-rammeverk – bare det designet trenger.
- Skrifter selvhostet via Fontsource: **Cormorant Garamond** (500–600, hero og store overskrifter) og
  **Manrope** (400–600, alt funksjonelt).
- Katalogen: `src/lib/katalog/` – domenemodell (`typer.ts`), mapping fra Store API (`woo/mapping.ts`), lesing
  med tillatt-liste (`woo/hent.ts`), filtrering/søk (`sporring.ts`). Handlekurv: `src/lib/handlekurv/`.
- Kassen: `src/lib/kasse/lenke.ts` – overlevering til WooCommerce via delbar kasse-lenke (av som standard).

```bash
pnpm verify              # typecheck + lint + enhetstester + build
pnpm test                # vitest (121 tester)
pnpm test:e2e            # Playwright: hovedreisen på desktop og mobil (krever kjørende server)
pnpm katalog:hent        # nytt utdrag fra Reginas Store API (bare GET)
pnpm katalog:bygg        # bygg katalogen på nytt fra mellomlagret rådata, uten nettverk
```

### Katalogkilde

| `KATALOG_KILDE` | Hva                                                                                  |
| --------------- | ------------------------------------------------------------------------------------ |
| `utdrag`        | Standard. Lagret utdrag i `data/katalog/` (hentet 26.10.2026). Virker uten nettverk. |
| `live`          | Leser Store API direkte (bare GET), mellomlagret `KATALOG_LEVETID` sekunder (300).   |

Produktbildene hentes fra Reginas mediebibliotek og optimaliseres av Next.js. Se `.env.example`.

## Hva er ekte og hva er demo

| Del                                         | Status                                                                      |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| Produkter, priser, varianter, lager, merker | **Ekte**, fra Reginas WooCommerce (utdrag 26.10.2026, eller live)           |
| Produktbilder                               | **Ekte**, fra Reginas mediebibliotek                                        |
| Duftnoter                                   | **Ekte**, lest fra produktbeskrivelsene der de er oppgitt (52 produkter)    |
| Butikkfakta, levering, retur, historie      | **Ekte**, fra Reginas egne sider – kilde i `src/innhold/butikk.ts`          |
| Butikkbilder og logo                        | **Reginas eget materiale** – bruksrett må bekreftes (`docs/bildekilder.md`) |
| Utvalget på forsiden og kategoritekstene    | **Satt av Flyd** for konseptet (`src/innhold/forside.ts`)                   |
| Kategoribilder, heroflasken, merkebåndet    | **Satt av Flyd**: hvilke produkter og bilder som vises (`forside.ts`)       |
| Handlekurven                                | **Lokal i nettleseren**, kontrollert mot katalogen. Ikke WooCommerce-kurv   |
| Kassen / betaling                           | **Ikke koblet.** Ingen ordre opprettes. Overlevering er bygget, men av      |

## Gjenstående avhengigheter

1. **Bruksrett til bildene** fra reginaparfymeri.no (fotograf ikke oppgitt) og originalfiler i høyere oppløsning.
2. **Kasse:** bekreft at WooCommerce-installasjonen godtar `/checkout-link/` (WooCommerce 10.x) eller velg
   Store API-handlekurv med `Cart-Token` – testes i Reginas staging, ikke i produksjon.
3. **Rabatter og frakt** beregnes av WooCommerce (Woo Discount Rules, Posten/Bring) i kassen – ikke i flaten.
4. **Åpningstider** finnes ikke på Reginas sider og er derfor ikke vist.
5. **Datakvalitet** i butikken: doble varianter, produkter uten merke og uten beskrivelse
   (`data/katalog/datakvalitet.json`, `docs/funn-kundereise.md`).

Mer: `docs/designretning.md`, `docs/integrasjon-woocommerce.md`, `docs/funn-kundereise.md`,
`docs/bildekilder.md`, `docs/beslutninger.md`.
