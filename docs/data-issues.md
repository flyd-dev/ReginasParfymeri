# Datahull og avvik – til Regina

Laget 27.10.2026 av `scripts/lag_rapporter.py` fra katalogen hentet 2026-10-27 fra https://nettbutikk.reginaparfymeri.no (Store API, bare lesing). Tallene oppdateres når skriptet kjøres på nytt.

Den nye nettbutikken viser dataene slik de står i WooCommerce og finner ikke på tekst. Punktene under bør rettes i WooCommerce (eller avklares) før lansering. **Merket «Avklares»** betyr at vi trenger et svar fra Regina eller Marius.

## Oversikt

| Funn | Antall | Hva nettbutikken gjør nå |
| --- | ---: | --- |
| Produkter uten beskrivelse | 116 | Viser merke, kategori og «Spør oss i butikken om dette produktet» |
| Utsolgte produkter | 124 | Viser «Utsolgt» og «Gi meg beskjed når den er tilbake» – skjules ikke |
| Produkter uten gjenkjent merke | 4 | Vises uten merke |
| Produkter der merket bare finnes i navnet (ikke i merke-registeret) | 116 | Merket er lest ut av navnet |
| Doble variasjoner (samme valg to ganger) | 5 | Den første brukes, som i WooCommerce |
| Variabelt produkt der lagerstatus på produktet og variantene er uenige | 1 | Variantene avgjør |
| Produkter på tilbud | 5 | Viser før- og etterpris |
| Produkter med samme bilde flere ganger i galleriet | 13 | Bildet vises flere ganger |
| Produkt fra merke som ikke skal selges på nett | 1 | **Avklares** – vises som i dag (kjøpbart) |

## Avklares med Regina / Marius

- **GUERLAIN – Mon Guerlain Xmas** ligger i nettbutikken i dag (https://nettbutikk.reginaparfymeri.no/produkt/guerlain-mon-guerlain-xmas/), men Guerlain står på listen over merker som ikke kan selges på nett. Vi har ikke endret noe: produktet vises og kan kjøpes som i dag til dere bestemmer. Én linje i `src/content/butikk.ts` (`AVKLARES`) styrer dette.
- **Åpningstider** er ikke bekreftet (Instagram oppgir «10-18 (10-16)»). De legges inn under Innstillinger → Regina butikkinfo i WordPress og vises først når «Bekreftet av butikken» er krysset av.
- **Fraktpriser:** nettbutikken viser bare det som står på dagens side «Frakt & Levering». Prisene settes av WooCommerce i kassen.
- **Kundeklubben (Diller):** fordelene er ikke oppgitt, og vises derfor ikke. Send oss teksten, eller innmeldingslenken fra Diller (`NEXT_PUBLIC_DILLER_INNMELDING_URL`).
- **Diller i Vipps Checkout:** Diller-pluginen (2.5.9) viser innmeldingen i den vanlige kassen og i Vipps Express, men trolig ikke i Vipps Checkout (se `docs/architecture.md`, R1). Dette må avklares med Diller før spiken kan godkjennes.
- **Vipps-plugin:** dagens butikk ser ut til å bruke Amendos Vipps-plugin (`amendo-vipps/v2`), ikke «Pay with Vipps and MobilePay for WooCommerce» som oppdraget beskriver.
- **Merkeregister:** dagens butikk bruker Perfect WooCommerce Brands. Importen legger merkene i WooCommerce Brands (innebygd fra WooCommerce 9.6). Gamle `/brand/`-adresser beholdes eller sendes videre (se `docs/redirects.csv`).
- **Personvernerklæringen** på reginaparfymeri.no er fra 07.12.2020 og nevner Google Analytics. Den må oppdateres for ny nettbutikk (Vipps, Diller, WooCommerce, ev. analyse). Nettbutikken viser den slik den står, med en ny oversikt over informasjonskapslene.
- **Bilder og logo:** butikkbildene fra reginaparfymeri.no har ukjent fotograf – bruksretten må bekreftes (`docs/bildekilder.md`). PNG-logoen fra nettbutikken har hvit bakgrunn; vi bruker vektorlogoen fra reginaparfymeri.no. Vi trenger gjerne logoen med «PARFYMERI» i vektor med gjennomsiktig bakgrunn.
- **Merker lest ut av navnet** (116 produkter uten merke i merkeregisteret) bør sjekkes, f.eks. «FIORENTINO – Lavendel og Sitron» → Florentino og «AQUA» → Gian Marco Venturi.
- **Sandfargene** (`--sand-50` m.fl.) er et forslag og må godkjennes.
- **Film til forsiden:** heroen viser et plakatbilde til dere leverer egen film fra butikken.

## Merkenavn som er rettet

Merkene står ulikt i produktnavnene. Nettbutikken bruker et felles merkenavn (`scripts/build_catalog.py`). Det bør rettes i WooCommerce også:

| Står i produktnavnet | Vises som | Produkter |
| --- | --- | ---: |
| ANASTASIA | Anastasia Beverly Hills | 4 |
| BETE ELITE | Beter Elite | 1 |
| BJÔRN AXEN | Björn Axén | 2 |
| BJÔRN AXEN-  Cool Silver | Björn Axén | 2 |
| BJÔRN AXEN-  Volume Mousse | Björn Axén | 1 |
| BJÔRN AXÈN | Björn Axén | 4 |
| BJÖRN AXÈN | Björn Axén | 3 |
| DRESDNER | Dresdner Essenz | 14 |
| Dresdner | Dresdner Essenz | 1 |
| ELISABETH ARDEN | Elizabeth Arden | 1 |
| ENGELRUFER | Engelsrufer | 1 |
| FIORENTINO | Florentino | 1 |
| FUGUAZZI | Fugazzi | 2 |
| AQUA | Gian Marco Venturi | 1 |
| GrandeLash-MD | Grande Cosmetics | 1 |
| HELENE FISHER | Helene Fischer | 1 |
| AQU IDC | IDC Institute | 1 |
| IDC | IDC Institute | 1 |
| LÖVENGRIP | Löwengrip | 8 |
| LÖVENGRIP The Cure | Löwengrip | 1 |
| MEMO | Memo Paris | 15 |
| Optima Nature | Optima Natura | 1 |
| PARFUMES DE MARLEY | Parfums de Marly | 1 |
| YARDELY | Yardley London | 2 |
| YARDLEY | Yardley London | 3 |
| ZEW | Zew for men | 1 |

Merkeregisteret (Perfect WooCommerce Brands) og navnet er uenige om skrivemåten:

| Merkeregisteret | Vises som | Produkter |
| --- | --- | ---: |
| BELL COSMETICS | Bell | 1 |
| BJÖRN AXÈN | Björn Axén | 13 |
| DRESDNER | Dresdner Essenz | 17 |
| JOBSKI COSMETIC | Jobski | 7 |
| MAGINISTA | Magnista | 2 |
| MEMO | Memo Paris | 19 |
| MOLECULES | Escentric Molecules | 15 |

## Produkter uten gjenkjent merke

- NISSE HÅNDSÅPE 300 ML – https://nettbutikk.reginaparfymeri.no/produkt/nisse-handsape-300-ml/
- Bambus Q-tips – 300 stk – https://nettbutikk.reginaparfymeri.no/produkt/bambus-q-tips-300-stk/
- Exclamation 50ml – https://nettbutikk.reginaparfymeri.no/produkt/exclamation/
- PL3 Lebepomade – https://nettbutikk.reginaparfymeri.no/produkt/pl3-lebepomade/

## Doble variasjoner

- CREED – Centaurus EdP: variasjon 3863 har samme valg som 3862 (100ml). Den doble bør slettes.
- CREED – Centaurus EdP: variasjon 3865 har samme valg som 3864 (50ml). Den doble bør slettes.
- HANNE BANG – BRYNSFARGE: variasjon 7257 har samme valg som 7255 (Sort). Den doble bør slettes.
- HANNE BANG – BRYNSFARGE: variasjon 7261 har samme valg som 7260 (Askebrun). Den doble bør slettes.
- HANNE BANG – BRYNSFARGE: variasjon 7265 har samme valg som 7263 (BRUNSVART). Den doble bør slettes.

## Lagerstatus som ikke stemmer

- MARTINELIA – LITTLE DINOSAUR – Badebombe: produktet står som utsolgt, men 2 av 2 varianter er på lager.

## På tilbud

Tilbudene har ingen sluttdato i dataene. Sjekk at de fortsatt skal gjelde.

| Produkt | Før | Nå |
| --- | ---: | ---: |
| Maginista Thickening Lotion 100ml | kr 840 | kr 280 |
| Maginista Dry Shampoo Blond 200 ml | kr 685 | kr 280 |
| HELENE FISCHER – Honest EDP 50ml | kr 499 | kr 349 |
| MEDICUBE – Kojic Acid Tumeric Night Wrapping Mask 75ml | kr 399 | kr 299 |
| MEDICUBE – Collagen Night Wrapping Mask 75ml | kr 399 | kr 299 |

## Produkter uten beskrivelse (116)

- NISSE HÅNDSÅPE 300 ML
- ANASTASIA – Øyenbryns former 5 stk
- BATISTE – Dry Shampoo Mini
- BETER ELITE – VIPPEBØYER
- DRESDNER Dusjgel stress anti 295ml
- DRESDNER – BADESALT KIDS
- DRESDNER – Body Wash Muscle Terapy 295ml
- DRESDNER – Detox – Engangspakke
- ERASMIC – Shave Cream 100 ml
- ESCENTRIC MOLECULES 03 – 100ml
- FUGAZZI – Borntostandout Extrait de Parfum 50 ml
- FUGAZZI – Vanilla Haze extrait de parfum 50ml
- Gian Marco Venturi – Nightfall Shampoo
- GrandeBROW 2-In-1 Tinted Brow Gel + Brow Enhancing Serum
- Hermines Story – Isabelle – Horsebit Øredobber – Sølv
- IDC INSTITUTE – Badebombe
- JJDK -Papiljotter Grønn 20cm 6 stk
- JJDK -Papiljotter Lilla 25cm 6 stk
- JJDK Essaouira 61831
- JJDK – Anna Marie – Svart stor toalettveske
- JJDK – Håruller 8 stk – Gul 40 mm
- JJDK – LED LIGHT SPEIL – EXTRA SPEIL X10
- JJDK – Lomme Speil X1 / X5
- JJDK – Lotion – Stor toalettveske
- JJDK – Orchid – Stor toalettveske
- JJDK – PREMIUM WOMEN Beige stor toalettveske
- JJDK – Pariset – Lilla liten toalettveske
- JJDK – Speil x1
- JJDK – Toalettveske medium rosa beige
- LOVE – Bomullspads 40 store
- LÖWENGRIP – Bounce Back – Shine & Texture Spray
- LÖWENGRIP – Style To Define – Cream Mousse
- MAVALA MINI COLOR 1 ANKARA
- MAVALA MINI COLOR 14 ST-TROPEZ
- MAVALA MINI COLOR 16 BAGHDAD
- MAVALA MINI COLOR 190 HONOLULU
- MAVALA MINI COLOR 2 MADRID
- MAVALA MINI COLOR 20 CAIRO
- MAVALA MINI COLOR 288 GINZA
- MAVALA MINI COLOR 303 BALI
- MAVALA MINI COLOR 46 CADIZ
- MAVALA MINI COLOR 52 TOULOUSE
- MAVALA MINI COLOR 65 ADELAIDE
- MAVALA MINI COLOR 7 MACAO
- MAVALA MINI COLOR 71 LA PAZ
- MAVALA MINI COLOR 74 LOS ANGELES
- MAVALA MINI COLOR 75 MIAMI
- MAVALA MINI COLOR 9 LISBOA
- MAVALA – 215 Pink Diamond
- MAVALA – 324 Iceberg
- MAVALA – 431 The Power Of Pink 5ml
- MAVALA – 448 Jerash
- MAVALA – 450 The Power Of Pink 5ml
- MAVALA – 469 Luxor
- MAVALA – 470 Perugia
- MAVALA – 471 Tbilisi
- MAVALA – 474 Fez
- MAVALA – 475 Ottawa
- MAVALA – 476 Marbella
- MAVALA – 477 Panama
- MAVALA – 478 Safi
- MAVALA – 479 Dj;Bouti
- MAVALA – 487 Icy Dusk
- MAVALA – 488 Soft Gold
- MAVALA – 489 Silver Dream
- MAVALA – 492 Blue Frost
- MAVALA – 945 Red Fizz
- MAVALA – 968 Pretty Ebony
- MAVALA – 970 Pretty Gold
- MAVALA – Eye Shadow Pen – Prune Flambée
- MAVALA – MINI COLOR 55 DAKAR
- MAVALA – Mini Color – 381 Rouge Forever
- MARTINELIA – MAGIC – UNICORN HÅRBØRSTE
- MARTINELIA – Magic Makeup Ball
- MEMO – INDIAN LEATHER 75ML
- Optima Natura –  Mist with NatEssoil – N-Active OilSleep, 50ml
- Optima Natura – Badesalt med eukalyptusolje og rosmarinolje, 1 kg.
- Optima Natura – Badesalt med lavendelolje 1 kg
- Optima Natura – Oil for aroma: N-Active Oil Concentration, 20ml
- ORMONDE JAYNE – VETIVERIA 88 ML
- PARFUMS DE MARLY –  OAJAN EDP SPRAY 125ml
- PARFUMS DE MARLY – SEDLEY EDP SPRAY
- SONIC – EL Tannbørste
- TITANIA –  My style – Hårklype
- TITANIA –  Sommerfugl strikk 5stk
- TITANIA – Banan klemme med perler
- TITANIA – Fliseklemme brun/gull 5 cm, 30 pce
- TITANIA – Hårbørste Bjørn
- TITANIA – Hårbørste double brishle 7 rad
- TITANIA – Hårbøyle Glitter
- TITANIA – Hårklemme svart+diamanter
- TITANIA – Hårklemme – Fliseklemmer black 5 cm, 30 pce
- TITANIA – Hårrull 13mm
- TITANIA – Hårrull 19 mm
- TITANIA – Hårrull 32mm
- TITANIA – Hårstrikk 4st
- TITANIA – Hårstrikk – Str. S spiralstrikk, brun (3 stk)
- TITANIA – Manikyr sett
- TITANIA – My Style 6 strikk tykk
- TITANIA – My Style Clip Gull loop
- TITANIA – My Style Hair set in box – small
- TITANIA – My Style – Hårbøyle – Rosa stoff
- TITANIA – My Style – Hårbøyle – Svart Stoff
- TITANIA – My Style – Hårpinne for oppsats
- TITANIA – My style Hårstrikk svart 9st 4mm
- TITANIA – My style hårstrikk frotte svart
- TITANIA – My style – Hårbøyle Caramel
- TITANIA – My style – Hårklype krokodille liten 6 st brun
- TITANIA – Nese saks
- TITANIA – Pannebånd 2st i svart farge
- TITANIA – Peeling Belte
- TITANIA – Scrunki
- TITANIA – Sminkesvamp for ansikt – rund, rosa/hvit
- TITANIA – Speil Hånd Hvit x2/x5
- TITANIA – Tå – skiller
- VADECO – Speil Sugekopp x10 16,7 cm

## Utsolgte produkter (124)

De vises med «Utsolgt» og «Gi meg beskjed når den er tilbake». Vurder om noen skal avsluttes.

- Exclamation 50ml
- AHAVA Uplift Day Cream SPF20 50 ml
- ANASTASIA BEVERLY HILLS – Eye primer
- ANASTASIA BEVERLY HILLS – Lash Brag Volumizing Mini Mascara
- ANASTASIA BEVERLY HILLS – Lash Sculpt Mascara
- ANASTASIA BEVERLY HILLS – Microstroke Brow Pen – Dark Brown
- BDK PARFUMS – 312 SAINT-HONORÈ 100ML
- BDK PARFUMS – PAS CE SOIR 100 ML
- BETER ELITE – 47 Powder Kabuki børste
- BETER ELITE – Komplett makeupbørstesett
- BJÖRN AXÈN – Fixing Hairspray 80 ml
- BONDI SANDS – Reusable Self Tan Exfoliating Glove
- BRYLCREEM – WAX 75ml
- CREED – After shave aventus 75ml
- DRESDNER Dusjgel stress anti 295ml
- DRESDNER ESSENZ – Badesalt kit 5 pk
- DRESDNER – Body Wash Muscle Terapy 295ml
- DRESDNER – Deep Relaxation Bubble Bath 500ml
- DRESDNER – Muscle Therapy Bubble Bath 500ml
- ELIZABETH ARDEN – Green Tea Deodorant
- EQUATE – Dusjhette m/turban
- ERASMIC – Shave Cream 100 ml
- ESCENTRIC MOLECULES 01 + MANDARIN – 100ml
- Esponjabon – Mother of Pearl
- Esponjabon – Salicylic Acid
- ESSENTIAL PARFUMS – Rose Magnetic 100ml
- FLORENTINO – HÅNDSÅPE APPELSIN OG KANEL 100 G
- FREE VOLA – Pina Colada Dream
- FUGAZZI – Angel Dust Dry Shampoo 100 ml
- GRANDEPout | Plumping Lip Mask
- GUINOT – HYDRA FRAICHEUR Cleansing Gel
- HANNE BANG – Hårfjerningskrem Til Ansikt
- HAUGESCENT – REED DIFFUSER – PIQUANT PEACH
- Hermines Story  Scarf No. 03 – Forest 53×53
- Hermines Story  Scarf No. 06 – Heritage 65×65
- Hermines Story  Scarf No. 08 – Midnight 53×53
- Hermines Story – Classic Small 85cm – Skinnbelte – Hazelnut – Light Brown – Medium
- Hermines Story – Classic Small 95cm – Skinnbelte – Hazelnut – Light Brown – Large
- AQU IDC – AUTOMATISER PARFYME
- IDA WARG – Beauty Repair & Shine Hair Oil 50ml
- IDA WARG – Feeling Clean Shower Mousse 200 ml
- IDA WARG – Intense Moisture Hair Mask 300ml
- IDA WARG – Radiant Shower Mousse 200 ml
- IDA WARG – Sunny Infusion Shower Mousse 200ml
- IDA WARG – Vanilla Fudge Shower Mousse 200 ml
- INITIO – Hair Mist Oud For Greatness 50ml
- INITIO – Oud For Happiness Edp 90ml
- INITIO – Psychedelic Love EdP 90ml
- JJDK GALERIE – Svart medium toalettveske
- JJDK – Anna Marie 61448
- JJDK – Galerie – Rosa liten toalettveske
- JJDK – LED LIGHT SPEIL – EXTRA SPEIL X10
- JJDK – Lomme Speil X1 / X5
- JJDK – Premium Woman – Liten toalettveske
- JJDK – Premium Woman – Stor toalettveske
- Kent – Luxury Shaving Soap Refill
- LÖWENGRIP – All Time High – Dry Volume Spray
- MAVALA MINI COLOR 1 ANKARA
- MAVALA – 478 Safi
- MAVALA – 479 Dj;Bouti
- MAVALA – 488 Soft Gold
- MAVALA – 945 Red Fizz
- MAVALA – 970 Pretty Gold
- MAVALA – Eye Shadow Pen – Vert d’Eau
- Maginista Thickening Lotion 100ml
- MARTINELIA – LITTLE DINOSAUR – Badebombe
- MEMO African leather 75ml
- MEMO Flåm 75ml
- MEMO Ocean leather 75ml
- MEMO – FRENCH LEATHER 75ML
- MEMO – MADURAI  75 ML
- MEMO – MOON FEVER 75 ML
- MEMO – ORIENTAL LEATHER 75ML
- MEMO – WINTER PALACE 75ML
- MITCHUM – Unscented 100ml
- MONTBLANC EXPLORER PLATINUM DEO STICK 75 GR
- MONTBLANC – Explorer Extreme 60 ml
- MONTBLANC – LEGEND RED DEO STICK 75 GR
- MONTBLANC – Legend Edp
- MONTBLANC – Legend deodorant stik 75 g
- MONTBLANC – SIGNATURE ABSOLUE EDP
- Optima Natura – Aromatisk olje – Lavender Oil
- Optima Natura – Badesalt med eukalyptusolje og rosmarinolje, 1 kg.
- Optima Natura – Oil for aroma: N-Active Oil Calmness,20ml
- ORMONDE JAYNE – Levant EdP 88ml
- PARFUMES DE MARLEY – DELINA SHOWER GEL 200ml
- PARFUMS DE MARLY –  LAYTON SHOWERGEL 200ml
- PARFUMS DE MARLY –  OAJAN EDP SPRAY 125ml
- PARFUMS DE MARLY – Althair Exclusif 125ml
- PARFUMS DE MARLY – DELINA BODY CREAM 200ml
- PARFUMS DE MARLY – DELINA BODY OIL 100 ML
- PARFUMS DE MARLY – MELIORA EDP SPRAY 75ML
- PARFUMS DE MARLY – PERCIVAL SHOWERGEL 200 ML
- Rudolph Care – A Hint of Summer – The Lotion
- Rudolph Care – Açai Body Lotion
- Rudolph Care – Açai Eye Cream
- Rudolph Care – Gentle Cleansing Foam 150ml
- Rudolph Care – Hand & Body Cream
- Rudolph Care – Hydrating Cleansing Milk
- Rudolph Care – Mist Delight (travelsize)
- Rudolph Care – Moisture Delight 50ml
- Rudolph Care – Mommy & Me 145ml
- SUSANNE KAUFMANN – Body Butter for the Senses 200ml
- SUSANNE KAUFMANN – Body Lotion (Hypersensitive Line) 250 ml
- SUSANNE KAUFMANN – Ectoin Repair Serum 30ml
- SUSANNE KAUFMANN – Hydrating Face Gel 50 ml
- SUSANNE KAUFMANN – Nourishing Eye Cream 15 ml
- SUSANNE KAUFMANN – Nourishing Night Cream 50ml
- SUSANNE KAUFMANN – Rejuvenating Day Fluid 50ml
- TITANIA – Essentials – Quick shine
- TITANIA – Hårstrikk – 14 stk
- TITANIA – Kosmetikk Speil m/feste x5
- TITANIA – Manikyr sett
- TITANIA – My Style – Hårbøyle – Rosa stoff
- TITANIA – My style 2pk hårklype med marmor svart
- TITANIA – My style Hårstrikk svart 9st 4mm
- TITANIA – My style hårstrikk frotte svart
- TITANIA – My style – Hårklype krokodille liten 6 st brun
- TITANIA – Nese saks
- TITANIA – Pannebånd 2st i svart farge
- TITANIA – Rastastrikk, blank (150 stk)
- TITANIA – Sovehette
- TITANIA – Tå – skiller
- VADECO – Speil Sugekopp x10 16,7 cm

## Gallerier med samme bilde flere ganger (13)

- ESCENTRIC MOLECULES 01 + MANDARIN – 100ml
- MEMO – FRENCH LEATHER 75ML
- MEMO – MADURAI  75 ML
- MEMO – ARGENTINA 75 ML
- MEMO – SINTRA 75 ML
- MEMO – EAU DE MEMO 75 ML
- MEMO – IRISH LEATHER 75 ML
- MEMO – TAMARINDO 75 ML
- MEMO – ORIENTAL LEATHER 75ML
- Rudolph Care – Sun Balm SPF 50 – 45ml
- MONTBLANC – Legend edt
- ENGELSRUFER –  With Love100ml
- AHAVA – Osmoter Eye Night Cream

