# Beslutninger

## R-1 Identitet: riktig Regina

Regina Parfymeri = Regina Haraldsgaten AS (org.nr. 980 314 677), Haraldsgata 138, Haugesund, eid av Grethe
Kongshavn. Bekreftet på reginaparfymeri.no og i nettbutikkens salgsbetingelser. (Ikke Parfymeri Regina i
Skåne, Sverige.)

## R-2 Arkitektur: headless foran eksisterende WooCommerce

Repoet var tomt. WooCommerce beholdes som kilde til produkter, pris, lager, rabatter, frakt og betaling;
konseptet er en egen flate (Next.js 16) som leser Store API. Ingen ny handelsplattform.

## R-3 Ekte data som utdrag

Store API er offentlig for lesing, så konseptet bruker ekte data i stedet for demodata. Et utdrag lagres i
repoet (`data/katalog/`) så demonstrasjonen ikke avhenger av nettverk; `KATALOG_KILDE=live` leser direkte.

## R-4 Kassen er av i konseptet

Ingen kall som oppretter handlekurv eller ordre mot produksjon. Overleveringen (delbar kasse-lenke) er bygget
og testet som URL-bygging, men slås først på etter test i staging.

## R-5 Rosa og sand

`#E9168C` (Reginas primærfarge i begge nettstedene) er merkefargen. For knapper med hvit tekst brukes
`#D4127E` (5,0:1), for liten tekst `#B80E6A`. Sand `#F2E9DD` som arbeidsflate; ingen hvite UI-flater.

## R-6 Typografi: Cormorant Garamond + Manrope

Først vurdert Fraunces + Albert Sans. Erstattet etter ønske fra Flyd: Cormorant Garamond 500–600 selektivt i
hero og store redaksjonelle overskrifter, Manrope 400–600 til navigasjon, produktnavn, priser, knapper,
brødtekst og mindre overskrifter. Kursiv bare i hero. Testet med norske tekster på mobil og desktop.

## R-7 Hvite produktbilder i buer

Bildene endres aldri (ingen blandingsmodus eller filter). Bakgrunnsfargen måles og brukes som flate; i lister
står flaten i en bue, som knytter produktene til butikkvinduet i heroen.

## R-8 Doble variasjoner

Der WooCommerce har to variasjoner med samme valg, brukes den første (samme regel som WooCommerce) og resten
meldes som avvik. Alternativet – å vise begge – ville gitt kunden to like valg med ulik pris.

## R-9 Avdekking uten JavaScript

Avdekking av seksjoner er CSS scroll-drevet animasjon. En tidlig JS-løsning (IntersectionObserver) endret
klasser på server-rendret innhold før React var ferdig med hydrering og ble fjernet.

## R-10 Versjon 2: mer bilde, mer bevegelse, samme regler

Første versjon ble vurdert som ikke god nok. Versjon 2 beholder arkitektur, data og tokens, men bygger om
forsiden (kollasj-hero, rosa merkebånd, kategorikort med bilder, mørk nisjeseksjon), gir kategorisidene og
megamenyen bilder og lar headeren gli bort ved rulling. Reglene står: ingen påfunne påstander, bilder
endres ikke, bare transform og opacity, alt av ved redusert bevegelse.

## R-11 21st.dev via nøkkel i miljøet

MCP-en var ikke koblet til økten. Nøkkelen i miljøet ble brukt direkte mot 21st.dev sitt MCP-endepunkt fra
et skript utenfor repoet. Kodene som ble hentet (2 per dag på gratisnivå) er skrevet om til prosjektets
CSS-moduler; det legges ikke til Tailwind eller Motion for to komponenter.

## R-12 Merkebåndet har pauseknapp

Innhold som beveger seg av seg selv i mer enn fem sekunder skal kunne stoppes (WCAG 2.2.2). Pause ved peker
og fokus alene holder ikke på berøringsskjerm, så båndet har en synlig knapp. Ved redusert bevegelse står det
stille og kan rulles.

## R-13 Headeren glir bort ved rulling

Headeren med søk og to menyrader er høy. Den glir bort når man ruller nedover i innholdet og kommer tilbake
straks man ruller opp, åpner en meny eller flytter fokus dit. Flyanimasjonen til kurven hoppes over når
headeren er borte; skuffen åpnes uansett.

## R-14 Utstillingsvinduet skifter selv – med vilkår

Nisjeduftene vises én om gangen. Vinduet skifter etter sju sekunder bare når det er synlig, ingen peker eller
fokus er i det, og brukeren ikke har trykket pause. Ved redusert bevegelse skifter det aldri. Skjermlesere
får nytt innhold opplest bare når vinduet står stille.

## R-15 Bunnteksten avdekkes bare der den får plass

Siden glir opp og bort over bunnteksten på skjermer som er minst 1024 px brede og 832 px høye, der hele
bunnteksten får plass. Ellers står den vanlig nederst, så ingenting blir liggende utenfor skjermen.

## R-16 Spørsmål og svar fra vilkårene

Svarene er satt sammen av `LEVERING`, `RETUR`, `KUN_I_BUTIKKEN`, `NISJE` og `HUDPLEIE` i
`src/innhold/butikk.ts`. Endres vilkårene der, endres svarene – ingen egen tekst om priser eller frister.

---

# Ny nettbutikk etter oppdraget (fra 27.10.2026)

Beslutningene over (R-1 til R-16) gjaldt konseptet. Fra 27.10.2026 er nettbutikken bygget på nytt etter
oppdragsbeskrivelsen (`docs/oppdrag.md`). R-1 til R-4, R-8 og R-12 gjelder fortsatt. R-5, R-6, R-7, R-9 til R-11
og R-13 til R-16 er erstattet av beslutningene under.

## R-17 Bygget på nytt etter oppdraget

Flyd valgte 27.10.2026 å bygge flaten på nytt slik oppdraget beskriver – Tailwind CSS v4, shadcn/ui og
21st.dev-komponenter – i stedet for å bygge videre på konseptets CSS-moduler. Butikkfakta
(`src/content/butikk.ts`), Reginas bilder og de testede reglene for tekst, pris og varianter er tatt med.

## R-18 Oppdragets profil fullt ut

Flyd valgte oppdragets profil: Playfair Display (overskrifter) og Poppins (brødtekst/UI), fargetokens fra
oppdraget §4 og produktbilder på `--paper` med `mix-blend-mode: multiply`. Erstatter R-5, R-6 og R-7.
Konsekvenser: `--sand-ink` og `--regina-pink-strong` holder ikke 4,5:1 på `--sand-100`; der brukes
`--sand-ink-deep` (lagt til) og plum. Ren rosa brukes bare til stor tekst og dekor (`tokens.test.ts`).

## R-19 Samme adresser som i dag

`/produkt/<slug>/`, `/produktkategori/<sti>/` og `/brand/<slug>/` beholdes, med skråstrek til slutt som i
WordPress. Alle 1 082 produktadresser er like. Merker der slugen er endret, og WooCommerce-sider som kassen,
får 301 (`src/lib/seo/omdirigeringer.ts`, `docs/redirects.csv`). Merkene får slugen fra dagens merkeregister
(Perfect WooCommerce Brands), så `/brand/memo/` fortsatt virker selv om merket heter «Memo Paris».

## R-20 Data fra oppdragets products.json, beriket fra samme Store API

`data/products.json` fra oppdraget er brukt og hentet på nytt (bare GET). `build_catalog.py` er utvidet med pris
og lager per variant, publiseringsdato, popularitet, merkeregisteret og Reginas egne sider. Merket kommer fra
feltet `brand` (normalisert), ikke fra prefikset i navnet. Begge kildene (json og Store API) gir samme pris,
lager og varianter for alle produkter – det er testet.

## R-21 «Nyhet» og «Bestselgere» bare fra WooCommerce

«Nyhet» = publisert i WooCommerce de siste 45 dagene (`NYHET_DAGER`). «Bestselgere» = WooCommerces egen
popularitet (total_sales), vist per kategori (nisjeduft, ansiktspleie, makeup). Ingen merker settes for hånd.

## R-22 Kurven: kopi gjennom WooCommerces kurv-API, ikke adopsjon av økten

Etter spiken (`docs/architecture.md` §4): Next.js holder Store API-kurven med Cart-Token i en httpOnly-cookie.
«Gå til kassen» er et POST-skjema som sender kunden til mu-pluginen, som legger varene i kundens egen
WooCommerce-økt med `add_to_cart` og sender videre til kassen. WooCommerces innebygde `?session=` er vurdert og
forkastet (tokenet blir stående i adressen, gamle kurver gjenbrukes, Vipps-kroker kjøres ikke).

## R-23 Prototypen har en lokal kurv

Uten staging er det ingen WooCommerce-kurv å skrive til, og produksjonen skal ikke få kurver. Prototypen har
derfor en lokal kurv (ID-er og antall i en cookie, kontrollert mot katalogen ved hver lesing). Kurv mot
produksjonsverten er stengt i koden til `TILLAT_KURV_PRODUKSJON=ja`.

## R-24 Virker uten JavaScript der det teller

Filtre er lenker, sortering et skjema, «Legg i handlekurven» et skjema som poster til `/api/kurv/`, produktrader
bruker scroll-snap, og beskrivelser bruker `<details>`. Søk og handlekurvskuff lastes først når de åpnes.

## R-25 21st.dev: valgt, men ikke installert

21st.dev krever innlogging for registeret, og gratisnivået gir 2 komponenter per døgn. Kvoten var brukt.
Komponentene er valgt og logget i `docs/components.md`; flaten er bygget med shadcn/ui i mellomtiden.
Merkebåndet bruker merkenavn i Playfair, fordi vi ikke har merkenes logoer med bruksrett.

## R-26 Guerlain bestemmes ikke av oss

«GUERLAIN – Mon Guerlain Xmas» vises og kan kjøpes som i dag, selv om Guerlain står på listen over merker som
ikke kan selges på nett. Det er Reginas beslutning (`AVKLARES` i `src/content/butikk.ts`, `docs/data-issues.md`).

## R-27 Stengt for søkemotorer til lansering

`robots.txt` og `noindex` til `INDEKSERING=pa`, så staging og forhåndsvisninger ikke konkurrerer med dagens
butikk.

## R-28 Kart først ved klikk

Kontaktsiden viser adresse og lenke til Google Maps. Kartet (OpenStreetMap) lastes først når kunden ber om det,
så ingen tredjepart får IP-adressen uten et valg. Koordinatene er fra OpenStreetMap Nominatim.
