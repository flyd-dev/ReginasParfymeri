<?php
/**
 * «Gi meg beskjed når den er tilbake»: POST /wp-json/regina/v1/varsle og den private innholdstypen
 * regina_varsling.
 *
 * Kontrakt:
 *   POST /wp-json/regina/v1/varsle   Content-Type: application/json
 *   { "produkt": 123, "variant": 456, "epost": "navn@eksempel.no" }   (variant er valgfri)
 *   201 { "ok": true }
 *   4xx { "feil": "<norsk tekst>" }   400 ugyldig, 404 finnes ikke, 409 på lager, 429 for mange
 *
 * Utsending når varen kommer på lager ligger bak opsjonen regina_varsling_send og er AV som standard –
 * Flyd må godkjenne e-post til kunder før den slås på (wp option update regina_varsling_send yes).
 * Varsler registreres uansett, så ingen påmelding går tapt.
 *
 * Personvern: e-postadressen slettes fra varselet når e-posten er sendt; varsler eldre enn ett år slettes.
 *
 * @package Regina
 */

defined( 'ABSPATH' ) || exit;

define( 'REGINA_VARSLING_TYPE', 'regina_varsling' );
define( 'REGINA_VARSLING_SAMTYKKE', 'Kunden ba om én e-post når varen er tilbake på lager (skjema i nettbutikken, tekstversjon 1).' );
define( 'REGINA_VARSLING_PARTI', 50 );

add_action( 'init', 'regina_varsling_registrer' );

/**
 * Registrerer den private innholdstypen. Synlig for butikkansvarlig under WooCommerce, kan ikke opprettes
 * for hånd.
 */
function regina_varsling_registrer() {
	register_post_type(
		REGINA_VARSLING_TYPE,
		array(
			'labels'              => array(
				'name'          => 'Lagervarsler',
				'singular_name' => 'Lagervarsel',
				'menu_name'     => 'Lagervarsler',
				'all_items'     => 'Lagervarsler',
				'edit_item'     => 'Lagervarsel',
				'search_items'  => 'Søk i lagervarsler',
				'not_found'     => 'Ingen lagervarsler',
			),
			'public'              => false,
			'publicly_queryable'  => false,
			'exclude_from_search' => true,
			'show_ui'             => true,
			'show_in_menu'        => 'woocommerce',
			'show_in_nav_menus'   => false,
			'show_in_admin_bar'   => false,
			'show_in_rest'        => false,
			'has_archive'         => false,
			'rewrite'             => false,
			'query_var'           => false,
			'supports'            => array( 'title' ),
			'capability_type'     => 'post',
			'map_meta_cap'        => true,
			'capabilities'        => array(
				'create_posts'           => 'do_not_allow',
				'publish_posts'          => 'do_not_allow',
				'edit_posts'             => 'manage_woocommerce',
				'edit_others_posts'      => 'manage_woocommerce',
				'edit_private_posts'     => 'manage_woocommerce',
				'edit_published_posts'   => 'manage_woocommerce',
				'delete_posts'           => 'manage_woocommerce',
				'delete_others_posts'    => 'manage_woocommerce',
				'delete_private_posts'   => 'manage_woocommerce',
				'delete_published_posts' => 'manage_woocommerce',
				'read_private_posts'     => 'manage_woocommerce',
				'read'                   => 'read',
			),
		)
	);
}

/**
 * Er utsending slått på? AV som standard.
 *
 * @return bool
 */
function regina_varsling_sending_pa() {
	return in_array( strtolower( (string) get_option( 'regina_varsling_send', 'no' ) ), array( 'yes', '1', 'true', 'ja' ), true );
}

/*
 * POST /wp-json/regina/v1/varsle
 */
add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'regina/v1',
			'/varsle',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => 'regina_varsling_rest',
				'permission_callback' => '__return_true',
			)
		);
	}
);

/**
 * Registrerer et lagervarsel.
 *
 * @param WP_REST_Request $foresporsel Forespørselen.
 * @return WP_REST_Response
 */
function regina_varsling_rest( WP_REST_Request $foresporsel ) {
	if ( ! regina_varsling_innenfor_grense() ) {
		return regina_feil( 429, 'For mange forsøk. Prøv igjen om noen minutter.' );
	}

	$data = $foresporsel->get_json_params();
	if ( ! is_array( $data ) ) {
		return regina_feil( 400, 'Ugyldig forespørsel.' );
	}

	// E-post.
	$epost_raa = ( isset( $data['epost'] ) && is_string( $data['epost'] ) ) ? trim( $data['epost'] ) : '';
	$epost     = sanitize_email( $epost_raa );
	if ( '' === $epost || $epost !== $epost_raa || strlen( $epost ) > 254 || ! is_email( $epost ) ) {
		return regina_feil( 400, 'Skriv inn en gyldig e-postadresse.' );
	}
	$epost = strtolower( $epost );

	// Produkt og variant.
	$produkt_id = isset( $data['produkt'] ) ? filter_var( $data['produkt'], FILTER_VALIDATE_INT, array( 'options' => array( 'min_range' => 1 ) ) ) : false;
	if ( false === $produkt_id || is_bool( $data['produkt'] ) ) {
		return regina_feil( 400, 'Ugyldig produkt.' );
	}
	$variant_id = 0;
	if ( isset( $data['variant'] ) ) {
		$variant_id = filter_var( $data['variant'], FILTER_VALIDATE_INT, array( 'options' => array( 'min_range' => 1 ) ) );
		if ( false === $variant_id || is_bool( $data['variant'] ) ) {
			return regina_feil( 400, 'Ugyldig variant.' );
		}
	}

	$produkt = wc_get_product( $produkt_id );
	if ( ! $produkt instanceof WC_Product || $produkt->is_type( 'variation' ) || 'publish' !== $produkt->get_status() || 'hidden' === $produkt->get_catalog_visibility() ) {
		return regina_feil( 404, 'Fant ikke produktet.' );
	}

	$vare = $produkt;
	if ( $variant_id ) {
		$variant = wc_get_product( $variant_id );
		if ( ! $variant instanceof WC_Product || ! $variant->is_type( 'variation' ) || (int) $variant->get_parent_id() !== (int) $produkt_id || 'publish' !== $variant->get_status() ) {
			return regina_feil( 404, 'Fant ikke varianten.' );
		}
		$vare = $variant;
	}

	// Bare utsolgte varer. «Kan restbestilles» regnes som på lager, slik WooCommerce gjør.
	if ( $vare->is_in_stock() ) {
		return regina_feil( 409, 'Varen er på lager nå, så du kan kjøpe den med en gang.' );
	}

	// Samme e-post for samme vare som ikke er sendt ennå: svar ok uten å lagre på nytt (og uten å røpe noe).
	$finnes = get_posts(
		array(
			'post_type'      => REGINA_VARSLING_TYPE,
			'post_status'    => 'private',
			'fields'         => 'ids',
			'posts_per_page' => 1,
			'no_found_rows'  => true,
			'meta_query'     => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				'relation' => 'AND',
				array(
					'key'   => '_regina_epost',
					'value' => $epost,
				),
				array(
					'key'   => '_regina_produkt',
					'value' => (int) $produkt_id,
					'type'  => 'NUMERIC',
				),
				array(
					'key'   => '_regina_variant',
					'value' => (int) $variant_id,
					'type'  => 'NUMERIC',
				),
				array(
					'key'     => '_regina_sendt',
					'compare' => 'NOT EXISTS',
				),
			),
		)
	);
	if ( array() !== $finnes ) {
		return new WP_REST_Response( array( 'ok' => true ), 201 );
	}

	$id = wp_insert_post(
		array(
			'post_type'   => REGINA_VARSLING_TYPE,
			'post_status' => 'private',
			'post_title'  => wp_strip_all_tags( html_entity_decode( $vare->get_name(), ENT_QUOTES, 'UTF-8' ) ),
			'meta_input'  => array(
				'_regina_epost'     => $epost,
				'_regina_produkt'   => (int) $produkt_id,
				'_regina_variant'   => (int) $variant_id,
				'_regina_tidspunkt' => regina_iso( time() ),
				'_regina_samtykke'  => REGINA_VARSLING_SAMTYKKE,
			),
		),
		true
	);
	if ( is_wp_error( $id ) || ! $id ) {
		regina_logg( 'Kunne ikke lagre lagervarsel for produkt ' . (int) $produkt_id . '.', 'error' );
		return regina_feil( 500, 'Vi kunne ikke lagre varselet akkurat nå. Prøv igjen senere.' );
	}

	return new WP_REST_Response( array( 'ok' => true ), 201 );
}

/**
 * Enkel rate-begrensning per IP: høyst 5 forsøk per 10 minutter (filter: regina_varsling_grense).
 * IP-en lagres ikke; nøkkelen er en HMAC av den.
 *
 * @return bool
 */
function regina_varsling_innenfor_grense() {
	$grense = max( 1, (int) apply_filters( 'regina_varsling_grense', 5 ) );
	$nokkel = 'regina_varsle_' . substr( wp_hash( regina_klient_ip(), 'nonce' ), 0, 32 );
	$teller = (int) get_transient( $nokkel );
	if ( $teller >= $grense ) {
		return false;
	}
	set_transient( $nokkel, $teller + 1, 10 * MINUTE_IN_SECONDS );
	return true;
}

/*
 * Utsending når varen kommer på lager. Krokene kjører bare når lagerstatus faktisk endres
 * (WC_Product_Data_Store_CPT::handle_updated_props). En variabel forelder får «instock» når første variant
 * kommer tilbake (WooCommerce synkroniserer forelderen).
 */
add_action( 'woocommerce_product_set_stock_status', 'regina_varsling_lagerstatus', 10, 2 );
add_action( 'woocommerce_variation_set_stock_status', 'regina_varsling_lagerstatus', 10, 2 );
add_action( 'regina_varsling_send', 'regina_varsling_send' );

/**
 * Legger utsending i kø når en vare får status «instock».
 *
 * @param int    $id     Produkt- eller variant-ID.
 * @param string $status Ny lagerstatus.
 */
function regina_varsling_lagerstatus( $id, $status ) {
	if ( 'instock' !== $status || ! regina_varsling_sending_pa() ) {
		return;
	}
	if ( function_exists( 'as_enqueue_async_action' ) ) {
		as_enqueue_async_action( 'regina_varsling_send', array( (int) $id ), 'regina' );
	} else {
		regina_varsling_send( (int) $id );
	}
}

/**
 * Sender lagervarsler for én vare (i bakgrunnen via Action Scheduler når den finnes).
 *
 * @param int $id Produkt- eller variant-ID som er tilbake på lager.
 */
function regina_varsling_send( $id ) {
	if ( ! regina_varsling_sending_pa() ) {
		return;
	}
	$vare = wc_get_product( (int) $id );
	if ( ! $vare instanceof WC_Product || ! $vare->is_in_stock() || 'publish' !== $vare->get_status() ) {
		return;
	}
	$er_variant = $vare->is_type( 'variation' );
	$forelder   = $er_variant ? wc_get_product( $vare->get_parent_id() ) : $vare;
	if ( ! $forelder instanceof WC_Product || 'publish' !== $forelder->get_status() ) {
		return;
	}

	$vilkar = $er_variant
		? array(
			array(
				'key'   => '_regina_variant',
				'value' => (int) $id,
				'type'  => 'NUMERIC',
			),
		)
		: array(
			array(
				'key'   => '_regina_produkt',
				'value' => (int) $id,
				'type'  => 'NUMERIC',
			),
			array(
				'key'   => '_regina_variant',
				'value' => 0,
				'type'  => 'NUMERIC',
			),
		);
	$vilkar[]           = array(
		'key'     => '_regina_sendt',
		'compare' => 'NOT EXISTS',
	);
	$vilkar['relation'] = 'AND';

	$ider = get_posts(
		array(
			'post_type'      => REGINA_VARSLING_TYPE,
			'post_status'    => 'private',
			'fields'         => 'ids',
			'posts_per_page' => REGINA_VARSLING_PARTI,
			'no_found_rows'  => true,
			'orderby'        => 'date',
			'order'          => 'ASC',
			'meta_query'     => $vilkar, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
		)
	);

	$emne  = regina_varsling_navn( $forelder ) . ' er tilbake på lager';
	$tekst = regina_varsling_tekst( $vare, $forelder );
	$hoder = array( 'Content-Type: text/plain; charset=UTF-8' );
	$fra   = (string) get_option( 'woocommerce_email_from_address', '' );
	if ( is_email( $fra ) ) {
		$hoder[] = 'From: ' . wp_specialchars_decode( (string) get_option( 'woocommerce_email_from_name', 'Regina Parfymeri' ), ENT_QUOTES ) . ' <' . $fra . '>';
	}

	$sendt = 0;
	foreach ( $ider as $varsel_id ) {
		$epost = (string) get_post_meta( $varsel_id, '_regina_epost', true );
		if ( ! is_email( $epost ) ) {
			continue;
		}
		if ( wp_mail( $epost, $emne, $tekst, $hoder ) ) {
			update_post_meta( $varsel_id, '_regina_sendt', regina_iso( time() ) );
			delete_post_meta( $varsel_id, '_regina_epost' ); // Formålet er oppfylt.
			++$sendt;
		}
	}
	if ( $sendt > 0 ) {
		regina_logg( 'Sendte ' . $sendt . ' lagervarsler for vare ' . (int) $id . '.' );
	}

	// Flere enn ett parti: ta resten i en ny jobb.
	if ( count( $ider ) === REGINA_VARSLING_PARTI && $sendt > 0 && function_exists( 'as_enqueue_async_action' ) ) {
		as_enqueue_async_action( 'regina_varsling_send', array( (int) $id ), 'regina' );
	}
}

/**
 * Produktnavn som ren tekst.
 *
 * @param WC_Product $produkt Produktet.
 * @return string
 */
function regina_varsling_navn( $produkt ) {
	return wp_strip_all_tags( html_entity_decode( $produkt->get_name(), ENT_QUOTES, 'UTF-8' ) );
}

/**
 * E-postteksten. UTKAST – må godkjennes av Flyd før utsending slås på. Ingen påstander utover at varen er
 * på lager nå.
 *
 * @param WC_Product $vare     Varen (produkt eller variant).
 * @param WC_Product $forelder Produktet.
 * @return string
 */
function regina_varsling_tekst( $vare, $forelder ) {
	$linjer = array(
		'Hei!',
		'',
		'Du ba om å få beskjed når denne varen var tilbake hos Regina Parfymeri:',
		'',
		regina_varsling_navn( $forelder ),
	);
	if ( $vare->is_type( 'variation' ) ) {
		$linjer[] = wp_strip_all_tags( wc_get_formatted_variation( $vare, true, false, false ) );
	}
	$linjer[] = regina_varsling_lenke( $forelder );
	$linjer[] = '';
	$linjer[] = 'Lagerbeholdningen kan endre seg.';
	$linjer[] = '';
	$linjer[] = 'Du får bare denne ene e-posten om varen, og e-postadressen din er nå slettet fra varsellisten.';
	$linjer[] = '';
	$linjer[] = 'Vennlig hilsen';
	$linjer[] = 'Regina Parfymeri';
	return implode( "\n", $linjer );
}

/**
 * Lenke til produktet: den nye flaten når REGINA_FRONTEND_URL er satt, ellers WooCommerce-siden.
 * Stien må stemme med produktruten i Next.js (avklares i fase 1); filteret regina_varsling_lenke kan overstyre.
 *
 * @param WC_Product $produkt Produktet (forelder).
 * @return string
 */
function regina_varsling_lenke( $produkt ) {
	$lenke = defined( 'REGINA_FRONTEND_URL' ) && '' !== (string) REGINA_FRONTEND_URL
		? untrailingslashit( (string) REGINA_FRONTEND_URL ) . '/produkt/' . rawurlencode( $produkt->get_slug() )
		: (string) get_permalink( $produkt->get_id() );
	return (string) apply_filters( 'regina_varsling_lenke', $lenke, $produkt );
}

/*
 * Rydding: varsler eldre enn ett år slettes (formålet er da trolig borte), sendte eller ikke.
 */
add_action(
	'init',
	function () {
		if ( ! wp_next_scheduled( 'regina_varsling_rydd' ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'regina_varsling_rydd' );
		}
	}
);
add_action(
	'regina_varsling_rydd',
	function () {
		$ider = get_posts(
			array(
				'post_type'      => REGINA_VARSLING_TYPE,
				'post_status'    => 'private',
				'fields'         => 'ids',
				'posts_per_page' => 200,
				'no_found_rows'  => true,
				'date_query'     => array(
					array(
						'before' => '1 year ago',
					),
				),
			)
		);
		foreach ( $ider as $id ) {
			wp_delete_post( $id, true );
		}
	}
);

/*
 * Oversikten i admin: e-post, produkt, variant, registrert og sendt.
 */
add_filter(
	'manage_' . REGINA_VARSLING_TYPE . '_posts_columns',
	function () {
		return array(
			'cb'                => '<input type="checkbox" />',
			'title'             => 'Vare',
			'regina_epost'      => 'E-post',
			'regina_produkt'    => 'Produkt-ID',
			'regina_variant'    => 'Variant-ID',
			'regina_registrert' => 'Registrert',
			'regina_sendt'      => 'Sendt',
		);
	}
);
add_action(
	'manage_' . REGINA_VARSLING_TYPE . '_posts_custom_column',
	function ( $kolonne, $post_id ) {
		switch ( $kolonne ) {
			case 'regina_epost':
				$epost = (string) get_post_meta( $post_id, '_regina_epost', true );
				echo esc_html( '' === $epost ? '(slettet etter utsending)' : $epost );
				break;
			case 'regina_produkt':
				echo (int) get_post_meta( $post_id, '_regina_produkt', true );
				break;
			case 'regina_variant':
				$variant = (int) get_post_meta( $post_id, '_regina_variant', true );
				echo $variant ? (int) $variant : '–';
				break;
			case 'regina_registrert':
				echo esc_html( (string) get_post_meta( $post_id, '_regina_tidspunkt', true ) );
				break;
			case 'regina_sendt':
				$sendt = (string) get_post_meta( $post_id, '_regina_sendt', true );
				echo esc_html( '' === $sendt ? 'Nei' : $sendt );
				break;
		}
	},
	10,
	2
);
