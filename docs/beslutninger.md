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
