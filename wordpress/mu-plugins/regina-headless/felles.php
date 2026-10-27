<?php
/**
 * Felles hjelpefunksjoner for Regina headless.
 *
 * @package Regina
 */

defined( 'ABSPATH' ) || exit;

/**
 * Skriver en linje til WooCommerce-loggen (WooCommerce → Status → Logger, kilde «regina-headless»).
 *
 * Aldri send tokener, e-postadresser, IP-adresser eller hemmeligheter hit.
 *
 * @param string $melding Meldingen.
 * @param string $niva    PSR-3-nivå: debug, info, notice, warning, error.
 */
function regina_logg( $melding, $niva = 'info' ) {
	if ( function_exists( 'wc_get_logger' ) ) {
		wc_get_logger()->log( $niva, $melding, array( 'source' => 'regina-headless' ) );
		return;
	}
	if ( defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) {
		error_log( 'regina-headless: ' . $melding ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
	}
}

/**
 * Tidspunkt som ISO 8601 med tidssone-offset i butikkens tidssone (Innstillinger → Generelt),
 * f.eks. 2026-11-01T09:00:00+01:00.
 *
 * @param int $tidsstempel Unix-tid.
 * @return string
 */
function regina_iso( $tidsstempel ) {
	return wp_date( 'c', (int) $tidsstempel );
}

/**
 * Avserialiserer en verdi fra WooCommerce sin sesjonstabell uten å tillate objekter.
 *
 * WooCommerce lagrer selv bare tabeller og skalarer i kurven (produktobjektet fjernes før lagring),
 * så vi trenger aldri objekter. allowed_classes=false stenger for objektinjeksjon.
 *
 * @param mixed $verdi Lagret verdi.
 * @return mixed
 */
function regina_avserialiser( $verdi ) {
	if ( ! is_string( $verdi ) || ! is_serialized( $verdi ) ) {
		return $verdi;
	}
	// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_unserialize, WordPress.PHP.NoSilencedErrors.Discouraged
	return @unserialize( trim( $verdi ), array( 'allowed_classes' => false ) );
}

/**
 * Klientens IP-adresse.
 *
 * Bruker REMOTE_ADDR. Bare hvis forespørselen kommer fra en adresse i REGINA_TILLIT_PROXY (f.eks.
 * Next.js-serveren som videresender skjemaet), brukes siste adresse i X-Forwarded-For – den som
 * proxyen selv la til. Ellers kunne hvem som helst ha valgt sin egen IP.
 *
 * @return string
 */
function regina_klient_ip() {
	$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';

	if ( defined( 'REGINA_TILLIT_PROXY' ) && '' !== $ip && isset( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
		$tillitte = array_filter( array_map( 'trim', explode( ',', (string) REGINA_TILLIT_PROXY ) ) );
		if ( in_array( $ip, $tillitte, true ) ) {
			$kjede = array_filter( array_map( 'trim', explode( ',', sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) ) ) );
			$siste = end( $kjede );
			if ( is_string( $siste ) && filter_var( $siste, FILTER_VALIDATE_IP ) ) {
				$ip = $siste;
			}
		}
	}

	return filter_var( $ip, FILTER_VALIDATE_IP ) ? $ip : '0.0.0.0';
}

/**
 * Feilsvar for /regina/v1-endepunktene: { feil: '<norsk tekst>' }.
 *
 * @param int    $status HTTP-status.
 * @param string $tekst  Melding som kan vises til kunden.
 * @return WP_REST_Response
 */
function regina_feil( $status, $tekst ) {
	return new WP_REST_Response( array( 'feil' => $tekst ), (int) $status );
}

/*
 * WordPress svarer selv på enkelte feil før vår kode kjører (ugyldig JSON, feil metode). Gjør dem om
 * til samme form som resten av kontrakten, så flaten bare trenger å forstå { feil }.
 */
add_filter(
	'rest_post_dispatch',
	function ( $svar, $server, $foresporsel ) {
		if ( ! $foresporsel instanceof WP_REST_Request || 0 !== strpos( (string) $foresporsel->get_route(), '/regina/v1/' ) ) {
			return $svar;
		}
		if ( $svar instanceof WP_REST_Response && $svar->is_error() ) {
			$data = $svar->get_data();
			if ( is_array( $data ) && ! isset( $data['feil'] ) && isset( $data['code'] ) ) {
				$svar->set_data( array( 'feil' => 'Ugyldig forespørsel.' ) );
			}
		}
		return $svar;
	},
	10,
	3
);
