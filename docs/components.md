# Komponenter – 21st.dev og shadcn/ui

Fase 2 i oppdraget (`docs/oppdrag.md` §5 og §9). Research gjort 27.10.2026 av Claude for Flyd. Dokumentet er
loggen som `AGENTS.md` viser til: hver komponent fra 21st.dev står her med URL, forfatter, lisens, hvorfor den
ble valgt og hva som skal endres. Feltet «Status» oppdateres når komponenten er installert og restylet.

## Slik er valgene gjort

- **Søk per seksjon på 21st.dev** i nettleseren (Chromium via Playwright): søkesiden
  (`/community/components?q=…`) og kategorisidene for navbar/mega-meny, hero og video-hero, produktkort,
  produktkarusell, merkekarusell, kategori-grid, filtre, søkedialog, drawer-handlekurv, produktgalleri,
  tabs/accordion, nyhetsbrev, footer, testimonials/sitat, timeline, kart/kontakt og toast. Hver seksjon har
  2–4 kandidater som er åpnet på komponentsiden og i den levende demoen.
- **Målt mot designet i oppdraget §4:** sand som flate (`--sand-50`/`--sand-100`, linjer `--sand-200`),
  plomme `--regina-plum` til tekst og primærknapp, rosa `--regina-pink` bare som aksent (5–10 %), Playfair
  Display i overskrifter (kursiv aksent er lov) og Poppins i UI, mye luft og store produktbilder, tynne linjer i
  stedet for skygger, hjørner 0–2 px (`--radius: 2px`), bevegelse bare som fade/slide på 150–250 ms
  (`--dur-*`) og ingenting ved `prefers-reduced-motion`. Kandidater med AI-gradienter, lilla/blått SaaS-uttrykk,
  glassmorfisme eller stockbilder som bærende element er valgt bort, eller merket med hva som må ut.
- **Rekkefølge på kriteriene:** (1) lisens oppgitt på komponentsiden, helst MIT; (2) bygger på
  shadcn/ui-primitiver (Radix) og Tailwind med få ekstra avhengigheter – framer-motion/motion bare når det gir mye;
  (3) karakteren overlever restyling til tokens; (4) innholdet kan fylles med ekte data – komponenter som bygger
  på stjerner, «Bestseller»-merker, kampanjer eller kundesitater uten grunnlag er valgt bort (se `AGENTS.md`).
- **Hvor opplysningene kommer fra:** forfatter, kategori og lisens står i sidepanelet på komponentsiden.
  Install-kommandoen vises ikke på HTML-siden for besøkende uten konto («Copy prompt» krever innlogging); den står i
  sidens offentlige Markdown-versjon (samme adresse med `.md`, lenket fra siden med `rel="alternate"`), som også
  lister npm-avhengighetene. Kommandoene under er kopiert ordrett derfra. Registry-avhengigheter (andre
  shadcn-komponenter) vises ikke offentlig og blir først synlige ved installasjon.
- **Lisens:** «ikke oppgitt» betyr at komponentsiden ikke viser noen lisens (Markdown-versjonen sier da «unknown»
  eller «no-license»). Slike komponenter er ikke valgt, med ett unntak som er merket (Gallery 6). 21st.dev sine
  vilkår (Terms of Service, sist oppdatert 20.07.2026) sier i §2 at innholdet tilhører forfatterne og 21st Labs, og
  at demoer og forhåndsvisninger eies av 21st Labs uansett komponentens lisens; §3 krever synlig lenke tilbake til
  komponentsiden ved videreformidling. Hver installert fil skal derfor få en kommentar øverst med komponentens URL,
  forfatter og lisens.
- **Kvote:** gratisnivået gir 2 komponentinstallasjoner per døgn. Dagens kvote er brukt opp; den nullstilles
  **28.10.2026 kl. 00:00 UTC**. I denne runden er ingen registry-JSON (`https://21st.dev/r/…`) hentet og
  `API_KEY_21ST` ikke brukt. 17 valg gir 9 døgn med installasjoner (se «Installasjonsrekkefølge»). Vilkårene §3
  forbyr også automatisert innsamling fra markedsplassen; gjennomgangen var derfor begrenset til enkeltsider i
  nettleseren (søk, komponentsider, demoer og sidenes Markdown-versjon).
- **Skjermbilder** av hver valgte kandidat er tatt for intern vurdering og ligger utenfor repoet (demoene tilhører
  21st Labs, jf. vilkårene §2–3).

### shadcn/ui i mellomtiden

Primitivene fra det offisielle registeret (ui.shadcn.com, ingen kvote) brukes mens vi venter, og flere av
21st-valgene bygger på dem: **button, sheet, dialog, command, accordion, tabs, navigation-menu, carousel,
checkbox, slider, select, sonner, badge, separator, input, label, radio-group, scroll-area, breadcrumb, skeleton,
collapsible og popover**. De ligger i `src/components/ui/` og er koblet til tokens via `src/app/globals.css`.
Når shadcn-CLI-en ved en 21st-installasjon vil overskrive en av dem, svarer vi **nei**.

### Fast sjekkliste ved hver installasjon

1. Sett `API_KEY_21ST` i skallet fra `.env.local` (aldri i git, aldri `NEXT_PUBLIC_`), og kjør kommandoen ordrett
   fra listen. Ikke skriv ut den ekspanderte URL-en i logger.
2. Svar nei på overskriving av filer i `src/components/ui/`. Se gjennom `git diff` og `package.json` etterpå.
3. Fjern hardkodede farger: søk i de nye filene etter `#`, `rgb(`, `bg-`, `text-`, `border-`, `ring-`, `fill-`,
   `stroke-`, `from-`/`via-`/`to-`, `dark:`, og bytt til tokens (`bg-sand-50`, `text-regina-plum`,
   `border-sand-200` …) eller shadcn-navnene (`bg-primary`, `text-muted-foreground` …). Nye tekst/bakgrunn-par
   inn i `tokens.test.ts`.
4. Fjern `shadow-*`, `blur`/`backdrop-blur`, gradienter og store `rounded-*` (maks `--radius`, 2 px).
5. Bevegelse: bare transform/opacity, varighet `--dur-fast/base/slow`, easing `--ease-out`, og av ved redusert
   bevegelse. Innhold skal være synlig uten JavaScript (ingen `opacity: 0` som bare JS fjerner).
6. Ikoner til lucide-react; fjern andre ikonpakker fra `package.json` (se «Ikoner»).
7. Tekster til nb-NO («Lukk», «Søk», «Neste»). Demotekst, demobilder og demovideo fjernes helt – grep etter
   `http` i de nye filene.
8. Bilder via `next/image` med `sizes`. Produktbilder i kvadratiske flater på `--paper` med
   `mix-blend-mode: multiply`, ingen andre filtre.
9. Kommentar øverst i filen: komponent-URL, forfatter, lisens. Oppdater «Status» her med dato og endringer, og kjør
   `pnpm verify`.

## Oversikt over valgene

| #   | Seksjon                           | Valg                                                | Lisens       | Nye npm-avhengigheter                                     |
| --- | --------------------------------- | --------------------------------------------------- | ------------ | --------------------------------------------------------- |
| 1   | Navbar og mega-meny               | Rich Navigation Menu (shadcnui-blocks)              | MIT          | ingen (next, lucide-react finnes)                         |
| 2   | Hero og video-hero                | Editorial Hero (felipemenezes098)                   | MIT          | motion, react-wrap-balancer (planlagt fjernet)            |
| 3   | Produktkort                       | Product Card (deltacomponents)                      | MIT          | ingen                                                     |
| 4   | Produktkarusell                   | Gallery 6 (Shadcnblocks.com)                        | ikke oppgitt | ingen (lucide-react, carousel/Embla finnes)               |
| 5   | Merke-/logokarusell               | Marquee (Dillion Verma, Magic UI)                   | MIT          | ingen                                                     |
| 6   | Kategori-grid                     | Shop by Category Grid (uğur sözen, Beste)           | MIT          | ingen (next, lucide-react finnes)                         |
| 7   | Filtre/facets                     | Ecommerce Category Page (Mohammad Shehadeh, Hirael) | MIT          | ingen (next, lucide-react finnes)                         |
| 8   | Søkedialog                        | Command (Origin UI)                                 | MIT          | @radix-ui/react-icons (byttes ut), @radix-ui/react-dialog |
| 9   | Drawer-handlekurv                 | Sheet with Scrollable Content (ShadcnSpace)         | MIT          | ingen                                                     |
| 10  | Produktgalleri                    | Thumbnail image viewer (Waqar H. Syed, ibrandify)   | MIT          | ingen                                                     |
| 11  | Tabs og accordion                 | FAQ Section (Tommy Jepsen)                          | MIT          | ingen (lucide-react finnes)                               |
| 12  | Nyhetsbrev                        | Newsletter (kevingirelli)                           | MIT          | ingen                                                     |
| 13  | Footer                            | Newsletter Footer (Méschac Irung, Tailark)          | MIT          | ingen (next finnes)                                       |
| 14  | Sitat (i stedet for testimonials) | Quote Crossfade (Waqar H. Syed, ibrandify)          | MIT          | ingen                                                     |
| 15  | Timeline                          | Growth Story Timeline (ShadcnSpace)                 | MIT          | ingen                                                     |
| 16  | Kart og kontakt                   | MapMarker (Anmoldeep Singh, mapcn)                  | MIT          | maplibre-gl                                               |
| 17  | Toast                             | Sync Status Toast (ShadcnSpace)                     | MIT          | ingen (sonner, lucide-react finnes)                       |

Ingen av valgene krever framer-motion. `motion` fra heroen skal skrives om til CSS og fjernes igjen.

## Status i koden (27.10.2026)

Ingen 21st.dev-komponent er installert ennå: dagskvoten (2 per døgn på gratisnivået) var brukt opp da byggingen
startet. Hver seksjon er derfor bygget med shadcn/ui-primitiver fra det offisielle registeret og Tailwind-tokens,
slik at nettbutikken virker nå. Når en 21st.dev-komponent installeres (rekkefølgen under), erstatter den bare
markupen i filen som står her. Data, tilgjengelighet og regler (lenker som virker uten JavaScript, multiply på
produktbilder, pauseknapper, nb-NO) skal beholdes, og e2e-testene i `test/e2e/` må fortsatt være grønne.

| #   | Seksjon             | Bygget nå i                                                   | Primitiver / teknikk                            | Merknad før 21st.dev-installasjon                                                               |
| --- | ------------------- | ------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | Navbar og mega-meny | `src/components/layout/megameny.tsx`, `mobilmeny.tsx`         | Radix NavigationMenu, Sheet, Accordion          | Tastatur og Esc testet (`tilgjengelighet.spec.ts`)                                              |
| 2   | Hero / video-hero   | `src/components/forside/hero.tsx`                             | `<video>` med pause, plakatbilde                | **Plassholder:** bare plakatbilde (fasaden) til Regina leverer film                             |
| 3   | Produktkort         | `src/components/produkt/produktkort.tsx`                      | Badge, Button                                   | Hurtigkjøp bare når valget er entydig                                                           |
| 4   | Produktkarusell     | `src/components/produkt/produktrad.tsx`                       | CSS scroll-snap + pilknapper                    | Valgt bevisst framfor Embla: raden kan rulles uten JavaScript. Gallery 6 krever lisensavklaring |
| 5   | Merkekarusell       | `src/components/forside/merkebaand.tsx`                       | CSS-animasjon (transform), pauseknapp           | Merkenavn i Playfair – vi har ikke merkenes logoer med bruksrett                                |
| 6   | Kategori-grid       | `src/components/forside/seksjoner.tsx` (`Kategoriinnganger`)  | Produktbilde på papirflate                      | Bildet er den mest solgte varen på lager i kategorien                                           |
| 7   | Filtre/facets       | `src/components/katalog/filterpanel.tsx`, `filterskuff.tsx`   | `<details>`, lenker, Sheet på mobil             | Filtrene er lenker i adressen og virker uten JavaScript                                         |
| 8   | Søkedialog          | `src/components/layout/sokedialog.tsx`                        | Command (cmdk) i Dialog                         | Åpnes med «/» og Ctrl/Cmd+K                                                                     |
| 9   | Drawer-handlekurv   | `src/components/kurv/handlekurv.tsx`                          | Sheet                                           | «Gå til kassen» er et POST-skjema (se architecture.md §5.2)                                     |
| 10  | Produktgalleri      | `src/components/produkt/galleri.tsx`                          | scroll-snap på mobil, rutenett på stor skjerm   | Opptil 8 bilder, multiply på papir                                                              |
| 11  | Tabs og accordion   | `src/components/forside/bestselgere.tsx`, produktsiden        | Tabs (shadcn), `<details>` som accordion        | `<details>` er valgt på produktsiden så beskrivelsen er synlig uten JavaScript                  |
| 12  | Nyhetsbrev          | – (`src/app/kundeklubb/page.tsx`)                             | –                                               | Ingen egen nyhetsbrevtjeneste; innmelding går i Diller. Avklares                                |
| 13  | Footer              | `src/components/layout/footer.tsx`                            | –                                               | Åpningstider vises bare når de er bekreftet i WordPress                                         |
| 14  | Sitat               | ikke bygget                                                   | –                                               | Anbefales å utgå (ingen ekte kundesitater)                                                      |
| 15  | Timeline            | `src/components/forside/seksjoner.tsx` (`Historien`), om oss  | `<ol>` med linje                                | Bare årstall med kilde (`src/content/butikk.ts`)                                                |
| 16  | Kart og kontakt     | `src/components/innhold/kart.tsx`, `src/app/kontakt/page.tsx` | OpenStreetMap-iframe som lastes først ved klikk | Lettere enn maplibre-gl; vurder om MapMarker er verdt avhengigheten                             |
| 17  | Toast               | `src/components/ui/sonner.tsx`                                | Sonner (shadcn)                                 | Brukes for feil i kurven; bekreftelser leses opp med `aria-live`                                |

---

## 1. Navbar og mega-meny

| Kandidat             | Forfatter                          | Lisens       | Avhengigheter (npm)         | Vurdering                                                                                                                                                                                |
| -------------------- | ---------------------------------- | ------------ | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rich Navigation Menu | shadcnui-blocks (Shadcn UI Blocks) | MIT          | next, lucide-react          | Flerkolonne-paneler med kolonneoverskrift, ikon og beskrivelse på shadcn navigation-menu (Radix). SaaS-preg fra ikonboksene og demotekstene, men strukturen passer Duft/Hudpleie/Merker. |
| Shop Navigation Menu | Bundui.io (Shadcn UI Kit)          | ikke oppgitt | next, lucide-react          | Nettbutikkmeny med lenkeliste og bildepanel – visuelt nærmest Regina. Lisens mangler og kilden oppgis som shadcnuikit.com. Brukes bare som mønster for bildekolonnen.                    |
| Mega Menu            | LN (lndev-ui)                      | ikke oppgitt | lucide-react, framer-motion | Vercel-stil på mørk flate; framer-motion for lite gevinst, lisens mangler.                                                                                                               |
| Header 3             | Efferd (Efferd UI)                 | ikke oppgitt | lucide-react                | Hel header med mobilskuff og nestede menyer, men uskarp bakgrunn ved rulling (glass) og ingen lisens.                                                                                    |

- Rich Navigation Menu – https://21st.dev/@shadcnui-blocks/components/navigation-menu-06 –
  `npx shadcn@latest add "https://21st.dev/r/shadcnui-blocks/navigation-menu-06?api_key=$API_KEY_21ST"`
- Shop Navigation Menu – https://21st.dev/@bundui/components/navigation-menu4 –
  `npx shadcn@latest add "https://21st.dev/r/bundui/navigation-menu4?api_key=$API_KEY_21ST"`
- Mega Menu – https://21st.dev/@ln-dev7/components/mega-menu –
  `npx shadcn@latest add "https://21st.dev/r/ln-dev7/mega-menu?api_key=$API_KEY_21ST"`
- Header 3 – https://21st.dev/@efferd/components/header-3 –
  `npx shadcn@latest add "https://21st.dev/r/efferd/header-3?api_key=$API_KEY_21ST"`

**Valg:** Rich Navigation Menu (shadcnui-blocks).

**Begrunnelse:** MIT, bygger på Radix navigation-menu (tastatur, Escape og fokus fungerer som i
`src/components/ui/navigation-menu.tsx`) og har ikke noe animasjonsbibliotek. Kolonner med små overskrifter og
luft gir en rolig, redaksjonell meny som tåler sand og plomme uten å miste karakter – karakteren ligger i
oppsettet, ikke i fargene.

**Planlagte endringer:**

- Ikonboksene tas ut (eventuelt et lite lucide-linjeikon uten ramme). Kolonneoverskrifter i Poppins, små
  versaler, `text-sand-ink`; lenker i `text-regina-plum`, beskrivelser i `text-sand-ink`.
- Ny bildekolonne etter mønsteret fra Shop Navigation Menu, med Reginas egne bilder (ikke stock) via
  `next/image`.
- Panel på `bg-sand-50`, `border-sand-200`, ingen skygge, hjørner 0–2 px. Hover/aktiv: tynn understrek i
  `regina-pink-strong`.
- Åpning som fade/slide 150–200 ms (`data-[state]` + tw-animate-css), av ved redusert bevegelse.
- Innhold fra `data/categories.json` (7 hovedkategorier med normal skrift i stedet for VERSALER) og
  `data/brands.json`. «Nyheter» bare fra publiseringsdato, «Bestselgere» bare fra `total_sales`.
- Mobil: ui/sheet (`src/components/layout/mobilmeny.tsx`). Erstatter innholdet i
  `src/components/layout/megameny.tsx`.

**Status:** Valgt – venter på installasjon (kvote)

## 2. Hero og video-hero

| Kandidat                       | Forfatter                    | Lisens       | Avhengigheter (npm)         | Vurdering                                                                                                                                                               |
| ------------------------------ | ---------------------------- | ------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Editorial Hero (hero-05)       | felipemenezes098             | MIT          | motion, react-wrap-balancer | Tagline til venstre, serif-overskrift og tekst til høyre, helbreddes medieflate under. Rolig og redaksjonell; medieflaten tar en video med plakat.                      |
| Editorial Image Hero (hero-07) | felipemenezes098             | MIT          | motion, react-wrap-balancer | Samme familie med bildet øverst og teksten under. Svakere hos oss fordi header og kampanjebanner allerede ligger øverst.                                                |
| PrismaHero                     | Rahil Vahora                 | ikke oppgitt | lucide-react, framer-motion | Fullskjerm bakgrunnsvideo med ordanimasjon og flytende meny. Nærmest «bakgrunnsvideo», men mørkt overlegg, tekst som avhenger av videoen for kontrast, og ingen lisens. |
| Hero Video Dialog              | Dillion Verma (Magic UI)     | MIT          | lucide-react, framer-motion | Plakatbilde med avspillingsknapp som åpner filmen i en dialog. Aktuell hvis butikkfilmen får lyd; ikke bakgrunnsvideo.                                                  |
| Hero Video                     | YoucefBnm Bnm (Systaliko UI) | MPL-2.0      | motion                      | Video som vokser fra sirkel ved rulling; animerer inset og radius (ikke bare transform/opacity). MPL-2.0 er filbasert copyleft.                                         |

- Editorial Hero – https://21st.dev/@felipemenezes098/components/hero-05 –
  `npx shadcn@latest add "https://21st.dev/r/felipemenezes098/hero-05?api_key=$API_KEY_21ST"`
- Editorial Image Hero – https://21st.dev/@felipemenezes098/components/hero-07 –
  `npx shadcn@latest add "https://21st.dev/r/felipemenezes098/hero-07?api_key=$API_KEY_21ST"`
- PrismaHero – https://21st.dev/@rahil1202/components/prisma-hero –
  `npx shadcn@latest add "https://21st.dev/r/rahil1202/prisma-hero?api_key=$API_KEY_21ST"`
- Hero Video Dialog – https://21st.dev/@dillionverma/components/hero-video-dialog –
  `npx shadcn@latest add "https://21st.dev/r/dillionverma/hero-video-dialog?api_key=$API_KEY_21ST"`
- Hero Video – https://21st.dev/@youcefbnm/components/hero-video –
  `npx shadcn@latest add "https://21st.dev/r/youcefbnm/hero-video?api_key=$API_KEY_21ST"`

Også sett på og valgt bort: Hero With Video (Hossain Jahed, ikke oppgitt lisens, SaaS-uttrykk), Scroll-Locked
Video Hero (Guglielmo Giannattasio, MIT, låser rullingen) og Scroll media expansion hero (Arunachalam, MIT,
next + framer-motion, rullestyrt).

**Valg:** Editorial Hero (hero-05, felipemenezes098).

**Begrunnelse:** Ingen ren video-hero på 21st.dev oppfylte samtidig lisens, rolig uttrykk og regelen om bare
transform/opacity. Editorial Hero har den redaksjonelle karakteren vi vil ha (serif-overskrift, mye luft,
asymmetrisk tekst) og en helbreddes medieflate der en `<video>` med plakatbilde passer uten ekstra bibliotek.
Overskriften blir Playfair med kursiv aksent – det er nettopp det komponenten er bygget rundt.

**Planlagte endringer:**

- Medieflaten blir video-heroen, med plassholder til kunden leverer film (se «Plassholdere – Video-hero»).
  Logikken som finnes i `src/components/forside/hero.tsx` (plakat, pauseknapp, ingen avspilling ved redusert
  bevegelse) beholdes.
- Inngangsanimasjonen skrives om fra `motion` til CSS (fade/slide 200 ms, tw-animate-css), og
  `react-wrap-balancer` byttes med `text-wrap: balance`. Deretter fjernes begge pakkene.
- Fargeovergangen over bildet i demoen (bildet tones ut mot hvitt) tas ut. Flate `bg-sand-50`, overskrift
  `font-heading text-regina-plum`, primærknapp plomme, sekundær lenke i `regina-pink-strong`.
- Kampanjevariant: overskrift og lenke fra kampanjebanner-dataene med start- og sluttdato; uten aktiv kampanje
  vises butikkteksten.

**Status:** Valgt – venter på installasjon (kvote)

## 3. Produktkort

| Kandidat             | Forfatter             | Lisens       | Avhengigheter (npm)         | Vurdering                                                                                                   |
| -------------------- | --------------------- | ------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Product Card         | deltacomponents       | MIT          | ingen                       | Sammensatt kort: bildebrønn, knapp over bildet, tittel/undertittel/pris. Nøkternt, mye luft rundt bildet.   |
| Product Listing Card | ShadcnStore           | MIT          | ingen                       | Kort med førpris og «Add to Cart» i rutenett. Grei struktur, men demoen er tilbudspreget og kortet er lite. |
| Product Card         | Berat Berkay Gökdemir | ikke oppgitt | lucide-react, framer-motion | «New», «Best Seller», «-25 %», stjerner og «Free shipping» – bygger på påfunne fakta. Valgt bort.           |

- Product Card (deltacomponents) – https://21st.dev/@deltacomponents/components/product-card –
  `npx shadcn@latest add "https://21st.dev/r/deltacomponents/product-card?api_key=$API_KEY_21ST"`
- Product Listing Card – https://21st.dev/@shadcnstore/components/product-card-1 –
  `npx shadcn@latest add "https://21st.dev/r/shadcnstore/product-card-1?api_key=$API_KEY_21ST"`
- Product Card (beratberkayg) – https://21st.dev/@beratberkayg/components/product-card-1 –
  `npx shadcn@latest add "https://21st.dev/r/beratberkayg/product-card-1?api_key=$API_KEY_21ST"`

**Valg:** Product Card (deltacomponents).

**Begrunnelse:** MIT, ingen ekstra avhengigheter, og et sammensatt API (bilde, tittel, pris) som passer både
enkle og variable produkter. Bildebrønnen er i praksis den kvadratiske paper-flaten oppdraget ber om, og kortet
lar produktbildet være det store elementet.

**Planlagte endringer:**

- Bildebrønnen blir kvadratisk `bg-paper` med `mix-blend-multiply`, `object-contain` og riktige `sizes`.
- Ønskelisteknappen tas ut (ingen ønskeliste i omfanget). Plassen brukes til merker med grunnlag i data:
  «Kun i butikk», «Utsolgt», «Nyhet» (publiseringsdato), med ui/badge.
- Merke som overlinje i `text-sand-ink`, produktnavn i Poppins `text-regina-plum`, pris fra `src/lib/format.ts`
  («kr 949», «fra kr 2 645»; før- og etterpris bare ved ekte tilbud).
- Hurtigkjøp bare når valget er entydig (`hurtigkjop`). Hover: opacity/translate 150 ms, ingen skygge, hjørner 0.
- Erstatter `src/components/produkt/produktkort.tsx` (data og logikk beholdes).

**Status:** Valgt – venter på installasjon (kvote)

## 4. Produktkarusell

| Kandidat         | Forfatter                           | Lisens       | Avhengigheter (npm)         | Vurdering                                                                                                                                        |
| ---------------- | ----------------------------------- | ------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Gallery 6        | Shadcnblocks.com                    | ikke oppgitt | lucide-react                | Helbreddes rad der kortene går ut av skjermen, overskrift til venstre og piler til høyre; bygger på shadcn carousel (Embla) ifølge beskrivelsen. |
| Carousel         | Julien Thibeaut (Motion Primitives) | MIT          | motion, lucide-react        | Enkel og ryddig, men egen motion-motor i stedet for Embla som allerede finnes.                                                                   |
| Product Carousel | Ravi Katiyar                        | ikke oppgitt | lucide-react, framer-motion | Dagligvarepreg («20 MINS», «% OFF»), ingen lisens.                                                                                               |

- Gallery 6 – https://21st.dev/@shadcnblockscom/components/gallery6 –
  `npx shadcn@latest add "https://21st.dev/r/shadcnblockscom/gallery6?api_key=$API_KEY_21ST"`
- Carousel – https://21st.dev/@ibelick/components/carousel –
  `npx shadcn@latest add "https://21st.dev/r/ibelick/carousel?api_key=$API_KEY_21ST"`
- Product Carousel – https://21st.dev/@ravikatiyar162/components/product-carousel –
  `npx shadcn@latest add "https://21st.dev/r/ravikatiyar162/product-carousel?api_key=$API_KEY_21ST"`

**Valg:** Gallery 6 (Shadcnblocks.com) – **med lisensforbehold.**

**Begrunnelse:** Raden som løper ut av skjermen med overskrift og piler gir et redaksjonelt «hylle»-uttrykk, og
den bruker shadcn carousel (Embla er allerede installert), så den trekker ikke inn nye avhengigheter. Kortene
byttes med produktkortet fra seksjon 3, så karusellen og listene får samme uttrykk.

**Forbehold:** Komponentsiden oppgir ingen lisens. Lisensen må avklares med Shadcnblocks.com før installasjon. Er
den ikke avklart på installasjonsdagen, hoppes den over og bygges med samme oppsett direkte på
`src/components/ui/carousel.tsx`; kvoteplassen går da til neste i køen.

**Planlagte endringer:**

- Tekstkortene byttes med Produktkort. Overskrift i Playfair, «Se alle» som lenke i `regina-pink-strong`.
- Piler: lucide `ChevronLeft`/`ChevronRight` i tynn `border-sand-200`, 44 px trykkflate, `aria-label` «Forrige»
  og «Neste». Ingen autoavspilling.
- Grå bildeflater i demoen byttes med `bg-paper`. Brukes til Nyheter, Bestselgere og «Mer fra samme merke».

**Status:** Valgt – venter på installasjon (kvote)

## 5. Merke-/logokarusell (marquee)

| Kandidat           | Forfatter                | Lisens | Avhengigheter (npm) | Vurdering                                                                                                                                  |
| ------------------ | ------------------------ | ------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Marquee            | Dillion Verma (Magic UI) | MIT    | ingen               | Ren CSS (translate i keyframes), `pauseOnHover`, `reverse`, vertikal variant. Nøytral; tar Reginas typografi uten motstand.                |
| Logo Marquee       | Özer (interior.dev)      | MIT    | motion              | Tilgjengelig: pause ved peker og fokus, respekterer redusert bevegelse, myk oppbygging. Mønsteret ble brukt i konseptfasen. Krever motion. |
| Logo Cloud Marquee | Oliver                   | MIT    | @remixicon/react    | «Trusted by»-stripe med tonede kanter og pause ved peker; nytt ikonsett og SaaS-tekst.                                                     |

- Marquee – https://21st.dev/@dillionverma/components/marquee –
  `npx shadcn@latest add "https://21st.dev/r/dillionverma/marquee?api_key=$API_KEY_21ST"`
- Logo Marquee – https://21st.dev/@ddoemonn/components/logo-marquee –
  `npx shadcn@latest add "https://21st.dev/r/ddoemonn/logo-marquee?api_key=$API_KEY_21ST"`
- Logo Cloud Marquee – https://21st.dev/@olewandowski1/components/logo-cloud-3 –
  `npx shadcn@latest add "https://21st.dev/r/olewandowski1/logo-cloud-3?api_key=$API_KEY_21ST"`

**Valg:** Marquee (Dillion Verma, Magic UI).

**Begrunnelse:** MIT og ingen avhengigheter. Bevegelsen er en CSS-transform som er lett å stoppe med
`prefers-reduced-motion`, ved fokus og med en pauseknapp. Komponenten er bare en motor, så merkenavnene i
Playfair bærer uttrykket.

**Planlagte endringer:**

- Keyframes og `--duration`/`--gap` flyttes fra `tailwind.config.js` (som komponentsiden beskriver) til
  `@theme` i `src/app/globals.css` (Tailwind v4).
- Pauseknapp (WCAG 2.2.2) med lucide `Pause`/`Play` og norsk `aria-label`; pause også ved `:focus-within`.
  Ved redusert bevegelse står båndet stille og kan rulles.
- Kopiene får `aria-hidden` og `tabIndex={-1}` på lenkene. Rolig fart (40–60 s per runde).
- Merkenavn fra `data/brands.json` i Playfair – ikke logoer (vi har ikke bruksrett til merkelogoene). Merker som
  bare selges i butikken står i egen seksjon.
- Erstatter motoren i `src/components/forside/merkebaand.tsx`.

**Status:** Valgt – venter på installasjon (kvote)

## 6. Kategori-grid

| Kandidat              | Forfatter                  | Lisens       | Avhengigheter (npm) | Vurdering                                                                                                                |
| --------------------- | -------------------------- | ------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Shop by Category Grid | uğur sözen (Beste)         | MIT          | next, lucide-react  | Bildekort med tittel, beskrivelse, antall produkter og pil; svak zoom ved peker; «Featured»-merke. Laget for nettbutikk. |
| Layout Grid           | Manu Arora (Aceternity UI) | MIT          | framer-motion       | Bilderutenett der kort utvides ved klikk. Spektakulært, men skjuler innhold bak klikk og krever framer-motion.           |
| Category List         | Vaibhav Kumar Singh        | ikke oppgitt | ingen               | Tekstliste med SaaS-preg, ingen lisens.                                                                                  |

- Shop by Category Grid – https://21st.dev/@ziegfiroyt/components/ecommerce4 –
  `npx shadcn@latest add "https://21st.dev/r/ziegfiroyt/ecommerce4?api_key=$API_KEY_21ST"`
- Layout Grid – https://21st.dev/@manuarora700/components/layout-grid –
  `npx shadcn@latest add "https://21st.dev/r/manuarora700/layout-grid?api_key=$API_KEY_21ST"`
- Category List – https://21st.dev/@vaib215/components/category-list –
  `npx shadcn@latest add "https://21st.dev/r/vaib215/category-list?api_key=$API_KEY_21ST"`

**Valg:** Shop by Category Grid (uğur sözen, Beste).

**Begrunnelse:** MIT, laget for butikkinnganger, og antall produkter per kategori er ekte data vi har. Store
bildeflater og lite pynt gjør at den tåler sand og plomme.

**Planlagte endringer:**

- «Featured»-merket tas ut. Antall fra `data/categories.json`; kategorinavn i normal skrift.
- Den mørke fargeovergangen over bildene byttes med tekst under bildet (eller et plommebånd). Titler i Playfair.
- Zoom ved peker: `scale(1.03)` over `--dur-slow`, av ved redusert bevegelse. Hjørner 0.
- Reginas egne butikkbilder og frilagte produkter på `--paper` – ikke stockbilder.

**Status:** Valgt – venter på installasjon (kvote)

## 7. Filtre/facets

| Kandidat                | Forfatter                  | Lisens | Avhengigheter (npm)              | Vurdering                                                                                                                                                                         |
| ----------------------- | -------------------------- | ------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ecommerce Category Page | Mohammad Shehadeh (Hirael) | MIT    | next, lucide-react               | Kategoriside med fast filterkolonne: kategorier med antall som reagerer på de andre filtrene, pris, farge, lager og vurdering; sortering og antall treff. Nøkternt, tynne linjer. |
| Price Range Slider      | ShadcnSpace                | MIT    | lucide-react, @number-flow/react | Dobbelt prisspenn med animerte tall. Pent, men en ekstra pakke bare for tallanimasjon; dekker bare pris.                                                                          |
| Filter Toolbar          | kuratlielia                | MIT    | motion, lucide-react             | Aktive filtre som brikker med «Fjern alle». Linear-/SaaS-preg og motion.                                                                                                          |

- Ecommerce Category Page – https://21st.dev/@mohammadshehadeh/components/ecommerce-04 –
  `npx shadcn@latest add "https://21st.dev/r/mohammadshehadeh/ecommerce-04?api_key=$API_KEY_21ST"`
- Price Range Slider – https://21st.dev/@shadcnspace/components/slider-06 –
  `npx shadcn@latest add "https://21st.dev/r/shadcnspace/slider-06?api_key=$API_KEY_21ST"`
- Filter Toolbar – https://21st.dev/@kuratlielia/components/filter-toolbar –
  `npx shadcn@latest add "https://21st.dev/r/kuratlielia/filter-toolbar?api_key=$API_KEY_21ST"`

**Valg:** Ecommerce Category Page (Mohammad Shehadeh, Hirael).

**Begrunnelse:** Dekker oppdraget §7.2 (underkategori, pris, på lager, farge, sortering, antall treff) i én MIT-
komponent uten animasjonsbibliotek. Antall som oppdateres mot de andre filtrene er riktig fasettlogikk, og
uttrykket er allerede tynne linjer og luft.

**Planlagte endringer:**

- Vurdering/stjerner og «Free shipping»-teksten tas ut (ingen anmeldelser, ingen leveringsløfter).
- Merke-fasett (`data/brands.json`) og størrelse/farge fra variantattributtene legges til. Fargeprikker bare der
  attributtet finnes.
- Filtrene ligger i URL-en (`searchParams`) så de kan deles. Kontrollene bruker ui/checkbox, slider, select og
  radio-group. Pris i kr (nb-NO). Sortering: Nyeste, Populære (`total_sales`), Pris lav–høy, Pris høy–lav.
- Mobil: filtrene i ui/sheet. Erstatter oppsettet i `src/components/katalog/filterpanel.tsx` og
  `sortering.tsx`; datalogikken beholdes.

**Status:** Valgt – venter på installasjon (kvote)

## 8. Søkedialog (command palette)

| Kandidat                        | Forfatter                  | Lisens       | Avhengigheter (npm)                                 | Vurdering                                                                                         |
| ------------------------------- | -------------------------- | ------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Command                         | Origin UI                  | MIT          | cmdk, @radix-ui/react-icons, @radix-ui/react-dialog | Søkeknapp med hurtigtast og dialog med grupperte treff – «enhanced shadcn command». Ren og rolig. |
| Command Menu with Global Search | Ephraim Duncan (blocks.so) | MIT          | cmdk, @tabler/icons-react                           | Typefilter og nylig åpnede; chat-orientert demo og et annet ikonsett.                             |
| Search Modal                    | Efferd (Efferd UI)         | ikke oppgitt | lucide-react                                        | Kategoriserte treff med beskrivelse; ingen lisens.                                                |

- Command (Origin UI) – https://21st.dev/@originui/components/command –
  `npx shadcn@latest add "https://21st.dev/r/originui/command?api_key=$API_KEY_21ST"`
- Command Menu with Global Search – https://21st.dev/@ephraimduncan/components/command-menu-04 –
  `npx shadcn@latest add "https://21st.dev/r/ephraimduncan/command-menu-04?api_key=$API_KEY_21ST"`
- Search Modal – https://21st.dev/@efferd/components/search-modal –
  `npx shadcn@latest add "https://21st.dev/r/efferd/search-modal?api_key=$API_KEY_21ST"`

**Valg:** Command (Origin UI).

**Begrunnelse:** MIT og bygget på det vi allerede har (cmdk og Radix Dialog). Knappen med hurtigtast passer i
headeren, og gruppene passer Produkter, Merker og Kategorier (oppdraget §7.5).

**Planlagte endringer:**

- `@radix-ui/react-icons` byttes med lucide (`Search`, `ArrowUpRight`) og fjernes fra `package.json`. Sjekk at
  `@radix-ui/react-dialog` ikke dupliserer `radix-ui`-pakken; bruk eksisterende ui/dialog.
- `shouldFilter={false}` når treffene kommer fra serveren. Produkttreff med bilde på `--paper`, merke og pris.
- Hurtigtaster ⌘K / Ctrl+K og «/». Tekster: «Søk etter produkter, merker og kategorier», «Ingen treff».
- Overlegg i plomme med opacity (ingen blur), panel `bg-paper` med `border-sand-200`, ingen skygge, fade 150 ms.
- Erstatter `src/components/layout/sokedialog.tsx`.

**Status:** Valgt – venter på installasjon (kvote)

## 9. Drawer-handlekurv

| Kandidat                      | Forfatter   | Lisens       | Avhengigheter (npm) | Vurdering                                                                                                                                            |
| ----------------------------- | ----------- | ------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sheet with Scrollable Content | ShadcnSpace | MIT          | ingen               | Sideskuff fra høyre med topp, lang rullbar midtdel og lukk – skjelettet til en kurv. Ren shadcn Sheet.                                               |
| Drawer                        | Efferd      | ikke oppgitt | vaul                | Vaul-skuff fra alle kanter; ny pakke og ingen lisens.                                                                                                |
| Checkout Summary              | astralyxdev | MIT          | ingen               | Sum med delsum, rabatt, mva og frakt, der ukjente beløp står som «beregnes i neste steg». Godt mønster for bunnen av kurven (ingen leveringsløfter). |

- Sheet with Scrollable Content – https://21st.dev/@shadcnspace/components/sheet-02 –
  `npx shadcn@latest add "https://21st.dev/r/shadcnspace/sheet-02?api_key=$API_KEY_21ST"`
- Drawer – https://21st.dev/@efferd/components/drawer –
  `npx shadcn@latest add "https://21st.dev/r/efferd/drawer?api_key=$API_KEY_21ST"`
- Checkout Summary – https://21st.dev/@astralyxdev/components/checkout-summary –
  `npx shadcn@latest add "https://21st.dev/r/astralyxdev/checkout-summary?api_key=$API_KEY_21ST"`

**Valg:** Sheet with Scrollable Content (ShadcnSpace).

**Begrunnelse:** MIT, ingen nye pakker, og Radix Dialog under gir fokusfelle, Escape og tilbakeført fokus.
Oppsettet topp / rullbar liste / fast bunn er nøyaktig en kurvskuff. Checkout Summary brukes som mønster for
sumfeltet uten egen installasjon.

**Planlagte endringer:**

- Innhold: varelinjer (bilde på `--paper`, merke, navn, variant, antall med ui/button, pris), sum fra Store API
  (øre til kr), «Gå til kassen» i plomme til `/kasse/videre`. Frakt står som «beregnes i kassen».
- `backdrop-blur` på overlegget tas ut (glass); overlegg i plomme med opacity. Slide inn med `translateX` over
  `--dur-slow`, av ved redusert bevegelse.
- `aria-live` for endringer (`kurvmeldinger.tsx`), tom kurv-tilstand, tekster «Handlekurv» og «Lukk».
- Erstatter oppsettet i `src/components/kurv/handlekurv.tsx`.

**Status:** Valgt – venter på installasjon (kvote)

## 10. Produktgalleri

| Kandidat               | Forfatter                     | Lisens       | Avhengigheter (npm)                         | Vurdering                                                                                                         |
| ---------------------- | ----------------------------- | ------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Thumbnail image viewer | Waqar H. Syed (ibrandify UI)  | MIT          | ingen                                       | Hovedbilde med tastaturnavigerbar miniatyrrad, teller «01 / 04» og bildetekst. Redaksjonelt og tilgjengelig.      |
| Thumbnail Carousel     | Ayushmaan Singh (Serenity UI) | MIT          | next, framer-motion                         | Sveip, fjæranimasjon og autoavspilling – autoavspilling passer ikke produktbilder, og framer-motion gir lite her. |
| Image Zoom             | Ali Imam                      | ikke oppgitt | next, lucide-react, react-medium-image-zoom | Zoom ved klikk; ingen lisens. Zoom kan senere gjøres med ui/dialog.                                               |

- Thumbnail image viewer – https://21st.dev/@ibrandify/components/thumbnail-image-viewer –
  `npx shadcn@latest add "https://21st.dev/r/ibrandify/thumbnail-image-viewer?api_key=$API_KEY_21ST"`
- Thumbnail Carousel – https://21st.dev/@ayushmxxn/components/thumbnail-carousel –
  `npx shadcn@latest add "https://21st.dev/r/ayushmxxn/thumbnail-carousel?api_key=$API_KEY_21ST"`
- Image Zoom – https://21st.dev/@designali-in/components/image-zoom –
  `npx shadcn@latest add "https://21st.dev/r/designali-in/image-zoom?api_key=$API_KEY_21ST"`

**Valg:** Thumbnail image viewer (Waqar H. Syed, ibrandify UI).

**Begrunnelse:** MIT, ingen avhengigheter, tastaturnavigasjon innebygd, og et rolig magasinuttrykk (teller og
bildetekst) som passer Playfair/Poppins. Det store hovedbildet oppfyller «store produktbilder».

**Planlagte endringer:**

- Kvadratisk `bg-paper` med `mix-blend-multiply` og `object-contain` – produktbildene beskjæres aldri.
- Stedsmerker og mørk fargeovergang over bildet tas ut. Teller i Poppins `text-sand-ink`.
- Miniatyrer med tynn ramme; valgt miniatyr får `border-regina-plum`. Opptil 8 bilder (oppdraget §7.3), alt-tekst
  med produktnavn som reserve. Bildeskifte som kryssfade (opacity 200 ms); sveip på mobil med scroll-snap.
- Erstatter `src/components/produkt/galleri.tsx`.

**Status:** Valgt – venter på installasjon (kvote)

## 11. Tabs og accordion

| Kandidat            | Forfatter    | Lisens | Avhengigheter (npm)  | Vurdering                                                                                                      |
| ------------------- | ------------ | ------ | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| FAQ Section         | Tommy Jepsen | MIT    | lucide-react         | To kolonner: overskrift, tekst og kontaktknapp til venstre, spørsmål med tynne linjer til høyre. Redaksjonelt. |
| FAQ with Categories | Kokonut UI   | MIT    | ingen                | Kategorimerke på hvert spørsmål, spørsmål i kort med ramme; mer «app» enn magasin.                             |
| Tabs                | Origin UI    | MIT    | @radix-ui/react-tabs | Varianter av shadcn-faner; liten gevinst over ui/tabs som allerede finnes.                                     |

- FAQ Section – https://21st.dev/@tommyjepsen/components/faq-section –
  `npx shadcn@latest add "https://21st.dev/r/tommyjepsen/faq-section?api_key=$API_KEY_21ST"`
- FAQ with Categories – https://21st.dev/@kokonutd/components/faq-with-categories –
  `npx shadcn@latest add "https://21st.dev/r/kokonutd/faq-with-categories?api_key=$API_KEY_21ST"`
- Tabs – https://21st.dev/@originui/components/tabs –
  `npx shadcn@latest add "https://21st.dev/r/originui/tabs?api_key=$API_KEY_21ST"`

**Valg:** FAQ Section (Tommy Jepsen). Fanene (f.eks. «Finn duften etter noten») bruker ui/tabs fra det
offisielle registeret og trenger ingen kvoteplass.

**Begrunnelse:** MIT, bygger på accordion, og har allerede tynne linjer og luft. Venstrekolonnen gir plass til en
Playfair-overskrift og en personlig «spør oss»-knapp, som passer en butikk med veiledning.

**Planlagte endringer:**

- Spørsmål og svar bare fra Reginas egne vilkår og `src/content/butikk.ts` (med kilde).
- Overskrift Playfair, spørsmål Poppins 17–18 px plomme, linjer `border-sand-200`, chevron roteres over 200 ms.
- Kontaktknappen blir «Spør oss i butikken» med telefon og e-post fra `butikk.ts` (ingen svartidsløfter).
- Svarene skal kunne leses uten JavaScript (`forceMount` med CSS-skjuling eller `<details>` som reserve).
- Brukes også til produktbeskrivelsen på produktsiden (oppdraget §7.3).

**Status:** Valgt – venter på installasjon (kvote)

## 12. Nyhetsbrev og innmelding

| Kandidat               | Forfatter              | Lisens       | Avhengigheter (npm)      | Vurdering                                                                                                    |
| ---------------------- | ---------------------- | ------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Newsletter             | kevingirelli (@delego) | MIT          | ingen                    | Innmeldingsbånd: tittel og tekst til venstre, e-postskjema til høyre med tilstandene venter, lyktes og feil. |
| Newsletter Band        | Oliver                 | ikke oppgitt | sonner, @remixicon/react | Har samtykkeavkrysning (bra), men ingen lisens og et annet ikonsett.                                         |
| Newsletter Signup Card | Théo Balick            | ikke oppgitt | lucide-react             | Kort som bytter til bekreftelse; ingen lisens.                                                               |

- Newsletter – https://21st.dev/@kevingirelli/components/newsletter –
  `npx shadcn@latest add "https://21st.dev/r/kevingirelli/newsletter?api_key=$API_KEY_21ST"`
- Newsletter Band – https://21st.dev/@olewandowski1/components/newsletter-2 –
  `npx shadcn@latest add "https://21st.dev/r/olewandowski1/newsletter-2?api_key=$API_KEY_21ST"`
- Newsletter Signup Card – https://21st.dev/@balick/components/newsletter-01 –
  `npx shadcn@latest add "https://21st.dev/r/balick/newsletter-01?api_key=$API_KEY_21ST"`

**Valg:** Newsletter (kevingirelli).

**Begrunnelse:** MIT, ingen avhengigheter, og tilstandene for venter/lyktes/feil er allerede på plass. Et lavt
bånd med tekst og ett felt er rolig nok til å stå på sand uten å rope.

**Planlagte endringer:**

- Samtykke med ui/checkbox og lenke til personvern (aktivt samtykke til e-postmarkedsføring), etter mønsteret i
  Newsletter Band.
- Mottaker avklares med Marius (Diller-kundeklubben eller Reginas e-postverktøy). Skjemaet sender ingenting før det
  er bekreftet – e-post til kunder er på listen over ting vi spør om først.
- Demoens løfter («No spam», «once a month») tas ut. Bånd på `bg-sand-100` med tynn linje, knapp i plomme,
  feilmeldinger på norsk.

**Status:** Valgt – venter på installasjon (kvote)

## 13. Footer

| Kandidat                 | Forfatter                  | Lisens | Avhengigheter (npm)  | Vurdering                                                                                             |
| ------------------------ | -------------------------- | ------ | -------------------- | ----------------------------------------------------------------------------------------------------- |
| Newsletter Footer        | Méschac Irung (Tailark)    | MIT    | next                 | Logo, adresse, sosiale lenker, tre lenkekolonner og nyhetsbrevfelt, med bunnlinje. Luftig og nøktern. |
| Newsletter Signup Footer | Oliver (7Ovr)              | MIT-0  | sonner, lucide-react | Nyhetsbrev, kolonner og sosiale ikoner; mest tillatende lisens, men ingen naturlig plass til adresse. |
| Large Name Footer        | Arihant jain (Spectrum UI) | MIT    | ingen                | Stort ordbilde under kolonnene. Brukt som mønster i konseptet (adressen satt stort).                  |

- Newsletter Footer – https://21st.dev/@meschacirung/components/footer-4 –
  `npx shadcn@latest add "https://21st.dev/r/meschacirung/footer-4?api_key=$API_KEY_21ST"`
- Newsletter Signup Footer – https://21st.dev/@olewandowski1/components/footer-3 –
  `npx shadcn@latest add "https://21st.dev/r/olewandowski1/footer-3?api_key=$API_KEY_21ST"`
- Large Name Footer – https://21st.dev/@arihantcodes_1f7b8c4d/components/large-name-footer –
  `npx shadcn@latest add "https://21st.dev/r/arihantcodes_1f7b8c4d/large-name-footer?api_key=$API_KEY_21ST"`

**Valg:** Newsletter Footer (Méschac Irung, Tailark).

**Begrunnelse:** MIT, bare `next` som avhengighet, og den har plassen Regina trenger mest: adresse og kontakt
under logoen. Kolonnene passer Kundeservice, Butikken og Vilkår.

**Planlagte endringer:**

- Logo er Reginas originalfil fra `public/brand/`, uendret. Adresse, telefon, e-post og org.nr fra `butikk.ts`;
  åpningstider hentes fra WordPress, aldri hardkodet.
- «All Systems Normal»-merket tas ut. Den lilla knappen blir plomme (sjekk om fargen er hardkodet eller kommer fra
  `--primary`).
- Nyhetsbrevfeltet brukes bare ett sted per side: enten her eller i seksjon 12 (anbefaling: kompakt her på alle
  sider, seksjon 12 bare på forsiden og kundeklubbsiden – samme skjemalogikk).
- Flate `bg-sand-100` med plommetekst (eller plomme med sandtekst; paret inn i `tokens.test.ts`). Sosiale lenker
  som tekst («Instagram», «Facebook»), se «Ikoner». Adressen kan settes stort i Playfair (Large Name-mønsteret).
- Erstatter oppsettet i `src/components/layout/footer.tsx`.

**Status:** Valgt – venter på installasjon (kvote)

## 14. Testimonials og sitat

**Anbefaling:** testimonials-seksjonen **utgår**. Regina har ingen ekte kundesitater vi kan bruke, og vi finner
ikke på noen. I stedet vurderes en sitatblokk for butikkens egne ord, med kilde.

| Kandidat              | Forfatter                    | Lisens       | Avhengigheter (npm) | Vurdering                                                                                                        |
| --------------------- | ---------------------------- | ------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Quote Crossfade       | Waqar H. Syed (ibrandify UI) | MIT          | ingen               | Sitatpanel med tydelig kildeangivelse, manuell navigasjon og kryssfade. Demoen merker selv sitatene som fiktive. |
| Editorial Testimonial | Jatin Yadav                  | ikke oppgitt | next, lucide-react  | Store tall («01») og typografisk sitat; redaksjonelt, men laget for kundeuttalelser med avatar og uten lisens.   |
| Minimal Testimonial   | Jatin Yadav                  | ikke oppgitt | next                | Enkel, men overgangen bruker blur (bryter regelen om bare transform/opacity) og har ingen lisens.                |

- Quote Crossfade – https://21st.dev/@ibrandify/components/quote-crossfade –
  `npx shadcn@latest add "https://21st.dev/r/ibrandify/quote-crossfade?api_key=$API_KEY_21ST"`
- Editorial Testimonial – https://21st.dev/@jatin-yadav05/components/editorial-testimonial –
  `npx shadcn@latest add "https://21st.dev/r/jatin-yadav05/editorial-testimonial?api_key=$API_KEY_21ST"`
- Minimal Testimonial – https://21st.dev/@jatin-yadav05/components/minimal-testimonial –
  `npx shadcn@latest add "https://21st.dev/r/jatin-yadav05/minimal-testimonial?api_key=$API_KEY_21ST"`

**Valg:** Quote Crossfade (Waqar H. Syed, ibrandify UI) – **betinget**, installeres sist og bare hvis Marius vil
ha en sitatblokk.

**Begrunnelse:** MIT, ingen avhengigheter, og den er bygget rundt kildeangivelse – det er nettopp kravet vårt.
Med ett sitat blir den en ren redaksjonell fremheving. Eksempel med kilde i `butikk.ts` (Om oss i nettbutikken,
endret 10.09.2025): «en engasjert firkløver som brenner for fagkunnskap, personlig service og ekte
skjønnhetsglede».

**Planlagte endringer:**

- Ett sitat: navigasjon, initial-avatarer og merket «A clearer handoff» tas ut. Kildelinje er påkrevd.
- Sitat i Playfair kursiv (stor tekst, så anførselstegnet kan stå i `regina-pink`), kilde i Poppins
  `text-sand-ink` med lenke. Ingen automatisk skifte.

**Status:** Valgt – venter på installasjon (kvote)

## 15. Timeline – historien siden 1863

| Kandidat                   | Forfatter                    | Lisens | Avhengigheter (npm) | Vurdering                                                                                                              |
| -------------------------- | ---------------------------- | ------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Growth Story Timeline      | ShadcnSpace                  | MIT    | ingen               | Tekst og bilder veksler langs en tynn midtlinje som fylles ved rulling; årstall over tittelen. Demoen har tre punkter. |
| Scroll animated timeline   | Waqar H. Syed (ibrandify UI) | MIT    | ingen               | Sentrert og minimal; linjen tegnes og kortene avdekkes ved rulling. Mindre plass til bilder.                           |
| Milestone Timeline Feature | uiable                       | MIT    | framer-motion       | Kort med skygge og grønn aksent; framer-motion gir lite her.                                                           |

- Growth Story Timeline – https://21st.dev/@shadcnspace/components/timeline-01 –
  `npx shadcn@latest add "https://21st.dev/r/shadcnspace/timeline-01?api_key=$API_KEY_21ST"`
- Scroll animated timeline – https://21st.dev/@ibrandify/components/scroll-timeline –
  `npx shadcn@latest add "https://21st.dev/r/ibrandify/scroll-timeline?api_key=$API_KEY_21ST"`
- Milestone Timeline Feature – https://21st.dev/@uiable/components/feature-24-milestone-timeline –
  `npx shadcn@latest add "https://21st.dev/r/uiable/feature-24-milestone-timeline?api_key=$API_KEY_21ST"`

**Valg:** Growth Story Timeline (ShadcnSpace).

**Begrunnelse:** MIT, ingen avhengigheter, tynn linje og mye luft. De tre punktene i demoen svarer til de tre
punktene vi har kilde for i `HISTORIE.tidslinje` (1863, 1970, i dag), og årstallet kan settes stort i Playfair.

**Planlagte endringer:**

- Bare punktene i `HISTORIE.tidslinje` – ingen utfylling. Årstall i Playfair (stor tekst, rosa tillatt som aksent).
- Stockbildene tas ut. Bare Reginas egne bilder med kilde i `docs/bildekilder.md`, og aldri et nytt bilde
  presentert som historisk; uten arkivbilde står punktet uten bilde.
- Progresjonslinjen skal animeres med `transform: scaleY` (skrives om hvis den bruker `height`); ved redusert
  bevegelse og uten JavaScript står linjen og innholdet ferdig. Hjørner 0–2 px.

**Status:** Valgt – venter på installasjon (kvote)

## 16. Kart og kontakt

| Kandidat     | Forfatter               | Lisens       | Avhengigheter (npm)                    | Vurdering                                                                                                                                          |
| ------------ | ----------------------- | ------------ | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| MapMarker    | Anmoldeep Singh (mapcn) | MIT          | maplibre-gl, lucide-react              | Markører med eget innhold, tooltip og popup på MapLibre-kart; del av mapcn (Map, MapControls, MarkerPopup). Åpen kildekode, ingen kart-API-nøkkel. |
| Map          | Anmoldeep Singh (mapcn) | ikke oppgitt | maplibre-gl, next-themes, lucide-react | Grunnkartet i samme bibliotek; lisens ikke oppgitt på siden.                                                                                       |
| Contact Card | Efferd                  | ikke oppgitt | lucide-react                           | Kontaktinfo med ikoner og skjema, tynne linjer; ingen lisens, og «svarer innen 1 virkedag» er et løfte vi ikke har grunnlag for.                   |

- MapMarker – https://21st.dev/@mapcn/components/mapcn-map-marker –
  `npx shadcn@latest add "https://21st.dev/r/mapcn/mapcn-map-marker?api_key=$API_KEY_21ST"`
- Map – https://21st.dev/@mapcn/components/map –
  `npx shadcn@latest add "https://21st.dev/r/mapcn/map?api_key=$API_KEY_21ST"`
- Contact Card – https://21st.dev/@efferd/components/contact-card –
  `npx shadcn@latest add "https://21st.dev/r/efferd/contact-card?api_key=$API_KEY_21ST"`

Også sett på: Contact 01 (ShadcnSpace, MIT – forespørselsskjema for byråer med logostripe) og Expand Map (Jatin
Yadav, ikke oppgitt lisens, framer-motion).

**Valg:** MapMarker (Anmoldeep Singh, mapcn).

**Begrunnelse:** Den eneste ekte kartkomponenten med oppgitt lisens. MapLibre krever ingen kart-API-nøkkel, og en
markør med eget innhold gir et adressekort i tokens. Kontaktdelen (adresse, telefon, e-post, timebestilling) er
enkel markup fra `butikk.ts` og trenger ingen 21st-komponent.

**Forbehold:** Forhåndsvisningen viste bare en lasteindikator i testmiljøet (WebGL/kartfliser i hodeløs
Chromium), så vurderingen bygger på beskrivelse og avhengigheter. Map-grunnkartet oppgir ikke lisens; sjekk ved
installasjon at MapMarker tar med Map-basen, og avklar lisensen.

**Planlagte endringer:**

- `maplibre-gl` er stort: kartet lastes først ved klikk («Vis kart») eller når det kommer i syne, med en statisk
  plassholder (adresse og lenke til `BUTIKK.kart`). Kartet er aldri på kritisk sti (Lighthouse ≥ 90).
- Kartfliser fra en tredjepart sender kundens IP-adresse: last ved klikk eller etter samtykke, og behold
  OpenStreetMap-kreditering synlig.
- Lys, nedtonet kartstil; markør i plomme med rosa prikk; popup på `bg-paper` med `border-sand-200`, ingen skygge.
- Brukes på `src/app/kontakt` og i «Besøk butikken» på forsiden.

**Status:** Valgt – venter på installasjon (kvote)

## 17. Toast

| Kandidat          | Forfatter          | Lisens       | Avhengigheter (npm)  | Vurdering                                                   |
| ----------------- | ------------------ | ------------ | -------------------- | ----------------------------------------------------------- |
| Sync Status Toast | ShadcnSpace        | MIT          | sonner, lucide-react | Rik Sonner-toast med ikon, metadata og to handlingsknapper. |
| Sonner Toast      | Isaiah (@bjork-ui) | ikke oppgitt | sonner, lucide-react | Varm, lys stil som ligger nær sand; ingen lisens.           |
| Position Sonner   | uiable             | MIT          | sonner               | Bare en demo av posisjoner; gir ingenting utover ui/sonner. |

- Sync Status Toast – https://21st.dev/@shadcnspace/components/sonner-05 –
  `npx shadcn@latest add "https://21st.dev/r/shadcnspace/sonner-05?api_key=$API_KEY_21ST"`
- Sonner Toast – https://21st.dev/@isaiahbjork/components/primitive-sonner –
  `npx shadcn@latest add "https://21st.dev/r/isaiahbjork/primitive-sonner?api_key=$API_KEY_21ST"`
- Position Sonner – https://21st.dev/@uiable/components/uiable-sonner-position –
  `npx shadcn@latest add "https://21st.dev/r/uiable/uiable-sonner-position?api_key=$API_KEY_21ST"`

Sonner fra shadcn på 21st.dev er den samme som den offisielle i `src/components/ui/sonner.tsx` og er ikke verdt
en kvoteplass.

**Valg:** Sync Status Toast (ShadcnSpace).

**Begrunnelse:** MIT, bygger på sonner som allerede finnes, og oppsettet med bilde, linjer og to handlinger er
mønsteret for «Lagt i handlekurven». Til den er installert, dekker ui/sonner behovet.

**Planlagte endringer:**

- Innhold: produktbilde på `--paper`, navn, variant, og «Vis handlekurv» / «Fortsett å handle». «ACTIVE»-merket
  og repo-innholdet tas ut. Brukes også til feil («Varen er utsolgt») med `--status-feil`.
- Flate `bg-paper`, `border-sand-200`, ingen skygge, hjørner 2 px. Minst 5 s visning, pause ved peker og fokus,
  `aria-live="polite"` (Sonner).
- Utgår hvis «Legg i kurven» uansett åpner skuffen; da holder ui/sonner til feilmeldinger.

**Status:** Valgt – venter på installasjon (kvote)

---

## Installasjonsrekkefølge

To per døgn fra kvoten nullstilles 28.10.2026 kl. 00:00 UTC. De mest synlige seksjonene står først. Feiler en
installasjon, eller er kvoten ikke nullstilt, flyttes resten av køen ett steg; registry-URL-ene hentes aldri
manuelt.

**Døgn 1 – 28.10.2026**

1. Hero og video-hero – Editorial Hero (felipemenezes098)
   `npx shadcn@latest add "https://21st.dev/r/felipemenezes098/hero-05?api_key=$API_KEY_21ST"`
2. Navbar og mega-meny – Rich Navigation Menu (shadcnui-blocks)
   `npx shadcn@latest add "https://21st.dev/r/shadcnui-blocks/navigation-menu-06?api_key=$API_KEY_21ST"`

**Døgn 2 – 29.10.2026**

3. Produktkort – Product Card (deltacomponents)
   `npx shadcn@latest add "https://21st.dev/r/deltacomponents/product-card?api_key=$API_KEY_21ST"`
4. Produktgalleri – Thumbnail image viewer (ibrandify)
   `npx shadcn@latest add "https://21st.dev/r/ibrandify/thumbnail-image-viewer?api_key=$API_KEY_21ST"`

**Døgn 3 – 30.10.2026**

5. Kategori-grid – Shop by Category Grid (ziegfiroyt)
   `npx shadcn@latest add "https://21st.dev/r/ziegfiroyt/ecommerce4?api_key=$API_KEY_21ST"`
6. Footer – Newsletter Footer (meschacirung)
   `npx shadcn@latest add "https://21st.dev/r/meschacirung/footer-4?api_key=$API_KEY_21ST"`

**Døgn 4 – 31.10.2026**

7. Produktkarusell – Gallery 6 (shadcnblockscom) – bare hvis lisensen er avklart
   `npx shadcn@latest add "https://21st.dev/r/shadcnblockscom/gallery6?api_key=$API_KEY_21ST"`
8. Merkekarusell – Marquee (dillionverma)
   `npx shadcn@latest add "https://21st.dev/r/dillionverma/marquee?api_key=$API_KEY_21ST"`

**Døgn 5 – 01.11.2026**

9. Drawer-handlekurv – Sheet with Scrollable Content (shadcnspace)
   `npx shadcn@latest add "https://21st.dev/r/shadcnspace/sheet-02?api_key=$API_KEY_21ST"`
10. Søkedialog – Command (originui)
    `npx shadcn@latest add "https://21st.dev/r/originui/command?api_key=$API_KEY_21ST"`

**Døgn 6 – 02.11.2026**

11. Filtre – Ecommerce Category Page (mohammadshehadeh)
    `npx shadcn@latest add "https://21st.dev/r/mohammadshehadeh/ecommerce-04?api_key=$API_KEY_21ST"`
12. Accordion – FAQ Section (tommyjepsen)
    `npx shadcn@latest add "https://21st.dev/r/tommyjepsen/faq-section?api_key=$API_KEY_21ST"`

**Døgn 7 – 03.11.2026**

13. Timeline – Growth Story Timeline (shadcnspace)
    `npx shadcn@latest add "https://21st.dev/r/shadcnspace/timeline-01?api_key=$API_KEY_21ST"`
14. Nyhetsbrev – Newsletter (kevingirelli)
    `npx shadcn@latest add "https://21st.dev/r/kevingirelli/newsletter?api_key=$API_KEY_21ST"`

**Døgn 8 – 04.11.2026**

15. Kart – MapMarker (mapcn)
    `npx shadcn@latest add "https://21st.dev/r/mapcn/mapcn-map-marker?api_key=$API_KEY_21ST"`
16. Toast – Sync Status Toast (shadcnspace)
    `npx shadcn@latest add "https://21st.dev/r/shadcnspace/sonner-05?api_key=$API_KEY_21ST"`

**Døgn 9 – 05.11.2026**

17. Sitat – Quote Crossfade (ibrandify) – betinget
    `npx shadcn@latest add "https://21st.dev/r/ibrandify/quote-crossfade?api_key=$API_KEY_21ST"`

Til komponentene er installert, dekker de offisielle shadcn-primitivene funksjonen (navigation-menu, sheet,
command, carousel, accordion, tabs, checkbox, slider, select, sonner …), så ingen flyt står og venter på kvoten.

## Ikoner

**lucide-react** er eneste ikonsett (`components.json`: `"iconLibrary": "lucide"`, versjon 1.62 i
`package.json`). Ikonsettene på 21st.dev ble vurdert i konseptfasen og ikke tatt i bruk.

- Komponenter som tar med andre sett, får ikonene byttet til lucide, og pakken fjernes: `@radix-ui/react-icons`
  (Origin UI Command), og blant kandidatene som er valgt bort `@tabler/icons-react`, `@remixicon/react` og
  `react-icons`.
- lucide 1.x har ikke merkeikoner (Instagram, Facebook). Sosiale lenker står som tekst.
- Felles stil: `strokeWidth={1.5}`, 20 px i UI og 24 px i header, farge `currentColor` (plomme eller sandtekst på
  plomme). Dekorative ikoner har `aria-hidden`; knapper med bare ikon har norsk `aria-label` («Søk»,
  «Handlekurv», «Lukk», «Forrige», «Neste», «Pause»).

## Plassholdere

### Video-hero

- **Status:** plassholder. Regina har ikke levert egen film fra butikken.
- **Komponent:** Editorial Hero (felipemenezes098, seksjon 2), der medieflaten tar en `<video>`. Komponenten er
  hentet fra 21st.dev, men **demovideoen og demobildene brukes aldri i produksjon** – de fjernes ved installasjon
  (grep etter `http` i den nye filen).
- **Frem til filmen kommer:** en plassholder i sandtone (`bg-sand-100`) med plakatbilde – Reginas eget bilde av
  butikkfasaden, med kilde i `docs/bildekilder.md` – via `next/image` med `priority`, så plakaten er LCP.
  Plassholderen er merket med `PLASSHOLDER` og en henvisning hit i `src/components/forside/hero.tsx`.
- **Når filmen leveres:** kort sløyfe uten lyd (mp4/H.264 og webm, maks 1080p), lagt i `public/` eller på CDN.
  `<video muted playsInline loop preload="metadata" poster=…>`; avspilling starter bare når heroen er synlig og
  ikke ved `prefers-reduced-motion`. Pauseknapp med lucide `Pause`/`Play` og `aria-label` «Pause filmen» /
  «Spill av filmen» (WCAG 2.2.2). Plakatbildet blir stående som LCP.
- **Hvis filmen har lyd eller tale:** ingen autoavspilling; bruk mønsteret fra Hero Video Dialog (Magic UI, MIT,
  seksjon 2) med kontroller og teksting.
- **Test:** Playwright-testen skal sjekke at ingen demo-URL fra 21st.dev finnes i heroen, og at videoen ikke
  spilles ved redusert bevegelse.
