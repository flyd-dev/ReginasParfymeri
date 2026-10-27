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
