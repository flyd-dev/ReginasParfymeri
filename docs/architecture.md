# Arkitektur – headless flate foran Reginas WooCommerce (Fase 0: spike)

> **Status: spiken er IKKE godkjent.** Koden og testoppskriften under er skrevet uten tilgang til en
> staging-WordPress. Ingenting er kjørt mot en ekte WooCommerce-installasjon, og ingenting er sendt til
> den live butikken. Spiken er først godkjent når testen i kapittel 8 er kjørt i staging av Flyd og
> godkjenningskriteriet i kapittel 9 er oppfylt.

Skrevet 27.10.2026. Kildefunnene er lest i WooCommerce **11.2.1** (nyeste stabile,
`downloads.wordpress.org/plugin/woocommerce.latest-stable.zip`) og sammenlignet med **10.6.2**, som er
versjonen i dagens butikk. Filstier er relative til `woocommerce/` i pakken.

## 1. Oppgavedeling

| Del                                                        | Hvem                                                         |
| ---------------------------------------------------------- | ------------------------------------------------------------ |
| Katalog, søk, filtre, produktsider, handlekurv (skuffen)   | Next.js (ny flate)                                           |
| Handlekurvens innhold, priser, rabatter, lager i kurven    | WooCommerce via Store API, kalt fra Next.js-serveren         |
| «Gå til kassen» → kurven over i kundens WooCommerce-økt    | mu-pluginen `regina-headless` (`?regina_kurv=`)              |
| Kassen, frakt (Posten/Bring), betaling, ordre, «Min konto» | WooCommerce selv, med Vipps-pluginen og Diller Loyalty       |
| Kampanjebanner, åpningstider, «Gi meg beskjed»             | mu-pluginen, lest av Next.js over `regina/v1`                |
| Oppdatering av flaten ved endringer                        | Revalidering (mu-plugin) og WooCommerce-webhooks (produkter) |

## 2. Arkitekturskisse

```
 Nettleser                       Next.js (ny flate)                          WooCommerce (nettbutikk.reginaparfymeri.no)
 ─────────                       ──────────────────                          ───────────────────────────────────────────

 [Legg i kurven] ──POST──▶  Route handler /api/kurv
                            · leser httpOnly-cookie «regina_kurv»
                            · første gang: GET /cart  ───────────────────▶  Store API  ──▶  svar med header Cart-Token
                            · POST /cart/add-item     ──Cart-Token──────▶  Store API  (ingen Nonce, ingen cookies)
                            · lagrer nyeste Cart-Token i cookien        ◀── SessionHandler: rad i wp_woocommerce_sessions
 ◀── kurven (JSON, øre) ───                                                       (session_key = t_…, 48 t)

 [Gå til kassen] ──POST──▶  Route handler /kasse/videre
                            · GET /cart (sjekk at kurven ikke er tom,
                              få ferskt Cart-Token)
 ◀── 303 Location: {WOO_URL}/?regina_kurv=<Cart-Token>  (no-store, no-referrer)

 GET /?regina_kurv=… ───────────────────────────────────────────────────▶  mu-plugin på wp_loaded (prio 20)
                                                                            1. valider token (CartTokenUtils, '@'.wp_salt())
                                                                            2. les Store API-økten rett fra databasen
                                                                            3. tøm nettleserens kurv, add_to_cart() per vare
                                                                               (variation_id + attributter), apply_coupon()
 ◀── 302 Location: wc_get_checkout_url()  (tokenet er ute av adressen) ────  4. videre til kassen

 Kassen ─────────────────────────────────────────────────────────────────▶  Vipps Checkout-siden (Vipps-pluginen bytter
                                                                            kassesiden), Posten/Bring, Diller, ordre
                                                                            · ordre betalt → mu-pluginen tømmer Store
                                                                              API-kurven hvis den er uendret

                            /api/revalidate  ◀── POST {"tags":[…]} + X-Regina-Signature ── mu-plugin (kampanje/butikkinfo)
                            /api/woo-webhook ◀── POST produkt-JSON + X-WC-Webhook-Signature ── WooCommerce-webhooks
                            GET  /wp-json/regina/v1/kampanjer | /butikk  ──────────────▶  mu-plugin
                            POST /wp-json/regina/v1/varsle  ───────────────────────────▶  mu-plugin
```

Tokenet finnes bare på Next.js-serveren, i en httpOnly-cookie på Next.js-domenet og i én enkelt
videresending. Det er aldri tilgjengelig for JavaScript i nettleseren.

## 3. Funn i WooCommerce-kildekoden

### 3.1 Hvordan Cart-Token lages og valideres

| Hva                                                                                                                | Hvor (11.2.1)                                                           |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Tokenet lages av `CartTokenUtils::get_cart_token( $customer_id )` med payload `user_id`, `exp`, `iss: 'store-api'` | `src/StoreApi/Utilities/CartTokenUtils.php:23-32`                       |
| `iat` legges til i payload                                                                                         | `src/StoreApi/Utilities/JsonWebToken.php:173-175`                       |
| Hemmelighet: `'@' . wp_salt()` (standard `auth`-salt: `AUTH_KEY` + `AUTH_SALT`)                                    | `CartTokenUtils.php:88-90`                                              |
| Utløp: `time() + wc_session_expiration`, standard 2 døgn (48 t)                                                    | `CartTokenUtils.php:98-106`                                             |
| Format: HS256-JWT, header `{"alg":"HS256","typ":"JWT"}`, base64url uten `=`                                        | `JsonWebToken.php:17, 24, 34-40, 140-147, 184-190`                      |
| Signatur: `hash_hmac( 'sha256', header . '.' . payload, $secret, true )`                                           | `JsonWebToken.php:157-164`                                              |
| Validering: regex for tre deler, header `typ`/`alg`, `exp` finnes og `time() <= exp`, deretter `hash_equals`       | `JsonWebToken.php:52-67` og `76-112` (regex 85, header 94-102, exp 107) |
| `iss` sjekkes ikke                                                                                                 | `JsonWebToken.php:52-112`                                               |
| Tokenet leses fra headeren `HTTP_CART_TOKEN` med `wc_clean( wp_unslash() )`                                        | `CartTokenUtils.php:40-44`                                              |
| Payload leses bare etter gyldig signatur (fra 11.1.0)                                                              | `CartTokenUtils.php:65-81`                                              |
| Nytt token med nytt `exp` i **hvert** svar fra kurvrutene                                                          | `src/StoreApi/Routes/V1/AbstractCartRoute.php:188-202, 246-255`         |

`user_id` i payload er sesjonsnøkkelen, ikke en bruker: for gjester `t_` + 30 heksadesimale tegn
(`includes/class-wc-session-handler.php:450-452`, `includes/wc-core-functions.php:1286-1301`).

### 3.2 Hvordan Store API sin SessionHandler laster økten

| Hva                                                                                                                                                        | Hvor (11.2.1)                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Filteret `woocommerce_session_handler` (prio 0) velger `StoreApi\SessionHandler` for Store API-kall med gyldig Cart-Token                                  | `src/StoreApi/StoreApi.php:30`, `src/StoreApi/Authentication.php:50-60` |
| Kurvrutene setter det samme filteret før kurven lastes                                                                                                     | `AbstractCartRoute.php:211-236` (217-225)                               |
| SessionHandler validerer tokenet selv, bruker `payload.user_id` som nøkkel og `payload.exp` som utløp                                                      | `src/StoreApi/SessionHandler.php:64-77`                                 |
| Ugyldig token: den vanlige økten velges, uten cookie → ny, tom gjesteøkt og nytt token, ingen feilmelding (11.x har i tillegg samme vern i SessionHandler) | `Authentication.php:55-59`, `SessionHandler.php:65-70`                  |
| Leser og skriver rett i `{prefix}woocommerce_sessions` – ingen cookie, ingen cron, **ingen objektmellomlager**                                             | `SessionHandler.php:13-19, 129-150, 191-208`                            |
| Samme tabell som den vanlige økten, men den vanlige `WC_Session_Handler` leser via objektmellomlageret                                                     | `includes/class-wc-session-handler.php:656-681`                         |
| Verdier lagres som `maybe_serialize()` inne i den serialiserte raden                                                                                       | `includes/abstracts/abstract-wc-session.php:104-133`                    |

### 3.3 Hvordan en server-til-server-klient får sitt første Cart-Token

`GET /wp-json/wc/store/v1/cart` uten Cart-Token: WooCommerce lager en ny gjestenøkkel og svarer med
headeren `Cart-Token` (og `Cart-Hash`, `Nonce`) – `AbstractCartRoute.php:196-199`. Det lagres ingen rad
før kurven endres. Neste kall med tokenet får `SessionHandler` og samme nøkkel. Dette er også
WooCommerce sin dokumenterte vei (https://developer.woocommerce.com/docs/apis/store-api/cart-tokens/).

Et `POST` uten gyldig token og uten Nonce avvises med 401 `woocommerce_rest_missing_nonce`
(`AbstractCartRoute.php:353-355`). Første kall må derfor være et `GET`.

### 3.4 Krever `POST /cart/add-item` Nonce når Cart-Token er satt?

**Nei.** `requires_nonce()` er `is_update_request && ! has_cart_token` (`AbstractCartRoute.php:279-281`),
og `has_cart_token()` validerer Cart-Token-headeren (`265-270`). Med gyldig token hoppes nonce-sjekken
over (`152`). Samme logikk i 10.6.2 (`AbstractCartRoute.php:224-226`).

### 3.5 Variasjoner i `add-item`

Skjema: `{ id, quantity, variation: [{ attribute, value }] }` (`src/StoreApi/Routes/V1/CartAddItem.php:40-86`).

- `id` kan være variasjons-ID-en direkte. Da brukes akkurat den variasjonen; WooCommerce leter bare etter
  «første samsvarende» når `id` er det variable foreldreproduktet (`src/StoreApi/Utilities/CartController.php:1278-1280, 1364-1399`).
  Det passer regelen vår om doble variasjoner: flaten velger den første og sender dens ID.
- `variation` gjøres om med `wp_list_pluck( …, 'value', 'attribute' )` (`CartController.php:1275`).
  `attribute` godtas som `attribute_pa_farge`, som merkelappen «Farge» (også med liten forbokstav) eller som
  `pa_farge` (`1412-1472`). `value` er slugen for taksonomi-attributter (`sanitize_title`).
- Attributter med fast verdi på variasjonen fylles inn av WooCommerce hvis de mangler (`1319-1322`).
  Attributter satt til «hvilken som helst» må sendes, ellers 400 (`1325-1347`).
- Kurvsvaret (`items[].variation`) inneholder visningsnavn, ikke slugs (`src/StoreApi/Utilities/ProductItemTrait.php:41-90`)
  – det skal ikke sendes tilbake som inndata.
- Store API kjører `woocommerce_add_to_cart_validation` ved `add-item` (`CartController.php:335`).

### 3.6 Finnes det en innebygd overføring til den klassiske kassen?

**Ja, to.**

1. **`?session=<Cart-Token>` på hvilken som helst side** (`includes/class-wc-session-handler.php:105-157`).
   Gyldig token for en gjesteøkt som finnes → nettleseren får en ny økt med en kopi av dataene (uten
   `customer`) og `previous_customer_id` (`206-213`). For innloggede blir kundens økt erstattet (kommentar
   `114-115`).
2. **`/checkout-link/?products=ID:ANTALL,…&coupon=…`** (`src/Blocks/Domain/Services/CheckoutLink.php`):
   tømmer kurven, legger til varene og sender til kassen. For gjester legges `?session=<token>` på
   kasseadressen (`194-198`).

**Vurdering – vi bruker dem ikke, men eget endepunkt med samme validering:**

| Problem med `?session=` for vår flyt                                                                                                                                                                        | Kilde                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Tokenet blir stående i kasseadressen: i historikken, i analyseverktøy og som `Referer` til tredjepartsskript på kassesiden.                                                                                 | `class-wc-session-handler.php:121-157` (ingen videresending), `CheckoutLink.php:197`               |
| Andre gang samme token brukes, kopieres ingenting: økten «ble laget av dette tokenet» og beholdes. Endrer kunden kurven i Next.js og trykker «Gå til kassen» igjen, havner den **gamle** kurven i kassen.   | `class-wc-session-handler.php:145-148`                                                             |
| Rå kopi av øktdata, utenom kurv-API-et: `woocommerce_add_to_cart` og `woocommerce_cart_emptied` kjøres ikke. Vipps Checkout lytter på nettopp disse for å avbryte en påbegynt Vipps-økt for en gammel kurv. | `class-wc-session-handler.php:206-213`; Vipps `payment/VippsCheckout.class.php:386-409, 1293-1303` |
| Kilden leses via objektmellomlageret, mens Store API skriver forbi det. Med Redis/Memcached kan en gammel kurv bli kopiert.                                                                                 | `class-wc-session-handler.php:656-681` mot `SessionHandler.php:129-150`                            |
| Ugyldig eller utløpt token gir ingen melding – kunden står med en tom eller gammel kurv.                                                                                                                    | `class-wc-session-handler.php:124-131`                                                             |

`/checkout-link/` tåler ikke attributter av typen «hvilken som helst», kjører ikke via Store API-kurven
(ingen totaler i skuffen) og har det samme `?session=`-problemet. Den forblir en reserve.

Viktig for sikkerheten: fordi `?session=` finnes i WooCommerce, kan **et lekket Cart-Token alltid brukes
til å kopiere kurven**, også uten vår mu-plugin. Vårt endepunkt øker derfor ikke angrepsflaten; tokenet
skal uansett behandles som en hemmelighet (httpOnly-cookie, aldri logget).

### 3.7 Forskjeller mellom 10.6.2 (live) og 11.2.1

- `JsonWebToken.php` er identisk.
- 10.6.2: `CartTokenUtils::get_cart_token_payload()` leser payload uten å sjekke signaturen, og
  `SessionHandler::init_session_from_token()` stoler på at kalleren har validert (10.6.2
  `SessionHandler.php:56-57`). 11.x validerer begge steder («Verifies the signature here rather than trusting
  the caller», 11.2.1 `SessionHandler.php:59-77`). Mu-pluginen validerer alltid selv før payload leses.
- 10.6.2 leser Cart-Token fra `$request->get_header()` i kurvrutene, 11.x fra den ytre HTTP-headeren
  (11.2.1 `AbstractCartRoute.php:257-270`).
- Anbefaling: test spiken på 10.6.2 (som produksjon) **og** på nyeste 11.x, og oppgrader produksjonen før
  lansering.

## 4. Valgene i kurvoverføringen

### 4.1 Kopi gjennom kurv-API-et, ikke «adopsjon» av Store API-økten

Alternativet var å la nettleserens WooCommerce-cookie peke på samme økt (`t_…`) som Next.js bruker. Det er
forkastet fordi:

- **To skrivere på samme rad.** Store API og den vanlige økten skriver hele raden hver gang. Kassen
  lagrer adresse, valgt frakt og Vipps-øktdata; et samtidig kall fra Next.js kan skrive over dem (sist
  skriver vinner).
- **Mellomlageret.** Den vanlige økten leser via objektmellomlageret, Store API skriver forbi det
  (3.2). Med Redis ville nettleseren sett en gammel kurv.
- **Persondata.** Adressen kunden skriver i kassen ville blitt lesbar for Next.js-serveren via tokenet.
- **Innlogging.** Når en gjest logger inn, flytter WooCommerce økten til bruker-ID-en og sletter
  gjesteraden (`class-wc-session-handler.php:218-245, 574-576`). Next.js-tokenet ville pekt på en tom økt.
- **Cookien** må forfalskes med WooCommerce sin interne hash og en beskyttet egenskap (`_customer_id`).

Kopien gir to kurver etter overføringen. Det er akseptert: Next.js-kurven er fasit fram til «Gå til
kassen», en ny overføring erstatter alltid, og når ordren er betalt tømmer mu-pluginen Store API-kurven –
bare hvis den er uendret siden overføringen (fingeravtrykk), så en kunde som har handlet videre i Next.js
ikke mister kurven.

Kopien går gjennom `WC_Cart::empty_cart()` og `WC_Cart::add_to_cart( produkt, antall, variation_id,
attributter )` og `apply_coupon()` i stedet for å kopiere rå øktdata. Da valideres varene mot dagens lager
og pris, og krokene til andre utvidelser kjøres (Vipps Checkout avbryter en gammel Vipps-økt, rabattregler
regner på nytt). Tilleggsdata fra utvidelser (`cart_item_data`) kopieres ikke; Store API legger selv ikke
inn noe der (`CartAddItem.php:116-125`), og utvidelsene legger sitt inn på nytt ved `add_to_cart()`.

### 4.2 Erstatt, ikke slå sammen – også for innloggede kunder

Kunden trykker «Gå til kassen» med en bestemt kurv foran seg, og i Vipps Checkout kan hun betale på
sekunder. En sammenslåing med en lagret kurv fra et tidligere besøk (annen enhet, uker gammel) ville gitt
en ordre med varer og et beløp hun ikke så. Derfor:

- `empty_cart( true )` tømmer også den lagrede kurven (`_woocommerce_persistent_cart_*`).
- Logger en gjest inn i kassen etter overføringen, ville WooCommerce slått sammen den lagrede kurven med
  den overførte (`includes/wc-user-functions.php:1097-1101`, `includes/class-wc-cart-session.php:126-136`).
  Mu-pluginen fjerner flagget `_woocommerce_load_saved_cart_after_login` på `wp_login` (prio 20) når kurven
  nettopp er overført.
- Samme valg som WooCommerce selv gjør med `?session=` for innloggede (kommentar i
  `class-wc-session-handler.php:114`).

Merk: Next.js vet ikke om kunden er innlogget i WooCommerce. Gir rabattreglene andre priser til innloggede,
kan beløpet i kassen avvike fra skuffen (se risiko R10).

### 4.3 Krok og sikkerhet

- `wp_loaded`, prioritet 20: `WC()->session` er laget på `init` (prio 0, `includes/class-woocommerce.php:341, 1013-1015, 1245-1254`)
  og kurven er lastet fra økten på `wp_loaded` prio 10 (`includes/class-wc-cart-session.php:81`).
- Bare `GET`, ikke admin, AJAX, cron eller REST.
- Målet for videresendingen er alltid `wc_get_checkout_url()` eller `wc_get_cart_url()` med
  `wp_safe_redirect` – ingen adresse fra forespørselen brukes (ingen åpen videresending).
- Svaret har `Cache-Control: no-store` (via `nocache_headers()`), `Referrer-Policy: no-referrer` og
  `X-Robots-Tag: noindex`.
- Tokenet logges aldri. Loggen (`WooCommerce → Status → Logger`, kilde `regina-headless`) får bare en kort
  grunn: `format`, `header`, `payload`, `utlopt`, `signatur`, `ikke_gjest`, `woocommerce`.
- Bare gjesteøkter (`t_…`) kan overføres. En innlogget kundes økt flyttes aldri til en annen nettleser.
- Store API-raden leses rett fra databasen og avserialiseres med `allowed_classes => false`.

## 5. Kontrakter

### 5.1 Next.js-serveren ↔ Store API

Base: `{WOO_URL}/wp-json/wc/store/v1`. Bare fra serveren, aldri fra nettleseren.

**Headere Next.js sender:**

| Header                              | Når                                        |
| ----------------------------------- | ------------------------------------------ |
| `Cart-Token: <token>`               | Alle kall unntatt det aller første         |
| `Content-Type: application/json`    | `POST`                                     |
| `Accept: application/json`          | Alle                                       |
| `User-Agent: regina-next/<versjon>` | Alle (gjør kallene lette å finne i logger) |

Sendes **ikke**: `Nonce` (unødvendig med Cart-Token, 3.4), `Cookie`, `X-WP-Nonce`, `Origin`. Svarets
`Set-Cookie` fra WooCommerce sendes aldri videre til nettleseren.

**Første token:** `GET /cart` uten `Cart-Token` → les `Cart-Token` fra svaret. Gjøres først når kunden
legger noe i kurven, ikke for hver besøkende.

**Cookie på Next.js-domenet:** navn `regina_kurv`, verdi = Cart-Token, `HttpOnly; Secure; SameSite=Lax;
Path=/; Max-Age=172800`. Oppdateres med `Cart-Token` fra **hvert** svar (nytt `exp` hver gang, 3.1).

**Utløpt eller ugyldig token:** `GET` gir stille en ny, tom kurv med nytt token (3.2) – lagre det og vis
tom kurv. `POST` gir 401 `woocommerce_rest_missing_nonce` – hent nytt token med `GET /cart` og prøv én gang
til. Raden i databasen utløper på `exp` fra tokenet som ble brukt ved siste endring; regn med at kurven
lever cirka 48 timer etter siste endring.

**Kall:**

| Handling         | Kall                                                                                                                    |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Les kurven       | `GET /cart`                                                                                                             |
| Legg til         | `POST /cart/add-item` `{ "id": 6225, "quantity": 1 }`                                                                   |
| Legg til variant | `POST /cart/add-item` `{ "id": 10138, "quantity": 1, "variation": [{ "attribute": "pa_farge", "value": "original" }] }` |
| Endre antall     | `POST /cart/update-item` `{ "key": "<items[].key>", "quantity": 2 }`                                                    |
| Fjern            | `POST /cart/remove-item` `{ "key": "<items[].key>" }`                                                                   |
| Kupong           | `POST /cart/apply-coupon` `{ "code": "…" }`, `POST /cart/remove-coupon` `{ "code": "…" }`                               |

For varianter: `id` = variasjons-ID-en, `attribute` = `taxonomy` fra foreldreproduktets `attributes[]`
(f.eks. `pa_farge`; for lokale attributter `name`), `value` = verdien fra foreldreproduktets
`variations[].attributes[].value` (slug). Eksempelet er Suavina Lip Balm (forelder 10135, taksonomi
`pa_farge`) i utdraget fra Store API. Beløp i svaret er tekst i minste enhet og lagres som heltall øre.

**Hastighetsbegrensning:** Store API sin begrensning er av som standard (`src/StoreApi/Utilities/RateLimits.php:22`)
og teller per IP for gjester (`Authentication.php:271-289`). Alle kall kommer fra Next.js-serveren; slås
begrensningen på, deler alle kunder én kvote. Den må ikke slås på uten en plan for dette.

### 5.2 Overføringen: `GET {WOO_URL}/?regina_kurv=<Cart-Token>`

Next.js: «Gå til kassen» er et `<form method="post">` til en route handler (ikke en `<Link>`, så
forhåndslasting aldri treffer den). Handleren leser cookien, kaller `GET /cart` (sjekker at `items_count >
0`, lagrer ferskt token) og svarer `303 See Other` med `Location: {WOO_URL}/?regina_kurv=<encodeURIComponent(token)>`,
`Cache-Control: no-store` og `Referrer-Policy: no-referrer`. Tokenet skrives aldri i HTML eller JavaScript.

WooCommerce (mu-pluginen):

| Situasjon                                                        | Svar                                                                                                                                              |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gyldig token, alle varer lagt til                                | `302` → `wc_get_checkout_url()` (Vipps Checkout-siden når den er på)                                                                              |
| Gyldig token, noen varer feilet (utsolgt, slettet, ikke kjøpbar) | `302` → handlekurven; WooCommerce sin melding per vare + «Noen av varene kunne ikke legges i handlekurven. Se over kurven før du går til kassen.» |
| Gyldig token, ingen varer kunne legges til                       | `302` → handlekurven, «Ingen av varene kunne legges i handlekurven.»                                                                              |
| Ugyldig, endret eller utløpt token, eller ikke en gjesteøkt      | `302` → handlekurven, «Vi fant ikke handlekurven din. Lenken kan være utløpt. Legg varene i handlekurven på nytt.» Nettleserens kurv røres ikke.  |
| Gyldig token, tom eller slettet kurv                             | `302` → handlekurven, «Handlekurven din er tom eller har utløpt. Legg varene i handlekurven på nytt.»                                             |
| Ikke `GET` (f.eks. `HEAD` fra lenkesjekkere)                     | Parameteren ignoreres                                                                                                                             |

Det som overføres: hver linjes `product_id`, `variation_id`, `variation` (`attribute_pa_* => slug`) og
`quantity`, og `applied_coupons`. Kundedata (`customer`), frakt og utkast til ordre overføres ikke.

Etter ordren: ordren får metafeltet `_regina_kurv_kilde` (sesjonsnøkkel og fingeravtrykk, aldri tokenet).
Når status blir `processing`, `completed` eller `on-hold` (filter `regina_kurv_rydd_statuser`), slettes
Store API-raden hvis kurven er uendret, og metafeltet fjernes. Neste `GET /cart` fra Next.js gir da en tom
kurv.

### 5.3 `GET /wp-json/regina/v1/kampanjer`

Offentlig. Publiserte kampanjebannere som er aktive nå eller starter innen 14 dager, sortert etter start
(høyst 20).

```json
[
  {
    "id": 4512,
    "tekst": "Eksempeltekst – skrives av butikken",
    "lenke": "/merker",
    "lenketekst": "Se merkene",
    "start": "2026-12-01T10:00:00+01:00",
    "slutt": "2026-12-24T14:00:00+01:00"
  }
]
```

- `id`: heltall. `tekst`: ren tekst, høyst 200 tegn.
- `lenke`: `string | null` – en sti på den nye flaten (begynner med `/`) eller en `http(s)`-adresse.
- `lenketekst`: `string | null` – `null` når lenke eller lenketekst mangler.
- `start`, `slutt`: ISO 8601 med tidssone-offset i butikkens tidssone (`wp_date( 'c' )`). Begge finnes alltid.
- Tom liste `[]` når ingen kampanjer er aktuelle.

Regler i admin (Kampanjebannere i menyen): tittelen er internt navn. Uten tekst eller sluttidspunkt, med
slutt før start eller slutt i fortiden lagres kampanjen som kladd med en feilmelding – også ved
hurtigredigering, masseredigering og WP-CLI (`wp_insert_post_data`). Tom start betyr «fra publisering».

Flaten skal selv vise en kampanje bare når `start <= nå < slutt`, og la mellomlagringen utløpe ved neste
`start` eller `slutt` i listen (høyst én time). Mu-pluginen ber i tillegg om revalidering ved lagring,
sletting og statusendring, og planlegger revalidering (WP-Cron) når en kampanje kommer inn i vinduet,
starter og slutter.

### 5.4 `GET /wp-json/regina/v1/butikk`

Offentlig.

```json
{
  "apningstider": [
    { "dager": "Mandag–fredag", "tid": "10–18" },
    { "dager": "Lørdag", "tid": "10–16" }
  ],
  "bekreftet": false,
  "oppdatert": "2026-10-27T14:05:12+01:00"
}
```

Tidene i eksempelet er plassholdere – Reginas åpningstider er ikke kjent. `oppdatert` er `null` før første
lagring og endres bare når innholdet endres. `bekreftet` er alltid `false` når listen er tom. **Flaten viser
tidene bare når `bekreftet` er `true`.** Redigeres under Innstillinger → Regina butikkinfo (rettighet
`manage_woocommerce`, så også butikkansvarlig).

### 5.5 `POST /wp-json/regina/v1/varsle`

```http
POST /wp-json/regina/v1/varsle
Content-Type: application/json

{ "produkt": 10135, "variant": 10146, "epost": "navn@eksempel.no" }
```

| Svar  | Kropp                                                                              | Når                                                                             |
| ----- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `201` | `{ "ok": true }`                                                                   | Lagret – eller fantes allerede for samme e-post og vare (røper ingenting)       |
| `400` | `{ "feil": "Skriv inn en gyldig e-postadresse." }`                                 | Ugyldig e-post                                                                  |
| `400` | `{ "feil": "Ugyldig produkt." }` / `"Ugyldig variant."` / `"Ugyldig forespørsel."` | Feil type, manglende felt eller ugyldig JSON                                    |
| `404` | `{ "feil": "Fant ikke produktet." }` / `"Fant ikke varianten."`                    | Finnes ikke, ikke publisert, skjult, eller varianten hører ikke til produktet   |
| `409` | `{ "feil": "Varen er på lager nå, så du kan kjøpe den med en gang." }`             | Varen (eller varianten) er på lager eller kan restbestilles                     |
| `429` | `{ "feil": "For mange forsøk. Prøv igjen om noen minutter." }`                     | Mer enn 5 forsøk per 10 minutter fra samme IP (filter `regina_varsling_grense`) |
| `500` | `{ "feil": "Vi kunne ikke lagre varselet akkurat nå. Prøv igjen senere." }`        | Databasefeil                                                                    |

- `produkt` er hovedproduktet (enkelt eller variabelt). `variant` er valgfri; uten variant gjelder varselet
  hele det variable produktet (sendes når første variant er tilbake).
- Lagres som privat innlegg `regina_varsling` med `_regina_epost` (små bokstaver), `_regina_produkt`,
  `_regina_variant` (0 = ingen), `_regina_tidspunkt` (ISO 8601) og `_regina_samtykke` (teksten kunden
  sa ja til, versjonert). Synlig under WooCommerce → Lagervarsler.
- IP-en lagres ikke; telleren er en transient med HMAC av IP-en som nøkkel. Kalles endepunktet via
  Next.js-serveren, settes `REGINA_TILLIT_PROXY` til serverens IP, og Next.js sender kundens IP som siste
  ledd i `X-Forwarded-For`. Ellers deler alle kunder én kvote.
- **Utsending er AV.** Krokene `woocommerce_product_set_stock_status` og `woocommerce_variation_set_stock_status`
  (`includes/data-stores/class-wc-product-data-store-cpt.php:949, 960`) legger utsending i kø (Action
  Scheduler) bare når `regina_varsling_send` er `yes`. Teksten i `varsling.php` er et utkast som Flyd må
  godkjenne. Etter utsending slettes e-postadressen fra varselet; alle varsler slettes etter ett år.
- Flaten må vise teksten kunden samtykker til ved skjemaet. Endres teksten, økes versjonen i
  `REGINA_VARSLING_SAMTYKKE`.

### 5.6 Revalidering og webhooks

**Kampanjer og butikkinfo (mu-pluginen → Next.js):**

```http
POST {REGINA_REVALIDATE_URL}
Content-Type: application/json
X-Regina-Signature: base64( HMAC-SHA256( <rå kropp>, REGINA_REVALIDATE_SECRET ) )

{"tags":["kampanjer"]}
```

Kroppen er `{"tags":["kampanjer"]}`, `{"tags":["butikk"]}` eller begge i én liste hvis begge endret seg i
samme forespørsel. Kallene samles og sendes én gang på `shutdown` (timeout 5 s); feil logges uten
hemmeligheter og stopper ikke lagringen. Er en av konstantene ikke satt, sendes ingenting.

Next.js (`/api/revalidate`): les rå kropp med `await request.text()`, regn ut HMAC-en, sammenlign med
`crypto.timingSafeEqual` (sjekk lik lengde først), svar 401 ved avvik. Godta bare taggene `kampanjer` og
`butikk`, og kall `revalidateTag( tag, 'max' )` (Next.js 16: ett-arguments-formen er foreldet, se
`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidateTag.md`). Signaturen dekker
ikke tidspunkt, så et kall kan spilles av på nytt; det er ufarlig fordi revalidering er idempotent.
Signaturen er kryssjekket mot Node `crypto.createHmac( 'sha256', … ).digest( 'base64' )`.

**Produkter (WooCommerce → Next.js):** WooCommerce sine egne webhooks, ikke mu-pluginen. I WooCommerce →
Innstillinger → Avansert → Webhooks, én webhook per emne:

| Felt          | Verdi                                                                    |
| ------------- | ------------------------------------------------------------------------ |
| Navn          | `Next.js – produkt opprettet` / `oppdatert` / `slettet`                  |
| Status        | Aktiv                                                                    |
| Emne          | `product.created`, `product.updated`, `product.deleted`                  |
| Leverings-URL | `https://<flaten>/api/woo-webhook`                                       |
| Hemmelighet   | Lang tilfeldig verdi, også lagt i Next.js-miljøet (`WOO_WEBHOOK_SECRET`) |
| API-versjon   | WP REST API Integration v3                                               |

- Signatur: `X-WC-Webhook-Signature = base64( HMAC-SHA256( <rå kropp>, hemmelighet ) )`
  (`includes/class-wc-webhook.php:482-487`). Emnet står i `X-WC-Webhook-Topic` (`362-368`).
- Når webhooken lagres, sendes et ping med kroppen `webhook_id=<id>` **uten** signatur (`644-648`). Svar
  200 uten å gjøre noe.
- Leveringen går i bakgrunnen via Action Scheduler (`includes/wc-webhook-functions.php:26`), så det kan ta
  litt tid. Etter mer enn 5 feil på rad slår WooCommerce av webhooken (`class-wc-webhook.php:597`) – svar
  raskt med 200.
- `product.updated` utløses også når lageret endres av en ordre: `wc_update_product_stock()` lagrer
  produktet (`includes/wc-stock-functions.php`). Varianter gir egne kall.
- Next.js: verifiser som over, `revalidateTag( 'produkter', 'max' )` og `revalidateTag( 'produkt-<id>', 'max' )`.

## 6. Konstanter i `wp-config.php`

Legges over linjen `/* That's all, stop editing! */`. Hemmelighetene genereres med `openssl rand -base64 32`
og legges aldri i git.

```php
define( 'REGINA_REVALIDATE_URL', 'https://<flaten>/api/revalidate' );
define( 'REGINA_REVALIDATE_SECRET', '<samme verdi som REGINA_REVALIDATE_SECRET i Next.js>' );
define( 'REGINA_TILLIT_PROXY', '<Next.js-serverens utgående IP>' ); // bare hvis /varsle kalles via Next.js
define( 'REGINA_FRONTEND_URL', 'https://<flaten>' );               // lenken i lagervarsel-e-posten
```

Cart-Token trenger ingen ny konstant: hemmeligheten er WordPress sine salter (`AUTH_KEY`, `AUTH_SALT`).
**Byttes saltene, blir alle Cart-Token ugyldige** (og alle innlogginger) – kundene får en tom kurv i Next.js.

## 7. Installasjon i staging

1. Kopier `wordpress/mu-plugins/regina-headless.php` og mappen `wordpress/mu-plugins/regina-headless/`
   til `wp-content/mu-plugins/`. Kontroller under Utvidelser → «Må brukes» at «Regina headless» står der.
2. Legg inn konstantene (kapittel 6).
3. **Unnta `regina_kurv` fra sidemellomlagring** (WP Rocket, LiteSpeed, Varnish, Cloudflare): en
   forespørsel med `?regina_kurv=` må alltid nå PHP. Ellers lander kunden på en mellomlagret forside med
   tokenet i adressen.
4. Unnta `regina_kurv=` fra tilgangslogger, eller sørg for at loggene slettes raskt (risiko R6).
5. Lag webhookene (5.6) mot Next.js i staging.
6. Behold `regina_varsling_send` av. Bruk en e-postfanger (f.eks. WP Mail SMTP mot Mailtrap) i staging, så
   ingen e-post går til ekte kunder i en kopi av produksjonsdata.

## 8. Testoppskrift for spiken i staging

**Forutsetninger.** Staging-kopi av nettbutikken med samme utvidelser som produksjonen. WooCommerce i
samme versjon som produksjonen (10.6.2); gjenta til slutt på nyeste 11.x. Vipps-pluginen i testmodus med
testnøkler fra Vipps MobilePay-portalen (testbruker i Vipps MT-appen). Diller koblet til en
testbutikk/testmiljø hos Diller – ikke produksjonsbutikken, så testmedlemmer ikke havner i Reginas kundeklubb.
Posten/Bring og rabattregler som i produksjonen, men uten ekte bestilling av frakt. Et enkelt produkt og et
variabelt produkt på lager, en testkupong. Notér om produksjonen bruker objektmellomlager (Redis); test i
så fall med det på.

Bruk `curl` mot staging (eller Next.js i staging). `$W` = staging-adressen.

1. **Første token, uten Nonce.**
   `curl -s -D - -o /dev/null "$W/wp-json/wc/store/v1/cart" | grep -i '^cart-token'` → sett `T`.
   Observer: 200 og en `Cart-Token`-header.
2. **Enkel vare.**
   `curl -s -D h1.txt -H "Cart-Token: $T" -H 'Content-Type: application/json' -d '{"id":<enkel>,"quantity":1}' "$W/wp-json/wc/store/v1/cart/add-item"`
   Observer: 201 uten Nonce. Sett `T` til ny `Cart-Token` fra `h1.txt`.
3. **Variant.** `-d '{"id":<variasjon>,"quantity":1,"variation":[{"attribute":"pa_<attributt>","value":"<slug>"}]}'`
   Observer: 201, `items[]` har to linjer, varianten med riktig `variation`.
4. **Kupong (valgfritt).** `POST /cart/apply-coupon {"code":"<testkupong>"}`. Noter `totals` fra `GET /cart`.
5. **Overføring som gjest.** Åpne `"$W/?regina_kurv=$T"` i et nytt privat vindu. Observer:
   - én `302` rett til kassesiden (Vipps Checkout-siden), uten `regina_kurv` i adressefeltet;
   - kurven har begge varene med riktig antall og riktig variant, og kupongen;
   - delsummen er den samme som `totals` i steg 4 (avvik må forklares av frakt eller rabattregler);
   - `Referrer-Policy: no-referrer` og `Cache-Control: no-store` på 302-svaret (nettleserens utviklerverktøy);
   - WooCommerce → Status → Logger, kilde `regina-headless`: ingen tokener.
6. **Diller.** Observer at Diller-innmeldingen (avkrysning for kundeklubben) vises i kassen. Kryss av.
7. **Betal** med Vipps i testmodus. Observer:
   - ordren i admin har to linjer, varianten med attributt, riktige beløp og frakt;
   - status `processing` (eller det Vipps setter) og Vipps-transaksjon i testportalen;
   - Diller: medlemmet og kjøpet er registrert i Dillers testmiljø;
   - `curl -H "Cart-Token: $T" "$W/wp-json/wc/store/v1/cart"` gir nå en tom kurv (opprydding);
   - metafeltet `_regina_kurv_kilde` er borte fra ordren.
8. **Fram og tilbake.** Ny kurv (steg 1–3), overfør, gå tilbake uten å betale, legg til en vare via
   Store API med samme token, overfør på nytt. Observer: kassen har den nye kurven (ikke den gamle), og
   Vipps-loggen viser at den påbegynte Vipps Checkout-økten ble avbrutt («cart changed while session … in
   progress»).
9. **Innlogget kunde.** Logg inn som testkunde med en annen vare i den lagrede kurven. Overfør. Observer:
   bare de overførte varene (erstattet), også etter utlogging og ny innlogging.
10. **Innlogging i kassen.** Overfør som gjest, logg inn i kassen som en kunde med lagret kurv. Observer:
    ingen gamle varer slås inn.
11. **Feiltilfeller.** Endre ett tegn i tokenet; bruk et token for en tom kurv; sett en vare utsolgt mellom
    steg 3 og 5; send `curl -I "$W/?regina_kurv=$T"` (HEAD). Observer: handlekurvsiden med riktig norsk
    melding, nettleserens kurv uendret ved ugyldig token, HEAD ignoreres, ingenting i loggen utover grunnkoden.
12. **Mellomlagring.** Gjenta steg 5 med sidemellomlagringen slik den er i produksjonen.
13. **Kampanje.** Lag et kampanjebanner uten slutt og trykk Publiser → kladd med melding. Sett slutt →
    publisert, `GET /wp-json/regina/v1/kampanjer` viser den med offset, Next.js mottar
    `{"tags":["kampanjer"]}` med gyldig `X-Regina-Signature`. Hurtigrediger en kampanje uten slutt til
    «Publisert» → forblir kladd.
14. **Butikkinfo.** Lagre tider uten avkrysning → `bekreftet: false`; kryss av → `true`, revalidering
    `{"tags":["butikk"]}`.
15. **Varsle.** Prøv svarene i 5.5 (gyldig, ugyldig e-post, på lager, feil variant, 6 forsøk på rad).
    Sett varen på lager med utsending av → ingen e-post. Slå på i staging, sett på lager igjen → én e-post i
    fangeren, e-postadressen slettet fra varselet. Slå av igjen.
16. **Produktwebhook.** Endre en pris i staging → Next.js mottar `product.updated` med gyldig signatur.

## 9. Godkjenningskriterium

**En testordre med to varer, der den ene er en variant, går gjennom Vipps i testmodus, og
Diller-innmeldingen vises i kassen.** I tillegg må steg 5, 7 og 8 vise det de skal.

Inntil dette er kjørt og dokumentert i staging, er spiken **ikke godkjent**, og flaten skal fortsatt ikke
sende kunder til produksjonens kasse.

## 10. Risikoer og åpne spørsmål

| #   | Risiko                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Tiltak                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Diller vises trolig ikke i Vipps Checkout.** Diller Loyalty 2.5.9 legger avkrysningen i den klassiske kassen (`woocommerce_after_checkout_billing_form` eller `woocommerce_checkout_terms_and_conditions`), i Klarna og i Vipps **Express** (`woo_vipps_express_checkout_orderspec_form`) – `includes/class-diller-loyalty.php:488-515`. Vipps Checkout-siden kaller ingen av disse, og ordren lages i et AJAX-kall der Dillers `$_POST`-felter mangler (`class-diller-loyalty-woocommerce.php:1310-1326`; Vipps `WC_Gateway_Vipps.class.php:3891-3965`). Dette gjelder uavhengig av headless. | Avklar med Diller og Marius før staging-testen. Mulige veier: Dillers egen støtte for Vipps/Kustom Checkout; innmelding på takkesiden (Diller viser allerede en «bli medlem»-lenke der, `class-diller-loyalty-woocommerce.php:917-940, 1881-1896`); Vipps ePayment i den klassiske kassen i stedet for Vipps Checkout; eller innmelding i Next.js mot Dillers API. Godkjenningskriteriet kan ikke oppfylles uten et av disse. |
| R2  | **Hvilken Vipps-plugin er i bruk?** Dagens butikk eksponerer REST-navnerommet `amendo-vipps/v2` (observert med lesende kall 26.10.2026). «Pay with Vipps and MobilePay for WooCommerce» (WP Hosting/Everyday, 6.3.4) bruker `woo-vipps/v1` (`payment/Vipps.class.php:41-42`). Det tyder på Amendos plugin, ikke den oppdraget nevner.                                                                                                                                                                                                                                                            | Avklar med Marius. Funnene om Vipps i dette dokumentet gjelder `woo-vipps` 6.3.4. Med Amendo må steg 8 (avbrutt Vipps-økt) og R1 vurderes på nytt.                                                                                                                                                                                                                                                                            |
| R3  | Vipps MobilePay har solgt Checkout-produktet til Kustom; «Vipps MobilePay Checkout» blir «Kustom Checkout» (`woo-vipps/readme.txt:81-83`).                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Avklar med Marius/Vipps hva Regina har avtale om, og om oppsettet endres før lansering.                                                                                                                                                                                                                                                                                                                                       |
| R4  | Produksjonen kjører WooCommerce 10.6.2, der Store API stoler mer på kalleren (3.7).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Test på begge versjoner; oppgrader før lansering.                                                                                                                                                                                                                                                                                                                                                                             |
| R5  | Sidemellomlager eller CDN som ignorerer ukjente parametere, gjør at overføringen aldri når PHP.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Unntak (kapittel 7) og steg 12.                                                                                                                                                                                                                                                                                                                                                                                               |
| R6  | Tokenet står i adressen i én forespørsel: i tilgangslogger (webserver, CDN, Next.js sin 303) og ev. i historikken. Et lekket token gir tilgang til kurven i 48 timer (lese, endre, kopiere med WooCommerces egen `?session=`). Ingen kundedata ligger i Store API-økten.                                                                                                                                                                                                                                                                                                                         | Logg-unntak eller kort lagringstid. Ved behov senere: engangskode med kort levetid i stedet for tokenet i adressen.                                                                                                                                                                                                                                                                                                           |
| R7  | Kurven lever cirka 48 timer etter siste endring (3.1, 5.1).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Flaten håndterer tom kurv og 401 og forklarer det for kunden.                                                                                                                                                                                                                                                                                                                                                                 |
| R8  | To kurver etter overføringen: endringer på WooCommerce sin handlekurvside går ikke tilbake til Next.js.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Next.js er fasit; ny overføring erstatter; lenker fra WooCommerce-kurven tilbake til flaten.                                                                                                                                                                                                                                                                                                                                  |
| R9  | Store API sin hastighetsbegrensning teller per IP; alle kall kommer fra Next.js-serveren.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Hold den av (standard), eller lag en løsning før den slås på.                                                                                                                                                                                                                                                                                                                                                                 |
| R10 | Rabattregler (Woo Discount Rules Pro) og frakt kan gi andre beløp i kassen enn i skuffen, særlig for innloggede kunder eller når en vare feiler ved overføringen. `WC_Cart::add_to_cart()` kjører ikke `woocommerce_add_to_cart_validation` (Store API gjorde det da varen ble lagt i, `CartController.php:335`).                                                                                                                                                                                                                                                                                | Sammenlign beløp i steg 5; vis frakt som «beregnes i kassen» i flaten.                                                                                                                                                                                                                                                                                                                                                        |
| R11 | Andre utvidelser kan legge egne data på kurvlinjer (`cart_item_data`); de kopieres ikke, men legges inn på nytt av utvidelsen.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Kontroller i staging med de faktiske utvidelsene (WoodMart, rabattregler, Posten/Bring).                                                                                                                                                                                                                                                                                                                                      |
| R12 | Lager deles trolig med butikkens kasse (`wc/pos/v1`, ikke verifisert); utsolgt kan oppstå mellom skuff og kasse.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Overføringen og WooCommerce stopper utsolgte varer med melding (steg 11).                                                                                                                                                                                                                                                                                                                                                     |
| R13 | Bytte av WordPress-salter gjør alle Cart-Token ugyldige.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Dokumentert i kapittel 6; tom kurv håndteres (R7).                                                                                                                                                                                                                                                                                                                                                                            |
| R14 | Lagervarsel-e-posten er et utkast, og samtykketeksten er ikke skrevet i flaten ennå.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Utsending er av til Flyd har godkjent tekst og samtykke.                                                                                                                                                                                                                                                                                                                                                                      |
| R15 | Merkene ligger i Perfect WooCommerce Brands (`pwb-brand`, `wp/v2/pwb-brand`), ikke i WooCommerce Brands. Påvirker ikke kurven, men katalogen og eventuelle webhooks for merker.                                                                                                                                                                                                                                                                                                                                                                                                                  | Avklar med Marius om det skal byttes; flaten leser `pwb-brand` i dag.                                                                                                                                                                                                                                                                                                                                                         |

## 11. Hvis spiken feiler

Spiken feiler hvis kurven ikke kan overføres pålitelig (steg 5, 8–10) eller hvis Vipps/Diller ikke virker i
kassen etter overføringen. Er det bare Diller (R1) som mangler, er det et eget spørsmål som gjelder alle
alternativene.

**(a) Klassisk, blokkbasert WooCommerce-tema med komponentene portet.** Behold WordPress som flate:
et eget blokktema (eller barnetema) der flatens komponenter (header, megameny, produktkort, filtre,
produktside, skuff) portes til blokker og PHP-maler, med samme tokens fra `src/styles/tokens.css`. Kurv,
kasse, Vipps og Diller fungerer da som i dag, uten overføring. Kostnad: mer PHP/blokkarbeid, mindre frihet i
ytelse og bevegelse; React-komponentene kan delvis brukes som blokker.

**(b) Egen kasse via Store API `/checkout`** – bare hvis Vipps-pluginen støtter det. Funn i
«Pay with Vipps and MobilePay for WooCommerce» 6.3.4:

- **Vipps ePayment støtter blokk-kassen, og dermed Store API `/checkout`:** pluginen registrerer en
  blokkbetalingsmetode og behandler betalingen på `woocommerce_rest_checkout_process_payment_with_context`
  (`payment/Blocks/Payment/Vipps.class.php:11-57, 119-140`). Svaret fra `/checkout` gir en
  videresendingsadresse til Vipps; kunden kommer tilbake til WooCommerce sin takkeside.
- **Vipps Checkout (Kustom) støtter det ikke:** den er en egen side som erstatter WooCommerce sin kasseside
  (`payment/VippsCheckout.class.php:1351-1392`, filter `woocommerce_get_checkout_page_id`), med adresse og frakt
  inne i Vipps-vinduet. Den kan ikke kjøres fra Next.js via `/checkout`.
- Med (b) må flaten selv lage adresseskjema, fraktvalg (Posten/Bring via Store API sine fraktvalg) og
  vilkår, og Diller må integreres via API. `/checkout` krever Cart-Token eller Nonce
  (https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/checkout/). WooCommerce har en
  egen hastighetsbegrensning for `/checkout` (`Authentication.php:189-209`) som også teller per IP.
- Gjelder ikke Amendos plugin (R2) før den er undersøkt.

Anbefalt rekkefølge hvis spiken feiler på overføringen: prøv først WooCommerce sin innebygde `?session=` og
`/checkout-link/` i staging (3.6) for å skille feil i mu-pluginen fra feil i oppsettet; deretter (a). (b)
bare hvis Regina går over til Vipps ePayment i stedet for Vipps Checkout.

## 12. Observasjoner fra dagens butikk – avklares med Marius

Fra lesende kall 26.10.2026 (konseptfasen; dokumentet er erstattet av dette), ingen nye kall mot produksjonen:

- WooCommerce **10.6.2**, WordPress 7.1, tema WoodMart 8.3.8.
- Vipps-navnerommet er `amendo-vipps/v2` – trolig Amendos plugin, ikke «Pay with Vipps and MobilePay for
  WooCommerce» (`woo-vipps/v1`). Hvilken plugin og hvilket produkt (Vipps Checkout/Kustom, ePayment eller
  Express) er i bruk?
- Merkene ligger i **Perfect WooCommerce Brands** (`pwb-brand`), ikke i WooCommerce Brands.
- Frakt via «Posten Bring Checkout», rabatter via Woo Discount Rules (Pro), mulig WooCommerce POS
  (`wc/pos/v1`).
- Er Diller koblet til nettbutikken i dag, og hvor vises innmeldingen nå?
- Finnes det et objektmellomlager (Redis) og et sidemellomlager/CDN i produksjonen?

## 13. Filer

| Fil                                                       | Innhold                                                              |
| --------------------------------------------------------- | -------------------------------------------------------------------- |
| `wordpress/mu-plugins/regina-headless.php`                | Laster resten; konstantene er beskrevet øverst                       |
| `wordpress/mu-plugins/regina-headless/kurvtoken.php`      | `Regina_Kurvtoken`: samme validering som WooCommerce, uten WordPress |
| `wordpress/mu-plugins/regina-headless/kurvoverforing.php` | `?regina_kurv=`, opprydding etter ordre, innlogging                  |
| `wordpress/mu-plugins/regina-headless/kampanjer.php`      | `regina_kampanje` og `GET regina/v1/kampanjer`                       |
| `wordpress/mu-plugins/regina-headless/butikkinfo.php`     | Innstillinger → Regina butikkinfo og `GET regina/v1/butikk`          |
| `wordpress/mu-plugins/regina-headless/varsling.php`       | `regina_varsling` og `POST regina/v1/varsle`                         |
| `wordpress/mu-plugins/regina-headless/revalidering.php`   | `X-Regina-Signature`-kall til Next.js                                |
| `wordpress/mu-plugins/regina-headless/felles.php`         | Logging, ISO-tid, IP, `{ feil }`-svar                                |

Kontrollert lokalt (uten WordPress): `php -l` på alle filene; `Regina_Kurvtoken` mot token laget av en
uavhengig Python-implementasjon og en PHP-replika av `JsonWebToken::create()` (gyldig, feil hemmelighet,
utløpt, `exp == nå`, `alg: none`, byttet payload, utfylling, feil format, payload som tall); lesing av en
dobbelt serialisert økt, fingeravtrykk, tidstolking i Europe/Oslo (inkludert sommertid og 31. februar),
rensing av butikkinfo, og `X-Regina-Signature` mot Node `crypto`. Dette erstatter ikke testen i staging.
