<?php
/**
 * Kurvoverføring: Next.js-kurven (Store API + Cart-Token) → kundens vanlige WooCommerce-økt → kassen.
 *
 * GET {WOO_URL}/?regina_kurv=<Cart-Token>
 *
 *  1. Tokenet valideres slik Store API gjør: WooCommerce sin egen CartTokenUtils::validate_cart_token()
 *     (hemmelighet '@' . wp_salt(), HS256, exp), kontrollert mot vår kopi i Regina_Kurvtoken.
 *  2. Store API-økten leses rett fra tabellen woocommerce_sessions (ikke via objektmellomlageret – Store API
 *     sin SessionHandler skriver forbi det, så en mellomlagret kopi kan være gammel).
 *  3. Nettleserens kurv TØMMES og bygges opp igjen med WC_Cart::add_to_cart() – produkt, antall,
 *     variation_id og variasjonsattributter – og kupongene med WC_Cart::apply_coupon().
 *  4. 302 til wc_get_checkout_url() (Vipps Checkout-siden når den er slått på), så tokenet ikke blir
 *     liggende i adressen. Ugyldig/utløpt token eller tom kurv → handlekurvsiden med melding på norsk.
 *
 * Valgene (begrunnet i docs/architecture.md):
 *  - Kopi gjennom kurv-API-et, ikke «adopsjon» av Store API-økten og ikke WooCommerce sin innebygde
 *    ?session=<token>. Gjennom kurv-API-et går krokene som andre utvidelser lytter på (bl.a. Vipps Checkout
 *    sin vipps_cart_changed, rabattregler), og varene valideres mot dagens lager og pris.
 *  - Erstatt, ikke slå sammen – også for innloggede kunder. Kunden betaler for det hun så i kurven.
 *
 * Sikkerhet: målet for videresendingen er alltid WooCommerce sin egen kasse- eller kurvside (ingen åpen
 * videresending), tokenet logges aldri, svaret har Cache-Control: no-store og Referrer-Policy: no-referrer.
 *
 * @package Regina
 */

defined( 'ABSPATH' ) || exit;

define( 'REGINA_KURV_PARAM', 'regina_kurv' );

/*
 * wp_loaded: WooCommerce har opprettet WC()->session (init, prioritet 0) og lastet kurven fra økten
 * (WC_Cart_Session::get_cart_from_session på wp_loaded, prioritet 10). Vi kjører etterpå.
 */
add_action( 'wp_loaded', 'regina_kurv_overfor', 20 );

/**
 * Behandler ?regina_kurv=<Cart-Token>.
 */
function regina_kurv_overfor() {
	// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Tokenet er selv autentiseringen.
	if ( ! isset( $_GET[ REGINA_KURV_PARAM ] ) ) {
		return;
	}
	if ( is_admin() || wp_doing_ajax() || wp_doing_cron() ) {
		return;
	}
	if ( function_exists( 'WC' ) && WC()->is_rest_api_request() ) {
		return;
	}
	$metode = isset( $_SERVER['REQUEST_METHOD'] ) ? strtoupper( sanitize_key( wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) ) : '';
	if ( 'GET' !== $metode ) {
		return;
	}

	// Svaret skal aldri mellomlagres, aldri sende adressen (med tokenet) videre og aldri indekseres.
	nocache_headers();
	header( 'Referrer-Policy: no-referrer' );
	header( 'X-Robots-Tag: noindex, nofollow' );

	if ( ! function_exists( 'WC' ) || ! WC()->cart instanceof WC_Cart || ! WC()->session ) {
		// WooCommerce er ikke klar. Fjern tokenet fra adressen og gå til forsiden.
		wp_safe_redirect( home_url( '/' ), 302, 'Regina Parfymeri' );
		exit;
	}

	$raa   = wp_unslash( $_GET[ REGINA_KURV_PARAM ] );
	$token = is_string( $raa ) ? wc_clean( $raa ) : ''; // Samme rensing som CartTokenUtils::get_request_cart_token().
	// phpcs:enable WordPress.Security.NonceVerification.Recommended

	$sjekk = regina_kurv_valider_token( $token );
	unset( $raa, $token );

	if ( ! $sjekk['gyldig'] ) {
		regina_logg( 'Kurvoverføring avvist (' . $sjekk['grunn'] . ').' );
		regina_kurv_avbryt( 'Vi fant ikke handlekurven din. Lenken kan være utløpt. Legg varene i handlekurven på nytt.' );
	}

	$kilde = regina_kurv_les_okt( $sjekk['okt'] );
	if ( null === $kilde || array() === $kilde['linjer'] ) {
		regina_logg( 'Kurvoverføring: tom eller utløpt kurv.' );
		regina_kurv_avbryt( 'Handlekurven din er tom eller har utløpt. Legg varene i handlekurven på nytt.' );
	}

	$utfall = regina_kurv_bygg_opp( $kilde );

	if ( 0 === $utfall['lagt_til'] ) {
		regina_logg( 'Kurvoverføring: ingen varer kunne legges i kurven.', 'notice' );
		regina_kurv_avbryt( 'Ingen av varene kunne legges i handlekurven.' );
	}

	// Husk hvor kurven kom fra, så Store API-kurven kan tømmes når ordren er betalt (se under). Settes etter
	// empty_cart(), som ellers ville nullstilt den (regina_kurv_glem_kilde).
	WC()->session->set(
		'regina_kurv_kilde',
		array(
			'okt'     => $sjekk['okt'],
			'avtrykk' => $kilde['avtrykk'],
		)
	);

	if ( $utfall['feilet'] > 0 ) {
		// WooCommerce har allerede lagt inn en melding per vare. Vis kurven før kunden betaler.
		regina_logg( 'Kurvoverføring: ' . $utfall['feilet'] . ' av ' . count( $kilde['linjer'] ) . ' varer feilet.', 'notice' );
		wc_add_notice( 'Noen av varene kunne ikke legges i handlekurven. Se over kurven før du går til kassen.', 'notice' );
		wp_safe_redirect( wc_get_cart_url(), 302, 'Regina Parfymeri' );
		exit;
	}

	wp_safe_redirect( wc_get_checkout_url(), 302, 'Regina Parfymeri' );
	exit;
}

/**
 * Validerer Cart-Token slik Store API gjør og gir sesjonsnøkkelen.
 *
 * Primært WooCommerce sin egen CartTokenUtils::validate_cart_token() – da er hemmelighet og algoritme de
 * samme per definisjon, også om WooCommerce endrer dem. Regina_Kurvtoken kjøres alltid i tillegg:
 *  - først som formkontroll, fordi WooCommerce kan kaste TypeError på en misdannet payload;
 *  - deretter som kontroll – er de uenige, logges en advarsel (uten tokenet), og WooCommerce sitt svar gjelder.
 * Finnes ikke CartTokenUtils (gammel WooCommerce), brukes Regina_Kurvtoken alene.
 *
 * @param string $token Cart-Token.
 * @return array{gyldig: bool, grunn: string, okt: string}
 */
function regina_kurv_valider_token( $token ) {
	$struktur = Regina_Kurvtoken::les_struktur( $token );
	if ( ! $struktur['ok'] ) {
		return array(
			'gyldig' => false,
			'grunn'  => $struktur['grunn'],
			'okt'    => '',
		);
	}

	// Samme hemmelighet som CartTokenUtils::get_cart_token_secret().
	$egen = Regina_Kurvtoken::valider( $token, '@' . wp_salt(), time() );

	$wc_klasse = 'Automattic\WooCommerce\StoreApi\Utilities\CartTokenUtils';
	if ( class_exists( $wc_klasse ) && is_callable( array( $wc_klasse, 'validate_cart_token' ) ) ) {
		$wc_gyldig = (bool) call_user_func( array( $wc_klasse, 'validate_cart_token' ), $token );
		if ( $wc_gyldig !== $egen['gyldig'] ) {
			regina_logg( 'Regina_Kurvtoken er uenig med WooCommerce om et Cart-Token (vår grunn: ' . ( '' === $egen['grunn'] ? 'gyldig' : $egen['grunn'] ) . '). WooCommerce sitt svar brukes.', 'warning' );
		}
		if ( ! $wc_gyldig ) {
			return array(
				'gyldig' => false,
				'grunn'  => '' === $egen['grunn'] ? 'woocommerce' : $egen['grunn'],
				'okt'    => '',
			);
		}
		$okt = Regina_Kurvtoken::okt_fra_payload( $struktur['payload'] );
	} else {
		if ( ! $egen['gyldig'] ) {
			return $egen;
		}
		$okt = $egen['okt'];
	}

	// Bare gjesteøkter (Store API-økter fra Next.js-serveren er alltid gjester). En innlogget kundes økt
	// flyttes aldri til en annen nettleser.
	if ( ! Regina_Kurvtoken::er_gjesteokt( $okt ) ) {
		return array(
			'gyldig' => false,
			'grunn'  => 'ikke_gjest',
			'okt'    => '',
		);
	}

	return array(
		'gyldig' => true,
		'grunn'  => '',
		'okt'    => $okt,
	);
}

/**
 * Leser kurven i en Store API-økt rett fra databasen.
 *
 * WooCommerce lagrer økten som serialize( [ nøkkel => maybe_serialize( verdi ) ] ) (WC_Session::set()),
 * så både raden og hver verdi avserialiseres.
 *
 * @param string $okt Sesjonsnøkkel (t_...).
 * @return array{linjer: array<int, array{produkt: int, variant: int, antall: float|int, attributter: array<string, string>}>, kuponger: string[], avtrykk: string}|null
 */
function regina_kurv_les_okt( $okt ) {
	global $wpdb;

	$rad = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$wpdb->prepare(
			"SELECT session_value, session_expiry FROM {$wpdb->prefix}woocommerce_sessions WHERE session_key = %s",
			$okt
		)
	);
	if ( ! $rad || (int) $rad->session_expiry < time() ) {
		return null;
	}

	$data = regina_avserialiser( $rad->session_value );
	if ( ! is_array( $data ) ) {
		return null;
	}

	$kurv     = isset( $data['cart'] ) ? regina_avserialiser( $data['cart'] ) : array();
	$kuponger = isset( $data['applied_coupons'] ) ? regina_avserialiser( $data['applied_coupons'] ) : array();

	$linjer = regina_kurv_normaliser_linjer( is_array( $kurv ) ? $kurv : array() );
	$koder  = array();
	foreach ( is_array( $kuponger ) ? $kuponger : array() as $kode ) {
		if ( is_string( $kode ) && '' !== wc_format_coupon_code( $kode ) ) {
			$koder[] = wc_format_coupon_code( $kode );
		}
	}
	$koder = array_values( array_unique( $koder ) );

	return array(
		'linjer'   => $linjer,
		'kuponger' => $koder,
		'avtrykk'  => regina_kurv_avtrykk( $linjer, $koder ),
	);
}

/**
 * Plukker ut det som trengs for å legge en vare i kurven på nytt.
 *
 * Bare produkt, variant, antall og variasjonsattributter. Tilleggsdata fra utvidelser (cart_item_data)
 * tas ikke med: Store API legger selv ikke inn noe der (CartAddItem sender cart_item_data = []), og
 * utvidelsene legger sitt inn på nytt via woocommerce_add_cart_item_data når add_to_cart() kjøres.
 *
 * @param array $kurv WooCommerce sin lagrede kurv (nøkkel => linje).
 * @return array<int, array{produkt: int, variant: int, antall: float|int, attributter: array<string, string>}>
 */
function regina_kurv_normaliser_linjer( array $kurv ) {
	$linjer = array();
	foreach ( $kurv as $linje ) {
		if ( ! is_array( $linje ) ) {
			continue;
		}
		$produkt = absint( isset( $linje['product_id'] ) ? $linje['product_id'] : 0 );
		$variant = absint( isset( $linje['variation_id'] ) ? $linje['variation_id'] : 0 );
		$antall  = wc_stock_amount( isset( $linje['quantity'] ) ? $linje['quantity'] : 0 );
		if ( ! $produkt || $antall <= 0 ) {
			continue;
		}

		$attributter = array();
		if ( isset( $linje['variation'] ) && is_array( $linje['variation'] ) ) {
			foreach ( $linje['variation'] as $navn => $verdi ) {
				// Lagret som attribute_pa_storrelse => 90-ml (CartController::parse_variation_data).
				if ( is_string( $navn ) && 0 === strpos( $navn, 'attribute_' ) && is_scalar( $verdi ) ) {
					$attributter[ $navn ] = (string) $verdi;
				}
			}
			ksort( $attributter );
		}

		$linjer[] = array(
			'produkt'     => $produkt,
			'variant'     => $variant,
			'antall'      => $antall,
			'attributter' => $attributter,
		);
	}
	return $linjer;
}

/**
 * Fingeravtrykk av en kurv (uavhengig av rekkefølge), brukt for å se om Store API-kurven er endret
 * etter overføringen.
 *
 * @param array    $linjer   Normaliserte linjer.
 * @param string[] $kuponger Kupongkoder.
 * @return string
 */
function regina_kurv_avtrykk( array $linjer, array $kuponger ) {
	$deler = array();
	foreach ( $linjer as $linje ) {
		$deler[] = wp_json_encode( array( $linje['produkt'], $linje['variant'], (string) $linje['antall'], $linje['attributter'] ) );
	}
	sort( $deler );
	sort( $kuponger );
	return md5( (string) wp_json_encode( array( $deler, $kuponger ) ) );
}

/**
 * Erstatter nettleserens kurv med kildekurven.
 *
 * empty_cart( true ) tømmer også den lagrede kurven til innloggede kunder og nullstiller valgt frakt og
 * eventuell ventende ordre i økten (WC_Cart_Session::destroy_cart_session). add_to_cart() validerer mot
 * dagens lager, kjøpbarhet og variasjonsattributter og legger selv inn en feilmelding per vare som feiler.
 *
 * @param array $kilde Fra regina_kurv_les_okt().
 * @return array{lagt_til: int, feilet: int}
 */
function regina_kurv_bygg_opp( array $kilde ) {
	$kurv = WC()->cart;
	$kurv->empty_cart( true );

	$lagt_til = 0;
	$feilet   = 0;
	foreach ( $kilde['linjer'] as $linje ) {
		$nokkel = $kurv->add_to_cart( $linje['produkt'], $linje['antall'], $linje['variant'], $linje['attributter'] );
		if ( $nokkel ) {
			++$lagt_til;
		} else {
			++$feilet;
		}
	}

	if ( $lagt_til > 0 ) {
		foreach ( $kilde['kuponger'] as $kode ) {
			if ( ! $kurv->has_discount( $kode ) ) {
				$kurv->apply_coupon( $kode ); // WooCommerce legger selv inn melding om kupongen.
			}
		}
	}

	$kurv->calculate_totals();

	// Sørg for at gjesten får øktinformasjonskapsel, ellers lagres verken kurv eller meldinger.
	if ( method_exists( WC()->session, 'set_customer_session_cookie' ) ) {
		WC()->session->set_customer_session_cookie( true );
	}

	return array(
		'lagt_til' => $lagt_til,
		'feilet'   => $feilet,
	);
}

/**
 * Avbryter overføringen: melding og videre til handlekurvsiden. Nettleserens kurv røres ikke.
 *
 * @param string $melding Norsk melding til kunden.
 */
function regina_kurv_avbryt( $melding ) {
	if ( method_exists( WC()->session, 'set_customer_session_cookie' ) ) {
		WC()->session->set_customer_session_cookie( true ); // Ellers forsvinner meldingen for nye gjester.
	}
	wc_add_notice( $melding, 'error' );
	wp_safe_redirect( wc_get_cart_url(), 302, 'Regina Parfymeri' );
	exit;
}

/*
 * Etter ordren: tøm Store API-kurven, så kunden ikke ser de samme varene i Next.js-kurven etter at hun har
 * betalt. Bare hvis Store API-kurven er uendret siden overføringen (samme avtrykk), ellers har kunden
 * handlet videre i Next.js og kurven skal stå.
 */
add_action( 'woocommerce_new_order', 'regina_kurv_merk_ordre', 10, 2 );
add_action( 'woocommerce_order_status_changed', 'regina_kurv_rydd_etter_ordre', 10, 4 );
add_action( 'woocommerce_cart_emptied', 'regina_kurv_glem_kilde' );

/**
 * Merker en ny ordre med hvilken Store API-økt kurven kom fra (ikke tokenet).
 *
 * @param int           $ordre_id Ordre-ID.
 * @param WC_Order|null $ordre    Ordren.
 */
function regina_kurv_merk_ordre( $ordre_id, $ordre = null ) {
	if ( ! function_exists( 'WC' ) || ! WC()->session ) {
		return; // F.eks. ordre opprettet i admin eller i en tilbakekalling fra Vipps.
	}
	$kilde = WC()->session->get( 'regina_kurv_kilde' );
	if ( ! is_array( $kilde ) || empty( $kilde['okt'] ) || empty( $kilde['avtrykk'] ) ) {
		return;
	}
	$ordre = $ordre instanceof WC_Order ? $ordre : wc_get_order( $ordre_id );
	if ( ! $ordre instanceof WC_Order ) {
		return;
	}
	$ordre->update_meta_data( '_regina_kurv_kilde', $kilde['okt'] . '|' . $kilde['avtrykk'] );
	$ordre->save_meta_data();
}

/**
 * Tømmer Store API-kurven når ordren er betalt eller satt på vent.
 *
 * @param int      $ordre_id Ordre-ID.
 * @param string   $fra      Gammel status.
 * @param string   $til      Ny status.
 * @param WC_Order $ordre    Ordren.
 */
function regina_kurv_rydd_etter_ordre( $ordre_id, $fra, $til, $ordre ) {
	$statuser = (array) apply_filters( 'regina_kurv_rydd_statuser', array_merge( wc_get_is_paid_statuses(), array( 'on-hold' ) ) );
	if ( ! in_array( $til, $statuser, true ) || ! $ordre instanceof WC_Order ) {
		return;
	}
	$merke = $ordre->get_meta( '_regina_kurv_kilde' );
	if ( ! is_string( $merke ) || false === strpos( $merke, '|' ) ) {
		return;
	}
	list( $okt, $avtrykk ) = explode( '|', $merke, 2 );

	if ( Regina_Kurvtoken::er_gjesteokt( $okt ) ) {
		$na = regina_kurv_les_okt( $okt );
		if ( null !== $na && hash_equals( $avtrykk, $na['avtrykk'] ) ) {
			global $wpdb;
			$wpdb->delete( $wpdb->prefix . 'woocommerce_sessions', array( 'session_key' => $okt ), array( '%s' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			if ( defined( 'WC_SESSION_CACHE_GROUP' ) && class_exists( 'WC_Cache_Helper' ) ) {
				wp_cache_delete( WC_Cache_Helper::get_cache_prefix( WC_SESSION_CACHE_GROUP ) . $okt, WC_SESSION_CACHE_GROUP );
			}
			regina_logg( 'Store API-kurven ble tømt etter ordre ' . (int) $ordre_id . '.' );
		}
	}

	$ordre->delete_meta_data( '_regina_kurv_kilde' );
	$ordre->save_meta_data();
}

/**
 * Når nettleserens kurv tømmes (etter ordre eller av kunden), speiler den ikke lenger kildekurven.
 */
function regina_kurv_glem_kilde() {
	if ( function_exists( 'WC' ) && WC()->session ) {
		WC()->session->set( 'regina_kurv_kilde', null );
	}
}

/*
 * Erstatt, ikke slå sammen – også ved innlogging i kassen. WooCommerce slår ellers sammen den lagrede kurven
 * fra forrige besøk med den overførte kurven når en gjest logger inn (wc_user_logged_in setter
 * _woocommerce_load_saved_cart_after_login på wp_login, prioritet 10). Vi fjerner flagget når kurven
 * nettopp er overført.
 */
add_action( 'wp_login', 'regina_kurv_hindre_sammenslaing', 20, 2 );

/**
 * Hindrer at lagret kurv slås sammen med en overført kurv ved innlogging.
 *
 * @param string  $brukernavn Brukernavn.
 * @param WP_User $bruker     Brukeren.
 */
function regina_kurv_hindre_sammenslaing( $brukernavn, $bruker ) {
	if ( ! $bruker instanceof WP_User || ! function_exists( 'WC' ) || ! WC()->session || ! WC()->cart instanceof WC_Cart ) {
		return;
	}
	$kilde = WC()->session->get( 'regina_kurv_kilde' );
	if ( is_array( $kilde ) && ! empty( $kilde['okt'] ) && ! WC()->cart->is_empty() ) {
		delete_user_meta( $bruker->ID, '_woocommerce_load_saved_cart_after_login' );
	}
}
