# Funn i dagens kundereise – og svaret i konseptet

Gjennomgått på nettbutikk.reginaparfymeri.no og reginaparfymeri.no 26.10.2026.

| Funn i dag                                                                                                                     | I konseptet                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Hovedmenyen har 10 punkter og over 100 underkategorier i versaler, flere med 1–2 produkter (33 stk.), og «Tilbehør → Tilbehør» | Seks hovedinnganger, megameny med antall per kategori, tomme kategorier skjult, rolig skrivemåte |
| Toppstripen sier at «nettbutikken fylles opp» med emojier – signaliserer at butikken ikke er ferdig                            | Toppstripe med tre bekreftede fordeler fra vilkårene                                             |
| Påskekampanje står på forsiden i oktober                                                                                       | Ingen kampanjer i konseptet; kampanjer bør styres med dato                                       |
| Engelske knapper («Quick view», «Add to wishlist», «Login / Register», «Lost your password?»)                                  | All tekst på norsk                                                                               |
| «Nyhet» og «Utvalgt» på nær alle produkter, «Bestselgere» uten grunnlag                                                        | Bare merker som finnes i data: Utsolgt, Få igjen, Tilbud                                         |
| Variable produkter viser bare «Velg alternativ» og et prisspenn                                                                | Antall størrelser/farger på kortet; på produktsiden pris og lager per valg                       |
| Lagerstatus vises først etter valg av variant                                                                                  | «2 av 2 størrelser på lager» før valg, så status for valgt variant                               |
| Merker som Chanel, Sisley, Guerlain og Hermès selges bare i butikken – står i løpende tekst                                    | Egen «Bare i butikken»-liste i menyen og på merkesiden, med telefon og e-post                    |
| Søket finner bare i navn                                                                                                       | Søk i merke, navn, kategori, duftnoter og beskrivelse, med forslag mens du skriver               |
| Duftnoter står begravd i beskrivelsen                                                                                          | Duftpyramide på produktsiden og «Finn duften etter noten du liker» på forsiden                   |
| Produktnavn i versaler med merket først («PARFUMS DE MARLY – LAYTON EDP SPRAY»)                                                | Merket for seg, navnet rolig: «Layton EdP Spray»                                                 |
| Hvite produktbilder på hvit side                                                                                               | Bildene står i buer på sand, uten å endre fargen på produktet                                    |

## Datakvalitet (rettes i WooCommerce)

Fra `data/katalog/datakvalitet.json`:

- **5 doble variasjoner** – samme størrelse/farge registrert to ganger, med ulik pris eller lager
  (Hanne Bang Brynsfarge ×3, Creed Centaurus ×2). Kan gi feil pris i dagens butikk.
- **120 produkter uten merke** i merkeregisteret (merket står bare i navnet, f.eks. Brylcreem, IDC).
- **118 produkter uten beskrivelse.**
- Ulike skrivemåter for samme merke i navn: «LÖWENGRIP/LÖVENGRIP», «FUGAZZI/FUGUAZZI»,
  «BJÖRN AXÈN/BJÔRN AXEN».
- 124 produkter er utsolgt i nettbutikken; de vises sist i lister og har vei til butikken.
- Fugazzi-variasjoner der 50 ml og 100 ml har samme pris (f.eks. «In love with the cocos») – bør kontrolleres.
