# Designretning – «Den rosa løperen»

Foran Reginas dør i Haraldsgata ligger en rosa løper med Regina-logoen, flankert av rosa krukker. Den er
utgangspunktet for konseptet: nettbutikken ruller ut den samme løperen. Sand er butikkgulvet; Reginas rosa
er løperen som leder kunden fra inspirasjon til kjøp.

Uttrykket er varmt og redaksjonelt, med tydelig handel: få, store grep – ikke dekor overalt.

## Signaturgrep

| Grep                    | Hvor                                                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Løperen**             | Det rosa merkebåndet rett under heroen (teppet fra butikkdøren lagt på tvers), menypunkt, kickers, skuffekanter, valgt variant, bunnteksten  |
| **Buen**                | Butikkfasaden i heroen, megamenyens bilde, «Bare i butikken», personlig veiledning og hvert produkt i lister – «nisjer» som i et butikkvindu |
| **Frilagte flasker**    | Produkter med gjennomsiktig bakgrunn står fritt foran butikkdøren og på fargede kategorikort – bildene er uendret                            |
| **Reginas egne bilder** | Fasaden, disken, salongen, behandlingsrommet, Tom Ford-hyllen, interiøret, Haugescent-duftpinnene – ikke stockbilder                         |

## Forsiden (versjon 2)

| Seksjon                   | Flate       | Innhold                                                                                                  |
| ------------------------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| Hero                      | Sand        | Kollasj: fasaden i bue, et lite bilde fra disken og en frilagt flaske med navn og pris (lenke til varen) |
| Merkebåndet               | Rosa        | Merkene glir rolig forbi; stopper ved peker, fokus, pauseknapp og redusert bevegelse                     |
| Hva leter du etter?       | Sand        | Kategorikort i rutenett: butikkbilder og frilagte produkter på plomme, rosa og sand                      |
| Nisjeduft                 | Mørk plomme | Utstillingsvindu: én duft om gangen med tekst fra produktet, duftnoter, pris og stort bilde i bue        |
| Femte generasjon          | Sand        | Historien og personlig veiledning                                                                        |
| Finn duften etter noten   | Sand-dyp    | Faner med duftnoter fra produktbeskrivelsene                                                             |
| Merker og Bare i butikken | Sand        | Merkene i kolonner med antall; Tom Ford-hyllen og øyenskyggen lagt over hverandre                        |
| Hudpleieavdelingen        | Rosa        | Behandlingsrommet og timebestilling                                                                      |
| Spørsmål og svar          | Sand        | Levering, henting, retur, merker i butikken, veiledning og time – bare fra Reginas egne vilkår           |
| Velkommen inn             | Sand-dyp    | Butikkbildene i bue, sirkel og pille som beveger seg i ulik fart ved rulling, med adresse og kontakt     |
| Bunnteksten               | Plomme      | Avdekkes under siden på store skjermer, med adressen satt stort i Cormorant                              |

Kategorisidene viser samme bilde som kategorikortet på forsiden ved siden av tittelen, og produktsidene for
duft avslutter med personlig veiledning i butikken. Headeren glir bort når man ruller nedover og kommer
tilbake straks man ruller opp eller flytter fokus dit.

## Farger

Reginas rosa er hentet fra eksisterende profil: `--wd-primary-color: rgb(233,22,140)` i både
reginaparfymeri.no og nettbutikken (WoodMart), brukt 118 ganger i hovedsidens CSS. Logoen er tegnet i
`#EF3AA7`; teppet foran butikken måler ca. `#E038A0`. Plomme `#3F132E` er nettbutikkens egen sekundærfarge.

| Token            | Verdi     | Bruk                                                      | Kontrast                   |
| ---------------- | --------- | --------------------------------------------------------- | -------------------------- |
| `--rosa`         | `#E9168C` | Reginas rosa: løperen, store titler, fremhevet ord, dekor | 3,5:1 på sand (stor tekst) |
| `--rosa-knapp`   | `#D4127E` | Primærknapper med hvit tekst                              | 5,0:1                      |
| `--rosa-tekst`   | `#B80E6A` | Liten rosa tekst og lenker                                | 5,3:1 på sand              |
| `--rosa-lys`     | `#F6DCE6` | Tonede flater: aktive filtre, tilbud, hudpleieblokken     | –                          |
| `--plomme`       | `#3F132E` | Mørke seksjoner (duftnoter, bunntekst)                    | 13:1 med sand-tekst        |
| `--sand`         | `#F2E9DD` | Arbeidsflaten – aldri rent hvitt                          | –                          |
| `--sand-lys`     | `#F8F2EA` | Hevede flater: menyer, skuffer, kort                      | –                          |
| `--sand-dyp`     | `#E9DDCC` | Vekslende seksjoner                                       | –                          |
| `--blekk`        | `#2B1A21` | Tekst                                                     | 13,7:1 på sand             |
| `--blekk-dempet` | `#6A5560` | Sekundær tekst                                            | 5,7:1 på sand              |

Alle par er kontrollert i `src/styles/tokens.test.ts` (WCAG 2.2: 4,5:1 for tekst, 3:1 for store titler og kanter).

## Typografi

- **Cormorant Garamond 500–600** – bare i hero og store, redaksjonelle overskrifter (seksjonstitler,
  kategoriindeksen, merkeveggen, årstall). Romslige størrelser fordi skriften har lav x-høyde:
  hero 52–116 px, seksjon 40–76 px. 600 i mellomstørrelsen så den ikke blir spinkel. Kursiv bare i de to
  hero-overskriftene.
- **Manrope 400–600** – navigasjon, produktnavn (også på produktsiden), priser, knapper, brødtekst og
  mindre overskrifter. Brødtekst 17 px / 1,6.
- Testet med ekte norske tekster med æ, ø og å på 390 og 1440 px før valget ble låst. Begge selvhostet.

## Produktbilder

70 % av Reginas produktbilder er pakkebilder på hvit bakgrunn. De endres aldri med filter. I stedet måles
bakgrunnen i hvert bilde ved henting (`scripts/bildeanalyse.ts`): hvite og lysegrå bilder står på en flate i
nøyaktig samme farge, gjennomsiktige på sand, fotografier fyller flaten. I lister står flaten i en bue – en
nisje per produkt – så de hvite flatene blir et bevisst grep og ikke hvite kort.

## Bevegelse

| Token           | Verdi                               | Bruk                            |
| --------------- | ----------------------------------- | ------------------------------- |
| `--tid-kort`    | 160 ms                              | hover, farger                   |
| `--tid-middels` | 280 ms                              | menyer, skuffer lukker          |
| `--tid-lang`    | 520 ms                              | skuffer åpner, bekreftelser     |
| `--tid-inngang` | 1100 ms                             | heroens inngang                 |
| `--ease-ut`     | `cubic-bezier(0.22, 0.7, 0.18, 1)`  | standard – rolig landing        |
| `--ease-fjaer`  | `cubic-bezier(0.34, 1.45, 0.64, 1)` | små bekreftelser (hake, antall) |

- Heroen: overskriften glir opp bak en maske linje for linje, buen og bildet zoomer rolig inn, flasken
  løftes inn og svever svakt. Når siden rulles, beveger flasken og det lille bildet seg i ulik fart
  (CSS scroll-tidslinje, ingen JavaScript).
- Merkebåndet: farten bygges opp og ned mykt (overført fra 21st.dev), bare transform på sporet, og det står
  stille utenfor skjermen.
- Kategorikort og megamenybilder: bildet zoomer svakt og flaskene løftes ved peker.
- Seksjoner avdekkes med CSS scroll-drevet animasjon (`animation-timeline: view()`) – ingen JavaScript,
  innholdet er synlig der det ikke støttes.
- «Legg i handlekurven»: bildet flyr til kurven, telleren spretter, skuffen åpner med kvittering.
- Bare transform og opacity. Ved `prefers-reduced-motion` er alt av (testet i `test/e2e`).

## Tilgjengelighet

Semantisk HTML, synlige fokusmarkeringer, «Hopp til innholdet», megameny med tastatur (Enter/Pil ned/Escape),
skuffer på `<dialog>` (fokusfelle, Escape, tilbakeført fokus), variantvalg som radioknapper, aria-live for
kurv og søk, minst 44 px trykkflater, ingen horisontal rulling fra 320 px.

## 21st.dev

21st.dev-MCP-en er ikke koblet til økten som verktøy, men nøkkelen ligger i miljøet (`API_KEY_21ST`). Den ble
brukt direkte mot 21st.dev sitt MCP-endepunkt (`https://21st.dev/api/mcp`, JSON-RPC med nøkkelen i
`x-api-key`) fra et lite skript utenfor repoet. Nøkkelen er aldri skrevet til kode, logg eller git.
Kontoen er på gratisnivå: søk og forhåndsvisninger er gratis, to kodehentinger per dag, ingen AI-generering.

| Ressurs (21st.dev)                                                    | Brukt slik                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Logo Marquee** (ddoemonn, id 23537) – kode hentet                   | Bevegelsen i `Merkebaand.tsx`: myk oppbygging/nedbremsing, kopier etter bredde, pause ved peker/fokus/utenfor skjerm, kopier skjult for skjermlesere. Skrevet om uten Tailwind og Motion; pauseknapp lagt til (WCAG 2.2.2).                                             |
| **Editorial Collage Hero** (felipemenezes098, id 19074) – kode hentet | Oppsettet i heroen: serif-overskrift ved en lagdelt kollasj, trinnvis inngang. Skrevet om i CSS-moduler; blur-effekten er tatt ut (bare transform og opacity).                                                                                                          |
| **Elegant Carousel** (dev.yadhakim, id 10025) – kode hentet           | `Utstilling.tsx`: tekst ved siden av stort bilde, kryssfade, svak zoom, fremdriftslinjer med navn, sveip. Skrevet om: fremdriften er en CSS-animasjon som driver skiftet, stopper ved peker, fokus, pause og utenfor skjermen, og skifter aldri ved redusert bevegelse. |
| **Shop by Category Grid** (ziegfiroyt) – forhåndsvisning              | Mønster for kategorikortene: bildekort med antall og zoom ved peker.                                                                                                                                                                                                    |
| **Shop Navigation Menu** (bundui) – forhåndsvisning                   | Mønster for bilde i megamenyen.                                                                                                                                                                                                                                         |
| **Zoom Parallax** (efferd) – forhåndsvisning                          | Mønster for «Velkommen inn»: bilder i ulik fart. Laget med CSS scroll-tidslinje, uten å låse rullingen.                                                                                                                                                                 |
| **Sticky Footer** og **Large Name Footer** – forhåndsvisning          | Bunnteksten som avdekkes under siden, og stort ordbilde. Ordbildet er adressen i Cormorant – logoen tegnes aldri på nytt.                                                                                                                                               |
| **YukoHealth storefront** (mal, larsen66) – live-demo studert         | Bilder i blandede former (sirkel, bue, pille) og spørsmål og svar før bunnteksten.                                                                                                                                                                                      |

Gjennomgått, men ikke brukt: **temaene** (f.eks. Elegant Luxury, Zen Linen, Vintage Paper) ville byttet ut Reginas
rosa og sand; **ikonsettene** (Phosphor, Lucide, Tabler, Hugeicons m.fl.) gir lite over de egne linjeikonene;
shader-bakgrunner, egne pekere og tekst med uskarphet bryter regelen om bare transform og opacity.
Gjennomgangen ble gjort i nettleseren i arbeidsmiljøet (21st.dev med Chromium) og via MCP-endepunktet.

Resten av komponentene er skrevet for konseptet; mønstrene (megameny, skuff, filterskuff, kjøpslinje) følger
WAI-ARIA-praksis.
