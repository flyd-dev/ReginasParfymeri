<?php
/**
 * Revalidering av den nye flaten når kampanjer eller butikkinfo endres.
 *
 * POST {REGINA_REVALIDATE_URL}
 *   Content-Type: application/json
 *   X-Regina-Signature: base64( HMAC-SHA256( <rå kropp>, REGINA_REVALIDATE_SECRET ) )
 *   Kropp: {"tags":["kampanjer"]} eller {"tags":["butikk"]} (begge hvis begge endret seg i samme forespørsel)
 *
 * Er konstantene ikke satt i wp-config.php, skjer ingenting. Endringer samles i løpet av forespørselen og
 * sendes én gang på «shutdown», så én lagring gir ett kall selv om flere kroker slår til.
 *
 * Produktendringer går ikke hit, men via WooCommerce sine egne webhooks (product.created/updated/deleted),
 * signert med X-WC-Webhook-Signature. Se docs/architecture.md.
 *
 * @package Regina
 */

defined( 'ABSPATH' ) || exit;

/**
 * Kø og utsending av revalideringskall.
 */
final class Regina_Revalidering {

	/**
	 * Tagger som venter på utsending i denne forespørselen.
	 *
	 * @var array<string, bool>
	 */
	private static $tags = array();

	/**
	 * Er begge konstantene satt?
	 *
	 * @return bool
	 */
	public static function er_konfigurert() {
		return defined( 'REGINA_REVALIDATE_URL' ) && defined( 'REGINA_REVALIDATE_SECRET' )
			&& '' !== (string) REGINA_REVALIDATE_URL && '' !== (string) REGINA_REVALIDATE_SECRET;
	}

	/**
	 * Legg en tagg i køen.
	 *
	 * @param string $tag 'kampanjer' eller 'butikk'.
	 */
	public static function legg_til( $tag ) {
		if ( ! self::er_konfigurert() ) {
			return;
		}
		if ( empty( self::$tags ) ) {
			add_action( 'shutdown', array( __CLASS__, 'send_ko' ), 5 );
		}
		self::$tags[ (string) $tag ] = true;
	}

	/**
	 * Sender køen (kjøres på shutdown).
	 */
	public static function send_ko() {
		$tags       = array_keys( self::$tags );
		self::$tags = array();
		if ( array() !== $tags ) {
			self::send( $tags );
		}
	}

	/**
	 * Kroppen som signeres og sendes, f.eks. {"tags":["kampanjer"]}.
	 *
	 * @param string[] $tags Tagger.
	 * @return string
	 */
	public static function kropp( array $tags ) {
		return (string) wp_json_encode( array( 'tags' => array_values( $tags ) ) );
	}

	/**
	 * Base64-kodet HMAC-SHA256 av kroppen.
	 *
	 * @param string $kropp       Rå kropp.
	 * @param string $hemmelighet Delt hemmelighet.
	 * @return string
	 */
	public static function signatur( $kropp, $hemmelighet ) {
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		return base64_encode( hash_hmac( 'sha256', $kropp, $hemmelighet, true ) );
	}

	/**
	 * Sender ett revalideringskall. Feil logges uten hemmeligheter; lagringen i admin stoppes ikke.
	 *
	 * @param string[] $tags Tagger.
	 */
	public static function send( array $tags ) {
		if ( ! self::er_konfigurert() ) {
			return;
		}

		$kropp = self::kropp( $tags );
		$svar  = wp_remote_post(
			(string) REGINA_REVALIDATE_URL,
			array(
				'timeout'     => 5,
				'redirection' => 0,
				'headers'     => array(
					'Content-Type'       => 'application/json',
					'X-Regina-Signature' => self::signatur( $kropp, (string) REGINA_REVALIDATE_SECRET ),
				),
				'body'        => $kropp,
				'data_format' => 'body',
			)
		);

		if ( is_wp_error( $svar ) ) {
			regina_logg( 'Revalidering (' . implode( ',', $tags ) . ') feilet: ' . $svar->get_error_code(), 'warning' );
			return;
		}
		$kode = (int) wp_remote_retrieve_response_code( $svar );
		if ( $kode < 200 || $kode >= 300 ) {
			regina_logg( 'Revalidering (' . implode( ',', $tags ) . ') svarte HTTP ' . $kode . '.', 'warning' );
		}
	}
}

/**
 * Be om revalidering av en tagg på den nye flaten.
 *
 * @param string $tag 'kampanjer' eller 'butikk'.
 */
function regina_revalider( $tag ) {
	Regina_Revalidering::legg_til( $tag );
}
