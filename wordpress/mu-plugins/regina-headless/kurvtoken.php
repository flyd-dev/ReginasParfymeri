<?php
/**
 * Regina_Kurvtoken – validering av WooCommerce Store API sitt Cart-Token.
 *
 * Slik WooCommerce gjør det (11.2.1, samme i 10.6.2):
 *   - CartTokenUtils::get_cart_token() lager en HS256-JWT med payload
 *     { user_id: <sesjonsnøkkel>, exp: time() + wc_session_expiration (48 t), iss: 'store-api' } og
 *     JsonWebToken::generate_payload() legger til iat.
 *   - Hemmeligheten er '@' . wp_salt() (CartTokenUtils::get_cart_token_secret()).
 *   - JsonWebToken::validate() sjekker i denne rekkefølgen:
 *       1. format: tre base64url-deler (regex i shallow_validate)
 *       2. header: typ = 'JWT' og alg = 'HS256'
 *       3. utløp: exp finnes og time() <= exp
 *       4. signatur: base64url(HMAC-SHA256(header.payload, hemmelighet)) mot tredje del med hash_equals
 *   - iss sjekkes ikke av WooCommerce, og gjøres derfor heller ikke her.
 *
 * Denne klassen gjør nøyaktig de samme kontrollene. Den avviser i tillegg header eller payload som ikke er
 * JSON-objekter; der ville WooCommerce i PHP 8 kastet TypeError (property_exists på et tall).
 *
 * Klassen bruker ikke WordPress, slik at den kan testes alene. Hemmelighet og «nå» sendes inn.
 * I WordPress brukes WooCommerce sin egen CartTokenUtils::validate_cart_token() når den finnes, og denne
 * klassen som kontroll og reserve (se kurvoverforing.php).
 *
 * @package Regina
 */

defined( 'ABSPATH' ) || exit;

/**
 * Validering av Cart-Token (HS256-JWT) med samme algoritme som WooCommerce.
 */
final class Regina_Kurvtoken {

	/** Lengste token vi i det hele tatt ser på. Et ekte Cart-Token er rundt 200 tegn. */
	const MAKS_LENGDE = 2048;

	/** Samme mønster som JsonWebToken::shallow_validate(). */
	const MONSTER = '/^[a-zA-Z\d\-_=]+\.[a-zA-Z\d\-_=]+\.[a-zA-Z\d\-_=]+$/';

	/**
	 * Validerer et token.
	 *
	 * @param mixed  $token       Tokenet slik det kom inn.
	 * @param string $hemmelighet '@' . wp_salt() i WordPress.
	 * @param int    $naa         Unix-tid.
	 * @return array{gyldig: bool, grunn: string, okt: string} grunn er en kort kode for logging, aldri tokenet.
	 */
	public static function valider( $token, $hemmelighet, $naa ) {
		$struktur = self::les_struktur( $token );
		if ( ! $struktur['ok'] ) {
			return self::avvist( $struktur['grunn'] );
		}

		$payload = $struktur['payload'];
		if ( ! property_exists( $payload, 'exp' ) || (int) $naa > (int) $payload->exp ) {
			return self::avvist( 'utlopt' );
		}

		$forventet = self::til_base64url(
			hash_hmac( 'sha256', $struktur['header_kodet'] . '.' . $struktur['payload_kodet'], (string) $hemmelighet, true )
		);
		if ( ! hash_equals( $forventet, $struktur['signatur_kodet'] ) ) {
			return self::avvist( 'signatur' );
		}

		return array(
			'gyldig' => true,
			'grunn'  => '',
			'okt'    => self::okt_fra_payload( $payload ),
		);
	}

	/**
	 * Format- og header-kontroll (steg 1 og 2), uten signatur og utløp.
	 *
	 * @param mixed $token Tokenet.
	 * @return array{ok: bool, grunn: string, header_kodet?: string, payload_kodet?: string, signatur_kodet?: string, payload?: object}
	 */
	public static function les_struktur( $token ) {
		if ( ! is_string( $token ) || '' === $token ) {
			return array(
				'ok'    => false,
				'grunn' => 'mangler',
			);
		}
		if ( strlen( $token ) > self::MAKS_LENGDE || 1 !== preg_match( self::MONSTER, $token ) ) {
			return array(
				'ok'    => false,
				'grunn' => 'format',
			);
		}

		list( $header_kodet, $payload_kodet, $signatur_kodet ) = explode( '.', $token );

		$header  = json_decode( self::fra_base64url( $header_kodet ) );
		$payload = json_decode( self::fra_base64url( $payload_kodet ) );

		if (
			! is_object( $header ) ||
			! property_exists( $header, 'typ' ) ||
			! property_exists( $header, 'alg' ) ||
			'JWT' !== $header->typ ||
			'HS256' !== $header->alg
		) {
			return array(
				'ok'    => false,
				'grunn' => 'header',
			);
		}
		if ( ! is_object( $payload ) ) {
			return array(
				'ok'    => false,
				'grunn' => 'payload',
			);
		}

		return array(
			'ok'             => true,
			'grunn'          => '',
			'header_kodet'   => $header_kodet,
			'payload_kodet'  => $payload_kodet,
			'signatur_kodet' => $signatur_kodet,
			'payload'        => $payload,
		);
	}

	/**
	 * Sesjonsnøkkelen (WooCommerce kaller den user_id) fra payload.
	 *
	 * @param object $payload Avkodet payload.
	 * @return string
	 */
	public static function okt_fra_payload( $payload ) {
		return ( is_object( $payload ) && isset( $payload->user_id ) && is_string( $payload->user_id ) ) ? $payload->user_id : '';
	}

	/**
	 * Er dette en gjesteøkt? Gjester får nøkkelen 't_' + 30 tegn (wc_rand_hash( 't_', 30 )).
	 * Innloggede kunder har bruker-ID-en som nøkkel; de flyttes aldri på denne måten.
	 *
	 * @param mixed $okt Sesjonsnøkkel.
	 * @return bool
	 */
	public static function er_gjesteokt( $okt ) {
		return is_string( $okt ) && 1 === preg_match( '/^t_[a-zA-Z0-9]{1,30}$/', $okt );
	}

	/**
	 * Som JsonWebToken::to_base_64_url().
	 *
	 * @param string $tekst Binær tekst.
	 * @return string
	 */
	public static function til_base64url( $tekst ) {
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		return str_replace( array( '+', '/', '=' ), array( '-', '_', '' ), base64_encode( $tekst ) );
	}

	/**
	 * Som JsonWebToken::from_base_64_url(): fyller på med '=' til lengden går opp i 4.
	 *
	 * @param string $tekst base64url.
	 * @return string
	 */
	public static function fra_base64url( $tekst ) {
		$rest = strlen( $tekst ) % 4;
		if ( 0 !== $rest ) {
			$tekst .= str_repeat( '=', 4 - $rest );
		}
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
		$ut = base64_decode( str_replace( array( '-', '_' ), array( '+', '/' ), $tekst ) );
		return false === $ut ? '' : $ut;
	}

	/**
	 * Avvisningssvar.
	 *
	 * @param string $grunn Kort kode.
	 * @return array{gyldig: bool, grunn: string, okt: string}
	 */
	private static function avvist( $grunn ) {
		return array(
			'gyldig' => false,
			'grunn'  => $grunn,
			'okt'    => '',
		);
	}
}
