# Designretning – «Den rosa løperen»

Foran Reginas dør i Haraldsgata ligger en rosa løper med Regina-logoen, flankert av rosa krukker. Den er
utgangspunktet for konseptet: nettbutikken ruller ut den samme løperen. Sand er butikkgulvet; Reginas rosa
er løperen som leder kunden fra inspirasjon til kjøp.

Uttrykket er varmt og redaksjonelt, med tydelig handel: få, store grep – ikke dekor overalt.

## Signaturgrep

| Grep                    | Hvor                                                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Løperen**             | Heroen (teppet i fotoet fortsetter som en rosa stripe ned i kategorilisten), menypunkt, kickers, skuffekanter, valgt variant, bunnteksten |
| **Buen**                | Butikkfasaden i heroen, portrett i «Besøk oss» og hvert produkt i lister – «nisjer» som i et butikkvindu                                  |
| **Reginas egne bilder** | Fasaden, medarbeiderne, salongen med de røde stolene, Tom Ford-hyllen – ikke stockbilder                                                  |

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

- Heroen: buen avdekkes nedenfra, teksten løftes inn linje for linje, løperen rulles ut.
- Seksjoner avdekkes med CSS scroll-drevet animasjon (`animation-timeline: view()`) – ingen JavaScript,
  innholdet er synlig der det ikke støttes.
- «Legg i handlekurven»: bildet flyr til kurven, telleren spretter, skuffen åpner med kvittering.
- Bare transform og opacity. Ved `prefers-reduced-motion` er alt av (testet i `test/e2e`).

## Tilgjengelighet

Semantisk HTML, synlige fokusmarkeringer, «Hopp til innholdet», megameny med tastatur (Enter/Pil ned/Escape),
skuffer på `<dialog>` (fokusfelle, Escape, tilbakeført fokus), variantvalg som radioknapper, aria-live for
kurv og søk, minst 44 px trykkflater, ingen horisontal rulling fra 320 px.

## 21st.dev

21st.dev-MCP-en var ikke tilgjengelig i arbeidsøkten, så ingen komponenter derfra er brukt. Komponentene er
skrevet for konseptet; mønstrene (megameny, skuff, filterskuff, kjøpslinje) følger WAI-ARIA-praksis.
