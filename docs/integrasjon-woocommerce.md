# Integrasjon med Reginas WooCommerce

Undersøkt 26.10.2026 med bare lesende kall (GET) mot offentlige endepunkter.

## Dagens oppsett (observert)

| Del            | Funn                                                                                         |
| -------------- | -------------------------------------------------------------------------------------------- |
| Nettbutikk     | `nettbutikk.reginaparfymeri.no` – WordPress 7.1, **WooCommerce 10.6.2**, tema WoodMart 8.3.8 |
| Hjemmeside     | `reginaparfymeri.no` – WordPress 6.9 (tema Uncode), lenker til nettbutikken                  |
| Merker         | Perfect WooCommerce Brands (`wp/v2/pwb-brand`) – 53 merker, koblet per produkt               |
| Frakt          | Plugin «Posten Bring Checkout» (navnerom `posten-bring-checkout`)                            |
| Rabatter       | Woo Discount Rules (Pro) – kan gi priser som først vises i handlekurven                      |
| Betaling       | Navnerommet `amendo-vipps/v2` tyder på Vipps via Amendo – **ikke verifisert**                |
| Kasse i butikk | Navnerommet `wc/pos/v1/catalog` tyder på WooCommerce POS – **ikke verifisert**               |
| Katalog        | 1 082 synlige produkter (981 enkle, 101 variable, 240 variasjoner), 127 kategorier           |

WooCommerce er derfor kilden til produkter, priser og lager i nettbutikken. Om lageret også styres fra
butikkens kasse, er ikke bekreftet.

## Hvordan konseptet henter data

Alt går gjennom WooCommerce **Store API** (`/wp-json/wc/store/v1`), som er offentlig for lesing og ikke
krever nøkler. Lesingen er låst til disse stiene (`src/lib/katalog/woo/hent.ts`, test i `hent.test.ts`):

- `GET /wc/store/v1/products` – produkter (standard sortering: nyeste først)
- `GET /wc/store/v1/products?type=variation` – alle variasjoner med egen pris, lager og SKU
- `GET /wc/store/v1/products/categories` – kategoritreet
- `GET /wp/v2/pwb-brand` og `GET /wp/v2/product?_fields=id,pwb-brand` – merkene og koblingen

Rådata gjøres om til en domenemodell (`src/lib/katalog/typer.ts`) i rene, testede funksjoner
(`woo/mapping.ts`, `bygg.ts`). Flaten ser aldri WooCommerce-formatet.

- **Priser:** Store API gir beløp i minste enhet som tekst (`"264500"`, `currency_minor_unit: 2`). Lagres som
  heltall øre. Tilbud bare når WooCommerce sier det _og_ prisen er lavere. Prisene vises slik butikken viser
  dem (inkl. mva., jf. salgsbetingelsene). Frakt og rabattregler beregnes ikke i flaten.
- **Lager:** `is_in_stock`, `is_on_backorder`, `low_stock_remaining` og WooCommerces egen tekst («1 på
  lager»). «Få igjen» bare når WooCommerce melder lav beholdning. Antallet i kurven begrenses av beholdningen.
- **Varianter:** hver variasjon hentes for seg. Fem variasjoner i butikken har samme valg som en annen
  (Hanne Bang Brynsfarge, Creed Centaurus). WooCommerce velger selv den første i rekkefølgen – konseptet gjør
  det samme og logger resten i `data/katalog/datakvalitet.json`.
- **Bilder:** URL-ene fra Store API, optimalisert av Next.js. Bakgrunnen måles ved henting.

### Utdrag eller live

`KATALOG_KILDE=utdrag` (standard) bruker utdraget i `data/katalog/`. `KATALOG_KILDE=live` leser Store API
ved forespørsel (mellomlagret 5 min). Feiler live-lesingen, vises feilsiden – aldri utdraget som om det var
ferskt.

## Handlekurv og kasse

I konseptet ligger handlekurven i nettleseren og kontrolleres mot katalogen (`/api/handlekurv`): gammel pris
rettes og forklares, utsolgte og forsvunne varer stoppes, antall justeres ned til beholdningen.

Overgangen til kassen er bygget, men **av** (`NEXT_PUBLIC_KASSE=konsept`). Med `NEXT_PUBLIC_KASSE=woocommerce`
sendes kurven til WooCommerces dokumenterte delbare kasse-lenke:

```
https://nettbutikk.reginaparfymeri.no/checkout-link/?products=6225:1,10481:2
```

(variable produkter med variasjons-ID; https://woocommerce.com/document/creating-sharable-checkout-urls-in-woocommerce/).
**Ikke verifisert mot Reginas butikk** – å kalle den ville opprettet en handlekurv-økt i produksjon.

### Anbefalt vei til produksjon

1. Sett opp en **staging-kopi** av nettbutikken.
2. Velg overlevering:
   - _Enklest:_ delbar kasse-lenke (over) – WooCommerce, Posten/Bring, rabattregler og betaling er uendret.
   - _Mest sømløst:_ Store API-handlekurv (`/cart/add-item` med `Cart-Token`) slik at WooCommerce regner
     totaler, rabatter og frakt allerede i skuffen, og kasse-siden får samme kurv.
3. Test hele kjøpet i staging med testbetaling før noe kobles mot produksjon.
4. Hvis lager i butikk og nett deles (POS), avklar hvor ofte lager oppdateres, og vurder kortere levetid.
5. Trenger løsningen REST API v3 (f.eks. ordrestatus), skal nøklene bare ligge på serveren.

## Sikkerhet

- Ingen nøkler i kode, nettleser eller git. Store API-lesingen er offentlig.
- Lesingen kan ikke treffe kurv-, kasse- eller ordre-endepunkter (tillatt-liste + test).
- Produktbeskrivelser vises aldri som HTML – de gjøres om til tekstblokker som React escaper.
- Konseptet er merket `noindex` så det ikke konkurrerer med Reginas ekte nettsted i søk.
