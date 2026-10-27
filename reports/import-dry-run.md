# Import til staging – tørrkjøring

Generert 2026-10-27 11:05 UTC av `scripts/import_to_woocommerce.ts` (standard er tørrkjøring; ingen skrivende kall).

- **Mål:** offline – ingen nøkler i miljøet. Planlagt mot en tom butikk; ingen nettverkskall er gjort.
- **Kilde:** `data/products.json` (1 082 produkter: 981 enkle, 101 variable), `raw/variations_raw.json` (240 variasjoner, pris/lager/SKU), `data/categories.json` (127 kategorier), `data/brands.json` (78 merker)
- **Resultat:** alle antall stemmer med kilden · 271 advarsler · 0 feil · 0 blokkerende
- **Neste steg:** sett `WC_STAGING_URL`, `WC_STAGING_KEY` og `WC_STAGING_SECRET` og kjør på nytt for å se forskjellen mot staging; `--apply` skriver.

## Avstemming mot kilden

| Type | I kilden | Hoppes over | Skal finnes etter import | Opprettes | Oppdateres | Uendret | Stemmer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | :---: |
| Produkter | 1 082 | 0 | 1 082 | 1 082 | 0 | 0 | ja |
| Variasjoner | 240 | 5 | 235 | 235 | 0 | 0 | ja |
| Kategorier | 127 | 0 | 127 | 127 | 0 | 0 | ja |
| Merker | 78 | 0 | 78 | 78 | 0 | 0 | ja |
| Attributter | 3 | 0 | 3 | 3 | 0 | 0 | ja |
| Attributtermer | 66 | 0 | 66 | 66 | 0 | 0 | ja |

Variasjoner: 5 doble variasjoner importeres ikke.

## Lager

Kilden sier bare om en vare er på lager og – når butikken styrer lageret – hvor mange som kunne legges i
kurven da utdraget ble tatt (Store API: `add_to_cart.maximum`, `low_stock_remaining` og teksten «N på lager»).
Eksakt beholdning er ukjent. Derfor:

- **Lagerstyring med antall** bare der kilden gir et faktisk antall: på lager og maks i kurven under 9999,
  `low_stock_remaining` eller «N på lager» – og alle tallene som finnes er like. Antallet er det som var
  tilgjengelig for nettkunder (beholdning minus reservasjoner i åpne kurver).
- **Lagerstyring med 0** for utsolgte varer med `low_stock_remaining = 0` (butikken styrer lageret og har 0
  eller mindre). Negativ beholdning kan ikke leses ut og importeres som 0.
- **Uten lagerstyring**, bare `stock_status` (på lager / utsolgt), når antallet ikke er kjent.
- **Variable produkter** får ingen lagerstyring på forelderen; lageret står på hver variant, og WooCommerce
  avleder status for produktet.
- Ingen restordre (ingen i kilden). Lageret i staging er et øyeblikksbilde og skal ikke synkes tilbake.

| Lager i importen | Produkter | Variasjoner |
| --- | ---: | ---: |
| Lagerstyring med antall (på lager) | 861 | 194 |
| Lagerstyring, antall 0 (utsolgt) | 120 | 41 |
| Lager på variantene (variabelt produkt) | 101 | 0 |

Til sammen 3 282 enheter med lagerstyring.

## Hoppes over

- Variasjon `sku:3614229828592` (kilde #3863): samme valg som variasjon 3862
- Variasjon `sku:3614229828593` (kilde #3865): samme valg som variasjon 3864
- Variasjon `sku:98202` (kilde #7257): samme valg som variasjon 7255
- Variasjon `sku:98203` (kilde #7261): samme valg som variasjon 7260
- Variasjon `sku:121076` (kilde #7265): samme valg som variasjon 7263

## Advarsler (271)

### Doble variasjoner – importeres ikke (5)

Samme valg som en tidligere variasjon. WooCommerce bruker den første; resten bør slettes i butikken.

- **CREED – Centaurus EdP – 100ml** · #3863 · SKU 3614229828592 – Variasjon 3863 har samme valg som 3862. WooCommerce bruker den første; denne importeres ikke og bør slettes i butikken.
- **CREED – Centaurus EdP – 50ml** · #3865 · SKU 3614229828593 – Variasjon 3865 har samme valg som 3864. WooCommerce bruker den første; denne importeres ikke og bør slettes i butikken.
- **HANNE BANG – BRYNSFARGE – Sort** · #7257 · SKU 98202 – Variasjon 7257 har samme valg som 7255. WooCommerce bruker den første; denne importeres ikke og bør slettes i butikken.
- **HANNE BANG – BRYNSFARGE – Askebrun** · #7261 · SKU 98203 – Variasjon 7261 har samme valg som 7260. WooCommerce bruker den første; denne importeres ikke og bør slettes i butikken.
- **HANNE BANG – BRYNSFARGE – BRUNSVART** · #7265 · SKU 121076 – Variasjon 7265 har samme valg som 7263. WooCommerce bruker den første; denne importeres ikke og bør slettes i butikken.

### Duplikate SKU-er i kilden (5)

- SKU 3614229828592 brukes 2 ganger: variasjon 3862 (CREED – Centaurus EdP), variasjon 3863 (CREED – Centaurus EdP). Løses ved at den doble variasjonen hoppes over.
- SKU 3614229828593 brukes 2 ganger: variasjon 3864 (CREED – Centaurus EdP), variasjon 3865 (CREED – Centaurus EdP). Løses ved at den doble variasjonen hoppes over.
- SKU 98202 brukes 2 ganger: variasjon 7255 (HANNE BANG – BRYNSFARGE), variasjon 7257 (HANNE BANG – BRYNSFARGE). Løses ved at den doble variasjonen hoppes over.
- SKU 98203 brukes 2 ganger: variasjon 7260 (HANNE BANG – BRYNSFARGE), variasjon 7261 (HANNE BANG – BRYNSFARGE). Løses ved at den doble variasjonen hoppes over.
- SKU 121076 brukes 2 ganger: variasjon 7263 (HANNE BANG – BRYNSFARGE), variasjon 7265 (HANNE BANG – BRYNSFARGE). Løses ved at den doble variasjonen hoppes over.

### Merker som ikke selges på nett (1)

Merket står på Reginas liste over merker som bare selges i butikken (restriksjoner fra leverandøren). Produktet er flagget, ikke endret.

- **GUERLAIN – Mon Guerlain Xmas** · #10222 · SKU 3614229828641 – «Guerlain» står på listen over merker som ikke selges på nett. Importeres uendret – må avklares.

### Mangler merke (4)

Importeres uten merke – må merkes manuelt.

- **NISSE HÅNDSÅPE 300 ML** · #4580 · SKU 5060917126034 – Produktet har ikke noe merke og må merkes manuelt
- **Bambus Q-tips – 300 stk** · #8061 · SKU 5060917126655 – Produktet har ikke noe merke og må merkes manuelt
- **Exclamation 50ml** · #8446 · SKU 5060917126749 – Produktet har ikke noe merke og må merkes manuelt
- **PL3 Lebepomade** · #10056 · SKU 121158 – Produktet har ikke noe merke og må merkes manuelt

### Mangler beskrivelse (116)

- **ESCENTRIC MOLECULES 03 – 100ml** · #3632 · SKU 5060917125805 – Produktet har ingen beskrivelse
- **MEMO – INDIAN LEATHER 75ML** · #3902 · SKU 120781 – Produktet har ingen beskrivelse
- **JJDK – LED LIGHT SPEIL – EXTRA SPEIL X10** · #4415 · SKU 3614229828654 – Produktet har ingen beskrivelse
- **MARTINELIA – MAGIC – UNICORN HÅRBØRSTE** · #4461 · SKU 5060917125993 – Produktet har ingen beskrivelse
- **NISSE HÅNDSÅPE 300 ML** · #4580 · SKU 5060917126034 – Produktet har ingen beskrivelse
- **JJDK – PREMIUM WOMEN Beige stor toalettveske** · #4809 · SKU 5060917125862 – Produktet har ingen beskrivelse
- **SONIC – EL Tannbørste** · #4957 · SKU 5060917126160 – Produktet har ingen beskrivelse
- **ERASMIC – Shave Cream 100 ml** · #5633 · SKU 5060917125739 – Produktet har ingen beskrivelse
- **TITANIA – Hårbørste Bjørn** · #5686 · SKU 3614229828634 – Produktet har ingen beskrivelse
- **Gian Marco Venturi – Nightfall Shampoo** · #5692 · SKU 5060917126169 – Produktet har ingen beskrivelse
- **ORMONDE JAYNE – VETIVERIA 88 ML** · #5709 · SKU 5060917126172 – Produktet har ingen beskrivelse
- **FUGAZZI – Vanilla Haze extrait de parfum 50ml** · #6190 · SKU 3614229828657 – Produktet har ingen beskrivelse
- **PARFUMS DE MARLY – SEDLEY EDP SPRAY** · #6440 · SKU NPMSEDEPS – Produktet har ingen beskrivelse
- **PARFUMS DE MARLY –  OAJAN EDP SPRAY 125ml** · #6479 · SKU NPM1200PV – Produktet har ingen beskrivelse
- **DRESDNER – BADESALT KIDS** · #6610 · SKU DBSKE – Produktet har ingen beskrivelse
- **DRESDNER – Body Wash Muscle Terapy 295ml** · #6613 · SKU 22059 – Produktet har ingen beskrivelse
- **DRESDNER Dusjgel stress anti 295ml** · #6614 · SKU 22056 – Produktet har ingen beskrivelse
- **MARTINELIA – Magic Makeup Ball** · #6746 · SKU 5060917126208 – Produktet har ingen beskrivelse
- **TITANIA – Peeling Belte** · #6759 · SKU 5060917126217 – Produktet har ingen beskrivelse
- **TITANIA – Hårbøyle Glitter** · #6761 · SKU 5060917126218 – Produktet har ingen beskrivelse
- **JJDK – Håruller 8 stk – Gul 40 mm** · #6785 · SKU 5060917126252 – Produktet har ingen beskrivelse
- **MAVALA – 215 Pink Diamond** · #6815 · SKU 5060917126292 – Produktet har ingen beskrivelse
- **MAVALA – 488 Soft Gold** · #6817 · SKU 5060917126291 – Produktet har ingen beskrivelse
- **MAVALA – 492 Blue Frost** · #6819 · SKU 5060917126290 – Produktet har ingen beskrivelse
- **MAVALA – 945 Red Fizz** · #6821 · SKU 5060917126293 – Produktet har ingen beskrivelse
- **MAVALA – 487 Icy Dusk** · #6823 · SKU 5060917126294 – Produktet har ingen beskrivelse
- **MAVALA – 489 Silver Dream** · #6825 · SKU 5060917126295 – Produktet har ingen beskrivelse
- **MAVALA – 324 Iceberg** · #6827 · SKU 5060917126296 – Produktet har ingen beskrivelse
- **MAVALA – 970 Pretty Gold** · #6829 · SKU 5060917126297 – Produktet har ingen beskrivelse
- **MAVALA – 475 Ottawa** · #6832 · SKU 5060917126298 – Produktet har ingen beskrivelse
- **MAVALA – 968 Pretty Ebony** · #6834 · SKU 5060917126299 – Produktet har ingen beskrivelse
- **MAVALA – 478 Safi** · #6836 · SKU 5060917126300 – Produktet har ingen beskrivelse
- **MAVALA – 448 Jerash** · #6838 · SKU 5060917126301 – Produktet har ingen beskrivelse
- **MAVALA – 469 Luxor** · #6840 · SKU 5060917126302 – Produktet har ingen beskrivelse
- **MAVALA – 471 Tbilisi** · #6842 · SKU 5060917126303 – Produktet har ingen beskrivelse
- **MAVALA – 470 Perugia** · #6844 · SKU 5060917126304 – Produktet har ingen beskrivelse
- **MAVALA – 477 Panama** · #6846 · SKU 5060917126305 – Produktet har ingen beskrivelse
- **MAVALA – 474 Fez** · #6848 · SKU 5060917126306 – Produktet har ingen beskrivelse
- **MAVALA – 476 Marbella** · #6850 · SKU 5060917126307 – Produktet har ingen beskrivelse
- **MAVALA – 479 Dj;Bouti** · #6852 · SKU 5060917126308 – Produktet har ingen beskrivelse
- **TITANIA – Speil Hånd Hvit x2/x5** · #6862 · SKU 5060917126311 – Produktet har ingen beskrivelse
- **VADECO – Speil Sugekopp x10 16,7 cm** · #6870 · SKU 5060917126313 – Produktet har ingen beskrivelse
- **TITANIA – My Style Clip Gull loop** · #6873 · SKU 5060917126315 – Produktet har ingen beskrivelse
- **TITANIA – Pannebånd 2st i svart farge** · #6875 · SKU 5060917125918 – Produktet har ingen beskrivelse
- **TITANIA – My Style – Hårbøyle – Rosa stoff** · #6877 · SKU 5060917125714 – Produktet har ingen beskrivelse
- **TITANIA –  My style – Hårklype** · #6887 · SKU 5060917126317 – Produktet har ingen beskrivelse
- **TITANIA – Scrunki** · #6889 · SKU 5060917125931 – Produktet har ingen beskrivelse
- **TITANIA – My style – Hårbøyle Caramel** · #6891 · SKU 5060917125886 – Produktet har ingen beskrivelse
- **TITANIA –  Sommerfugl strikk 5stk** · #6895 · SKU 5060917125891 – Produktet har ingen beskrivelse
- **TITANIA – Hårstrikk – Str. S spiralstrikk, brun (3 stk)** · #6897 · SKU 5060917126318 – Produktet har ingen beskrivelse
- **TITANIA – My style hårstrikk frotte svart** · #6899 · SKU 5060917125885 – Produktet har ingen beskrivelse
- **TITANIA – My style Hårstrikk svart 9st 4mm** · #6901 · SKU 5060917125884 – Produktet har ingen beskrivelse
- **TITANIA – My style – Hårklype krokodille liten 6 st brun** · #6905 · SKU 5060917125887 – Produktet har ingen beskrivelse
- **TITANIA – Hårklemme – Fliseklemmer black 5 cm, 30 pce** · #6907 · SKU 5060917126320 – Produktet har ingen beskrivelse
- **TITANIA – Hårklemme svart+diamanter** · #6909 · SKU 5060917125925 – Produktet har ingen beskrivelse
- **TITANIA – Hårrull 13mm** · #6911 · SKU 5060917126321 – Produktet har ingen beskrivelse
- **TITANIA – Hårrull 32mm** · #6914 · SKU 5060917126322 – Produktet har ingen beskrivelse
- **BATISTE – Dry Shampoo Mini** · #6917 · SKU 5060917126244 – Produktet har ingen beskrivelse
- **TITANIA – Sminkesvamp for ansikt – rund, rosa/hvit** · #6924 · SKU 5060917126324 – Produktet har ingen beskrivelse
- **TITANIA – Fliseklemme brun/gull 5 cm, 30 pce** · #6927 · SKU 5060917126325 – Produktet har ingen beskrivelse
- **TITANIA – Tå – skiller** · #6929 · SKU 5060917126326 – Produktet har ingen beskrivelse
- **TITANIA – Nese saks** · #6931 · SKU 5060917126328 – Produktet har ingen beskrivelse
- **TITANIA – Manikyr sett** · #6933 · SKU 5060917126329 – Produktet har ingen beskrivelse
- **BETER ELITE – VIPPEBØYER** · #7054 · SKU 5060917126075 – Produktet har ingen beskrivelse
- **JJDK – Lomme Speil X1 / X5** · #7056 · SKU 5060917125663 – Produktet har ingen beskrivelse
- **TITANIA – My Style – Hårbøyle – Svart Stoff** · #7066 · SKU 5060917126365 – Produktet har ingen beskrivelse
- **TITANIA – Hårrull 19 mm** · #7068 · SKU 5060917126323 – Produktet har ingen beskrivelse
- **JJDK -Papiljotter Lilla 25cm 6 stk** · #7071 · SKU 5060917126253 – Produktet har ingen beskrivelse
- **MAVALA – Mini Color – 381 Rouge Forever** · #7080 · SKU 5060917126368 – Produktet har ingen beskrivelse
- **TITANIA – My Style – Hårpinne for oppsats** · #7088 · SKU 5060917126375 – Produktet har ingen beskrivelse
- **JJDK – Speil x1** · #7101 · SKU 5060917126257 – Produktet har ingen beskrivelse
- **LÖWENGRIP – Bounce Back – Shine & Texture Spray** · #7209 · SKU LOVBBSTS – Produktet har ingen beskrivelse
- **LÖWENGRIP – Style To Define – Cream Mousse** · #7215 · SKU LOVSTDCM – Produktet har ingen beskrivelse
- **Optima Natura – Badesalt med eukalyptusolje og rosmarinolje, 1 kg.** · #7433 · SKU 5060917126417 – Produktet har ingen beskrivelse
- **Optima Natura – Badesalt med lavendelolje 1 kg** · #7435 · SKU 5060917126418 – Produktet har ingen beskrivelse
- **GrandeBROW 2-In-1 Tinted Brow Gel + Brow Enhancing Serum** · #7533 · SKU GRABRTI – Produktet har ingen beskrivelse
- **ANASTASIA – Øyenbryns former 5 stk** · #7614 · SKU 5060917126211 – Produktet har ingen beskrivelse
- **Optima Natura –  Mist with NatEssoil – N-Active OilSleep, 50ml** · #7623 · SKU 5060917126472 – Produktet har ingen beskrivelse
- **FUGAZZI – Borntostandout Extrait de Parfum 50 ml** · #7715 · SKU 5060917126478 – Produktet har ingen beskrivelse
- **MAVALA – Eye Shadow Pen – Prune Flambée** · #7889 · SKU 5060917126564 – Produktet har ingen beskrivelse
- **LOVE – Bomullspads 40 store** · #7955 · SKU 5060917126363 – Produktet har ingen beskrivelse
- **TITANIA – Hårstrikk 4st** · #8057 · SKU 5060917126658 – Produktet har ingen beskrivelse
- **JJDK – Orchid – Stor toalettveske** · #8166 · SKU 5060917125668 – Produktet har ingen beskrivelse
- **JJDK – Lotion – Stor toalettveske** · #8168 · SKU 5060917125666 – Produktet har ingen beskrivelse
- **JJDK – Anna Marie – Svart stor toalettveske** · #8195 · SKU 5060917125899 – Produktet har ingen beskrivelse
- **JJDK – Pariset – Lilla liten toalettveske** · #8197 · SKU 5060917126260 – Produktet har ingen beskrivelse
- **JJDK – Toalettveske medium rosa beige** · #8199 · SKU 5060917126266 – Produktet har ingen beskrivelse
- **Optima Natura – Oil for aroma: N-Active Oil Concentration, 20ml** · #8406 · SKU 5060917126452 – Produktet har ingen beskrivelse
- **DRESDNER – Detox – Engangspakke** · #8512 · SKU 22009 – Produktet har ingen beskrivelse
- **TITANIA – Hårbørste double brishle 7 rad** · #8620 · SKU 5060917126788 – Produktet har ingen beskrivelse
- **JJDK -Papiljotter Grønn 20cm 6 stk** · #8677 · SKU 5060917126254 – Produktet har ingen beskrivelse
- **TITANIA – Banan klemme med perler** · #8712 · SKU 5060917126813 – Produktet har ingen beskrivelse
- **TITANIA – My Style 6 strikk tykk** · #8715 · SKU 5060917126814 – Produktet har ingen beskrivelse
- **TITANIA – My Style Hair set in box – small** · #8801 · SKU 5060917126852 – Produktet har ingen beskrivelse
- **IDC INSTITUTE – Badebombe** · #8818 · SKU 5060917125838 – Produktet har ingen beskrivelse
- **MAVALA – MINI COLOR 55 DAKAR** · #8903 · SKU 5060917126858 – Produktet har ingen beskrivelse
- **MAVALA MINI COLOR 14 ST-TROPEZ** · #8905 · SKU 5060917126859 – Produktet har ingen beskrivelse
- **MAVALA MINI COLOR 9 LISBOA** · #8913 · SKU 5060917126860 – Produktet har ingen beskrivelse
- **MAVALA MINI COLOR 20 CAIRO** · #8917 · SKU 5060917126862 – Produktet har ingen beskrivelse
- **MAVALA MINI COLOR 46 CADIZ** · #8919 · SKU 5060917126863 – Produktet har ingen beskrivelse
- **MAVALA MINI COLOR 288 GINZA** · #8921 · SKU 5060917126864 – Produktet har ingen beskrivelse
- **MAVALA MINI COLOR 75 MIAMI** · #8924 · SKU 5060917126865 – Produktet har ingen beskrivelse
- **MAVALA MINI COLOR 71 LA PAZ** · #8928 · SKU 5060917126867 – Produktet har ingen beskrivelse
- **MAVALA MINI COLOR 65 ADELAIDE** · #8930 · SKU 5060917126868 – Produktet har ingen beskrivelse
- **MAVALA MINI COLOR 303 BALI** · #8932 · SKU 5060917126869 – Produktet har ingen beskrivelse
- **MAVALA MINI COLOR 52 TOULOUSE** · #8934 · SKU 5060917126870 – Produktet har ingen beskrivelse
- **MAVALA MINI COLOR 16 BAGHDAD** · #8936 · SKU 5060917126871 – Produktet har ingen beskrivelse
- **MAVALA MINI COLOR 190 HONOLULU** · #8938 · SKU 5060917126872 – Produktet har ingen beskrivelse
- **MAVALA MINI COLOR 74 LOS ANGELES** · #8940 · SKU 5060917126874 – Produktet har ingen beskrivelse
- **MAVALA MINI COLOR 2 MADRID** · #8945 · SKU 5060917126875 – Produktet har ingen beskrivelse
- **MAVALA MINI COLOR 7 MACAO** · #8951 · SKU 5060917126876 – Produktet har ingen beskrivelse
- **MAVALA MINI COLOR 1 ANKARA** · #9012 · SKU 5060917126881 – Produktet har ingen beskrivelse
- **JJDK Essaouira 61831** · #9014 · SKU 5060917126882 – Produktet har ingen beskrivelse
- **Hermines Story – Isabelle – Horsebit Øredobber – Sølv** · #9182 · SKU 5060917126928 – Produktet har ingen beskrivelse
- **MAVALA – 450 The Power Of Pink 5ml** · #10119 · SKU 5060917127097 – Produktet har ingen beskrivelse
- **MAVALA – 431 The Power Of Pink 5ml** · #10123 · SKU 5060917127098 – Produktet har ingen beskrivelse

### Lager på forelder og varianter er uenige (1)

- **MARTINELIA – LITTLE DINOSAUR – Badebombe** · #4545 · SKU 5060917125837 – Forelderen har eget lager i butikken (utsolgt, low_stock_remaining 0, maks 1) mens 2 av 2 varianter er på lager. Forelderen importeres uten lagerstyring, så WooCommerce avleder status fra variantene.

### Trolig negativ beholdning i butikken (4)

Utsolgt, men Store API begrenset kurven til 1 – skjer når beholdningen er under 0. Importeres som 0.

- **BONDI SANDS – Reusable Self Tan Exfoliating Glove** · #5627 · SKU 5060917125717 – Utsolgt, men Store API begrenset kurven til 1 – beholdningen er trolig negativ i butikken. Importeres som 0.
- **PARFUMS DE MARLY – Valaya edp – 30ml** · #6470 · SKU NPM0018PV – Utsolgt, men Store API begrenset kurven til 1 – beholdningen er trolig negativ i butikken. Importeres som 0.
- **LÖWENGRIP – All Time High – Dry Volume Spray** · #7213 · SKU 38118 – Utsolgt, men Store API begrenset kurven til 1 – beholdningen er trolig negativ i butikken. Importeres som 0.
- **Esponjabon – Salicylic Acid** · #7935 · SKU 5060917126610 – Utsolgt, men Store API begrenset kurven til 1 – beholdningen er trolig negativ i butikken. Importeres som 0.

### Tilbud uten kjent periode (5)

Tilbudsprisen er ekte data, men start- og sluttdato er ikke med i kilden. Den står til den fjernes.

- **Maginista Thickening Lotion 100ml** · #6375 · SKU MAGFP01125 – På tilbud i kilden; tilbudsperioden er ukjent, så tilbudsprisen står til den fjernes
- **Maginista Dry Shampoo Blond 200 ml** · #6378 · SKU MAGFP01132 – På tilbud i kilden; tilbudsperioden er ukjent, så tilbudsprisen står til den fjernes
- **HELENE FISCHER – Honest EDP 50ml** · #9306 · SKU 5060917125761 – På tilbud i kilden; tilbudsperioden er ukjent, så tilbudsprisen står til den fjernes
- **MEDICUBE – Kojic Acid Tumeric Night Wrapping Mask 75ml** · #9446 · SKU 5060917127037 – På tilbud i kilden; tilbudsperioden er ukjent, så tilbudsprisen står til den fjernes
- **MEDICUBE – Collagen Night Wrapping Mask 75ml** · #9450 · SKU 5060917127038 – På tilbud i kilden; tilbudsperioden er ukjent, så tilbudsprisen står til den fjernes

### Samme bilde flere ganger i galleriet (13)

Lastes opp én gang; rekkefølgen ellers som i kilden.

- **ESCENTRIC MOLECULES 01 + MANDARIN – 100ml** · #3649 · SKU 5060917125742 – Samme bilde står flere ganger i galleriet (2 → 1 bilder)
- **MEMO – FRENCH LEATHER 75ML** · #3900 · SKU 120780 – Samme bilde står flere ganger i galleriet (2 → 1 bilder)
- **MEMO – MADURAI  75 ML** · #3906 · SKU 120787 – Samme bilde står flere ganger i galleriet (2 → 1 bilder)
- **MEMO – ARGENTINA 75 ML** · #3911 · SKU 120788 – Samme bilde står flere ganger i galleriet (2 → 1 bilder)
- **MEMO – SINTRA 75 ML** · #3919 · SKU 120793 – Samme bilde står flere ganger i galleriet (2 → 1 bilder)
- **MEMO – EAU DE MEMO 75 ML** · #3921 · SKU 120784 – Samme bilde står flere ganger i galleriet (2 → 1 bilder)
- **MEMO – IRISH LEATHER 75 ML** · #3923 · SKU 120783 – Samme bilde står flere ganger i galleriet (2 → 1 bilder)
- **MEMO – TAMARINDO 75 ML** · #3929 · SKU 120791 – Samme bilde står flere ganger i galleriet (2 → 1 bilder)
- **MEMO – ORIENTAL LEATHER 75ML** · #3933 · SKU 120798 – Samme bilde står flere ganger i galleriet (2 → 1 bilder)
- **Rudolph Care – Sun Balm SPF 50 – 45ml** · #6272 · SKU 6025100 – Samme bilde står flere ganger i galleriet (4 → 3 bilder)
- **MONTBLANC – Legend edt** · #6381 · SKU MONMBLEDT – Samme bilde står flere ganger i galleriet (2 → 1 bilder)
- **ENGELSRUFER –  With Love100ml** · #6661 · SKU 5060917125756 – Samme bilde står flere ganger i galleriet (2 → 1 bilder)
- **AHAVA – Osmoter Eye Night Cream** · #10366 · SKU 5060917126386 – Samme bilde står flere ganger i galleriet (2 → 1 bilder)

### Attributter utover Størrelse og Farge (1)

- Kilden har også den globale attributten «DUFT/BADEBOMBER» (pa_duft-badebomber, 4 termer) på 1 produkt(er). Den opprettes, ellers kan variantene ikke importeres.

### Merke utledet av produktnavnet (116)

Produktet har ikke PWB-merke i butikken i dag; merket i importen er gjenkjent fra navnet.

- **YERKA – Deodorant** · #4417 · SKU 3614229828645 – Merket «Yerka» er utledet av produktnavnet; produktet har ikke PWB-merke i dag
- **FLORENTINO – HÅNDSÅPE JUL 3 X 100 G** · #4627 · SKU 5060917126110 – Merket «Florentino» er utledet av produktnavnet; produktet har ikke PWB-merke i dag
- **IDA WARG – ULTIMATE HOLD HAIRSPRAY – 250 ML** · #4631 · SKU 5060917126111 – Merket «Ida Warg» er utledet av produktnavnet; produktet har ikke PWB-merke i dag
- **FLORENTINO – HÅNDSÅPE APPELSIN OG KANEL 100 G** · #4796 · SKU 5060917126126 – Merket «Florentino» er utledet av produktnavnet; produktet har ikke PWB-merke i dag
- **FIORENTINO – Lavendel og Sitron 100gr** · #4800 · SKU 5060917126135 – Merket «Florentino» er utledet av produktnavnet; produktet har ikke PWB-merke i dag
- **SONIC – EL Tannbørste** · #4957 · SKU 5060917126160 – Merket «Sonic» er utledet av produktnavnet; produktet har ikke PWB-merke i dag
- **PEARS – Fast Håndsåpe** · #5613 · SKU 120947 – Merket «Pears» er utledet av produktnavnet; produktet har ikke PWB-merke i dag
- **STERN BARTEVOKS** · #5618 · SKU 5060917125627 – Merket «Stern» er utledet av produktnavnet; produktet har ikke PWB-merke i dag
- **BONDI SANDS – Reusable Self Tan Exfoliating Glove** · #5627 · SKU 5060917125717 – Merket «Bondi Sands» er utledet av produktnavnet; produktet har ikke PWB-merke i dag
- **BRYLCREEM – Original light glossy hold 150ml** · #5629 · SKU 5060917125718 – Merket «Brylcreem» er utledet av produktnavnet; produktet har ikke PWB-merke i dag
- … og 106 til (se JSON-rapporten)

## Feil (0)

Ingen.

## Blokkerende (0)

Ikke kontrollert (offline). Kontrolleres mot staging når nøklene er satt.

## Forutsetninger i staging

- WooCommerce 9.6 eller nyere med **Brands** (`/wc/v3/products/brands`).
- `general/woocommerce_currency` = `NOK`: Valutaen må være NOK – kildeprisene er i NOK (stopper --apply).
- `tax/woocommerce_prices_include_tax` = `yes`: Priser må legges inn inkl. mva. – kildeprisene er inkl. mva., ellers legges mva. på en gang til (stopper --apply).
- `products/woocommerce_manage_stock` = `yes`: Lagerstyring må være slått på – ellers ignorerer WooCommerce lagerantallene (stopper --apply).
- `products/woocommerce_notify_low_stock_amount` = `2`: Terskelen for lavt lager er 2 i butikken i dag (Store API viser «få igjen» ved 1–2).
- REST API-nøkkel med **lese- og skrivetilgang** for `--apply` (lesetilgang holder for tørrkjøring).
- Pene permalenker (`/wp-json/` må svare).
- Staging må kunne laste ned bildene fra Reginas mediebibliotek (se «Til avklaring»).

## Til avklaring

1. **Merker: Perfect WooCommerce Brands → WooCommerce Brands.** Dagens butikk bruker PWB (taksonomien
   `pwb-brand`, 46 merker i bruk på produktene). Importen legger merkene i WooCommerce Brands
   (`product_brand`, 78 merker fra `data/brands.json`). Må avklares: skal butikken gå over til
   WooCommerce Brands, hva skjer med PWB-pluginen, og skal gamle `/brand/<slug>/`-adresser sendes videre
   (`data/legacy_brands.json`)? 116 produkter har ikke PWB-merke i dag og får et merke utledet av navnet.
2. **Bildene** (2 426 produktbilder og 110 egne variantbilder i denne planen; variantbilder
   som står i produktets galleri, gjenbrukes) lastes ned av staging-serveren fra produksjonens mediebibliotek
   (`nettbutikk.reginaparfymeri.no/wp-content/uploads/…`) når de sideloades. Det er bare lesing, men det er
   trafikk mot produksjon. Alternativ: kopier `uploads` til staging først. Ved oppdatering sendes bilder bare
   når produktet i staging ikke har noen, så en ny kjøring ikke fyller mediebiblioteket med kopier.
3. **Beskrivelser** importeres fra den rene teksten i `data/products.json` som enkel HTML (avsnitt og
   linjeskift). Originalen har bare `<p>` og `<br>`, så formateringen er den samme.
4. **Tilbud:** tilbudsprisene er med, men tilbudsperioden finnes ikke i kilden.
5. **Rabatter og frakt** (Woo Discount Rules, Posten/Bring) og vekt/mål er ikke en del av kilden og importeres ikke.
