<?php
/**
 * Butikkinfo: åpningstider med «Bekreftet av butikken».
 *
 * - Innstillinger → Regina butikkinfo (for alle som kan administrere WooCommerce, også butikkansvarlig).
 * - GET /wp-json/regina/v1/butikk → { apningstider: [{ dager, tid }], bekreftet: boolean, oppdatert: string|null }
 * - Den nye flaten viser tidene bare når bekreftet er sann (ingen påfunne fakta).
 * - Endringer ber flaten revalidere taggen «butikk».
 *
 * @package Regina
 */

defined( 'ABSPATH' ) || exit;

define( 'REGINA_BUTIKKINFO_OPSJON', 'regina_butikkinfo' );
define( 'REGINA_BUTIKKINFO_MAKS_RADER', 14 );
define( 'REGINA_BUTIKKINFO_RETTIGHET', 'manage_woocommerce' );

/**
 * Tom butikkinfo.
 *
 * @return array{apningstider: array<int, array{dager: string, tid: string}>, bekreftet: bool, oppdatert: int|null}
 */
function regina_butikkinfo_standard() {
	return array(
		'apningstider' => array(),
		'bekreftet'    => false,
		'oppdatert'    => null,
	);
}

/**
 * Lagret butikkinfo i fast form.
 *
 * @return array{apningstider: array<int, array{dager: string, tid: string}>, bekreftet: bool, oppdatert: int|null}
 */
function regina_butikkinfo_hent() {
	$lagret = get_option( REGINA_BUTIKKINFO_OPSJON, array() );
	$info   = regina_butikkinfo_standard();
	if ( ! is_array( $lagret ) ) {
		return $info;
	}
	if ( isset( $lagret['apningstider'] ) && is_array( $lagret['apningstider'] ) ) {
		foreach ( $lagret['apningstider'] as $rad ) {
			if ( is_array( $rad ) && isset( $rad['dager'], $rad['tid'] ) && is_string( $rad['dager'] ) && is_string( $rad['tid'] ) ) {
				$info['apningstider'][] = array(
					'dager' => $rad['dager'],
					'tid'   => $rad['tid'],
				);
			}
		}
	}
	$info['bekreftet'] = ! empty( $lagret['bekreftet'] ) && array() !== $info['apningstider'];
	$info['oppdatert'] = ( isset( $lagret['oppdatert'] ) && is_numeric( $lagret['oppdatert'] ) && (int) $lagret['oppdatert'] > 0 ) ? (int) $lagret['oppdatert'] : null;
	return $info;
}

add_action(
	'admin_init',
	function () {
		register_setting(
			'regina_butikkinfo',
			REGINA_BUTIKKINFO_OPSJON,
			array(
				'type'              => 'array',
				'sanitize_callback' => 'regina_butikkinfo_rens',
				'default'           => regina_butikkinfo_standard(),
				'show_in_rest'      => false,
			)
		);
	}
);

// options.php krever ellers manage_options; butikkansvarlig skal kunne lagre.
add_filter(
	'option_page_capability_regina_butikkinfo',
	function () {
		return REGINA_BUTIKKINFO_RETTIGHET;
	}
);

/**
 * Renser skjemaet. Tåler å bli kalt to ganger (WordPress gjør det første gang opsjonen lagres).
 *
 * @param mixed $inn Fra skjemaet (eller allerede renset verdi).
 * @return array
 */
function regina_butikkinfo_rens( $inn ) {
	$gammel = regina_butikkinfo_hent();
	$rader  = array();
	$kilde  = ( is_array( $inn ) && isset( $inn['apningstider'] ) && is_array( $inn['apningstider'] ) ) ? $inn['apningstider'] : array();

	foreach ( $kilde as $rad ) {
		if ( ! is_array( $rad ) ) {
			continue;
		}
		$dager = mb_substr( sanitize_text_field( isset( $rad['dager'] ) && is_string( $rad['dager'] ) ? $rad['dager'] : '' ), 0, 60 );
		$tid   = mb_substr( sanitize_text_field( isset( $rad['tid'] ) && is_string( $rad['tid'] ) ? $rad['tid'] : '' ), 0, 60 );
		if ( '' === $dager && '' === $tid ) {
			continue;
		}
		if ( '' === $dager || '' === $tid ) {
			add_settings_error( REGINA_BUTIKKINFO_OPSJON, 'regina_halv_rad', 'En linje manglet dag/periode eller tid og ble ikke lagret: «' . ( '' === $dager ? $tid : $dager ) . '».' );
			continue;
		}
		$rader[] = array(
			'dager' => $dager,
			'tid'   => $tid,
		);
		if ( count( $rader ) >= REGINA_BUTIKKINFO_MAKS_RADER ) {
			break;
		}
	}

	$bekreftet = is_array( $inn ) && ! empty( $inn['bekreftet'] ) && array() !== $rader;
	$endret    = $rader !== $gammel['apningstider'] || $bekreftet !== $gammel['bekreftet'];

	return array(
		'apningstider' => $rader,
		'bekreftet'    => $bekreftet,
		'oppdatert'    => $endret ? time() : $gammel['oppdatert'],
	);
}

// Revalidering når opsjonen faktisk endres (update_option_* kjører ikke når verdien er lik).
add_action(
	'add_option_' . REGINA_BUTIKKINFO_OPSJON,
	function () {
		regina_revalider( 'butikk' );
	}
);
add_action(
	'update_option_' . REGINA_BUTIKKINFO_OPSJON,
	function () {
		regina_revalider( 'butikk' );
	}
);

add_action(
	'admin_menu',
	function () {
		add_options_page( 'Regina butikkinfo', 'Regina butikkinfo', REGINA_BUTIKKINFO_RETTIGHET, 'regina-butikkinfo', 'regina_butikkinfo_side' );
	}
);

/**
 * Innstillingssiden.
 */
function regina_butikkinfo_side() {
	if ( ! current_user_can( REGINA_BUTIKKINFO_RETTIGHET ) ) {
		return;
	}
	$info  = regina_butikkinfo_hent();
	$rader = $info['apningstider'];
	for ( $i = count( $rader ); $i < min( count( $rader ) + 3, REGINA_BUTIKKINFO_MAKS_RADER ); $i++ ) {
		$rader[] = array(
			'dager' => '',
			'tid'   => '',
		);
	}
	$navn = REGINA_BUTIKKINFO_OPSJON;
	?>
	<div class="wrap">
		<h1>Regina butikkinfo</h1>
		<p>Åpningstidene vises i den nye nettbutikken bare når «Bekreftet av butikken» er krysset av.</p>
		<?php // Meldinger fra lagringen vises av WordPress selv (options-head.php) for sider under Innstillinger. ?>
		<form method="post" action="options.php">
			<?php settings_fields( 'regina_butikkinfo' ); ?>
			<h2>Åpningstider</h2>
			<p class="description">Én linje per dag eller periode, f.eks. «Mandag–fredag» og «10–18». La linjer stå tomme for å fjerne dem.</p>
			<table class="widefat striped" style="max-width:40rem" role="presentation">
				<thead>
					<tr><th scope="col">Dag eller periode</th><th scope="col">Tid</th></tr>
				</thead>
				<tbody>
				<?php foreach ( $rader as $i => $rad ) : ?>
					<tr>
						<td><input type="text" class="regular-text" maxlength="60" aria-label="Dag eller periode, linje <?php echo (int) $i + 1; ?>" name="<?php echo esc_attr( $navn . '[apningstider][' . (int) $i . '][dager]' ); ?>" value="<?php echo esc_attr( $rad['dager'] ); ?>"></td>
						<td><input type="text" class="regular-text" maxlength="60" aria-label="Tid, linje <?php echo (int) $i + 1; ?>" name="<?php echo esc_attr( $navn . '[apningstider][' . (int) $i . '][tid]' ); ?>" value="<?php echo esc_attr( $rad['tid'] ); ?>"></td>
					</tr>
				<?php endforeach; ?>
				</tbody>
			</table>
			<p>
				<label>
					<input type="checkbox" name="<?php echo esc_attr( $navn . '[bekreftet]' ); ?>" value="1" <?php checked( $info['bekreftet'] ); ?>>
					<strong>Bekreftet av butikken</strong> – kryss bare av når butikken har bekreftet at tidene stemmer.
				</label>
			</p>
			<p class="description">
				Sist endret: <?php echo esc_html( $info['oppdatert'] ? wp_date( 'j. F Y H:i', $info['oppdatert'] ) : 'aldri' ); ?>.
				Offentlig adresse: <code><?php echo esc_html( rest_url( 'regina/v1/butikk' ) ); ?></code>
			</p>
			<?php submit_button( 'Lagre butikkinfo' ); ?>
		</form>

		<h2>Lagervarsler</h2>
		<p>
			Utsending av «Gi meg beskjed når den er tilbake»: <strong><?php echo esc_html( regina_varsling_sending_pa() ? 'PÅ' : 'AV' ); ?></strong>.
			Slås bare på etter godkjenning fra Flyd, med WP-CLI: <code>wp option update regina_varsling_send yes</code>
		</p>
	</div>
	<?php
}

/*
 * GET /wp-json/regina/v1/butikk
 */
add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'regina/v1',
			'/butikk',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => 'regina_butikkinfo_rest',
				'permission_callback' => '__return_true',
			)
		);
	}
);

/**
 * Svaret fra /regina/v1/butikk.
 *
 * @return WP_REST_Response
 */
function regina_butikkinfo_rest() {
	$info = regina_butikkinfo_hent();
	return rest_ensure_response(
		array(
			'apningstider' => $info['apningstider'],
			'bekreftet'    => (bool) $info['bekreftet'],
			'oppdatert'    => null === $info['oppdatert'] ? null : regina_iso( $info['oppdatert'] ),
		)
	);
}
