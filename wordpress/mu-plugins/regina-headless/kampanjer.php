<?php
/**
 * Kampanjebanner: innholdstypen regina_kampanje og GET /wp-json/regina/v1/kampanjer.
 *
 * - Ikke offentlig på WordPress-siden (ingen adresse, arkiv eller søk), men redigerbar i admin.
 * - Felter i en enkel metaboks (ingen ACF): tekst, lenke, lenketekst, start og slutt. Tidene skrives inn og
 *   vises i butikkens tidssone (Innstillinger → Generelt) og lagres som Unix-tid.
 * - En kampanje uten sluttidspunkt kan ikke publiseres – den lagres som kladd med en melding. Slik
 *   forsvinner hver kampanje av seg selv.
 * - Endepunktet gir publiserte kampanjer som er aktive nå eller starter innen 14 dager.
 * - Lagring, sletting og start/slutt ber den nye flaten revalidere taggen «kampanjer».
 *
 * @package Regina
 */

defined( 'ABSPATH' ) || exit;

define( 'REGINA_KAMPANJE_TYPE', 'regina_kampanje' );
define( 'REGINA_KAMPANJE_VINDU', 14 * DAY_IN_SECONDS );
define( 'REGINA_KAMPANJE_MAKS_TEKST', 200 );
define( 'REGINA_KAMPANJE_MAKS_LENKETEKST', 60 );

add_action( 'init', 'regina_kampanje_registrer' );

/**
 * Registrerer innholdstypen.
 */
function regina_kampanje_registrer() {
	register_post_type(
		REGINA_KAMPANJE_TYPE,
		array(
			'labels'              => array(
				'name'               => 'Kampanjebannere',
				'singular_name'      => 'Kampanjebanner',
				'menu_name'          => 'Kampanjebannere',
				'all_items'          => 'Alle kampanjebannere',
				'add_new'            => 'Legg til',
				'add_new_item'       => 'Legg til kampanjebanner',
				'edit_item'          => 'Rediger kampanjebanner',
				'new_item'           => 'Nytt kampanjebanner',
				'search_items'       => 'Søk i kampanjebannere',
				'not_found'          => 'Ingen kampanjebannere',
				'not_found_in_trash' => 'Ingen kampanjebannere i papirkurven',
			),
			'description'         => 'Banner øverst på den nye nettbutikken. Vises bare mellom start og slutt.',
			'public'              => false,
			'publicly_queryable'  => false,
			'exclude_from_search' => true,
			'show_ui'             => true,
			'show_in_menu'        => true,
			'show_in_nav_menus'   => false,
			'show_in_admin_bar'   => false,
			'show_in_rest'        => false, // Klassisk redigering med metaboks; endepunktet under er det offentlige.
			'has_archive'         => false,
			'rewrite'             => false,
			'query_var'           => false,
			'menu_position'       => 56,
			'menu_icon'           => 'dashicons-megaphone',
			'supports'            => array( 'title' ),
			'capability_type'     => 'post',
			'map_meta_cap'        => true,
		)
	);
}

add_filter(
	'enter_title_here',
	function ( $tekst, $post ) {
		return ( $post instanceof WP_Post && REGINA_KAMPANJE_TYPE === $post->post_type ) ? 'Internt navn (vises ikke i butikken)' : $tekst;
	},
	10,
	2
);

/*
 * Metaboks.
 */
add_action(
	'add_meta_boxes_' . REGINA_KAMPANJE_TYPE,
	function () {
		add_meta_box( 'regina_kampanje_felter', 'Banner', 'regina_kampanje_metaboks', REGINA_KAMPANJE_TYPE, 'normal', 'high' );
	}
);

/**
 * Tegner metaboksen.
 *
 * @param WP_Post $post Kampanjen.
 */
function regina_kampanje_metaboks( $post ) {
	$tekst      = (string) get_post_meta( $post->ID, '_regina_tekst', true );
	$lenke      = (string) get_post_meta( $post->ID, '_regina_lenke', true );
	$lenketekst = (string) get_post_meta( $post->ID, '_regina_lenketekst', true );
	$start      = regina_kampanje_meta_tid( $post->ID, '_regina_start' );
	$slutt      = regina_kampanje_meta_tid( $post->ID, '_regina_slutt' );
	$sone       = wp_timezone_string();

	wp_nonce_field( 'regina_kampanje_lagre', 'regina_kampanje_nonce' );
	?>
	<table class="form-table" role="presentation">
		<tr>
			<th scope="row"><label for="regina_tekst">Tekst</label></th>
			<td>
				<input type="text" class="large-text" id="regina_tekst" name="regina_kampanje[tekst]" maxlength="<?php echo (int) REGINA_KAMPANJE_MAKS_TEKST; ?>" value="<?php echo esc_attr( $tekst ); ?>">
				<p class="description">Det som står i banneret. Bare fakta som stemmer i hele perioden – ingen påfunne rabatter eller frister.</p>
			</td>
		</tr>
		<tr>
			<th scope="row"><label for="regina_lenke">Lenke</label></th>
			<td>
				<input type="text" class="large-text" id="regina_lenke" name="regina_kampanje[lenke]" value="<?php echo esc_attr( $lenke ); ?>" placeholder="/merker/initio eller https://…">
				<p class="description">Valgfri. En sti i den nye nettbutikken (begynner med /) eller en full https-adresse.</p>
			</td>
		</tr>
		<tr>
			<th scope="row"><label for="regina_lenketekst">Lenketekst</label></th>
			<td>
				<input type="text" class="regular-text" id="regina_lenketekst" name="regina_kampanje[lenketekst]" maxlength="<?php echo (int) REGINA_KAMPANJE_MAKS_LENKETEKST; ?>" value="<?php echo esc_attr( $lenketekst ); ?>">
			</td>
		</tr>
		<tr>
			<th scope="row"><label for="regina_start">Start</label></th>
			<td>
				<input type="datetime-local" id="regina_start" name="regina_kampanje[start]" value="<?php echo esc_attr( $start ? wp_date( 'Y-m-d\TH:i', $start ) : '' ); ?>">
				<p class="description">Tom = fra den publiseres. Tidssone: <?php echo esc_html( $sone ); ?>.</p>
			</td>
		</tr>
		<tr>
			<th scope="row"><label for="regina_slutt">Slutt (påkrevd for å publisere)</label></th>
			<td>
				<?php // Ikke «required» i HTML: da kunne heller ikke en kladd lagres. Vakta under stopper publisering. ?>
				<input type="datetime-local" id="regina_slutt" name="regina_kampanje[slutt]" value="<?php echo esc_attr( $slutt ? wp_date( 'Y-m-d\TH:i', $slutt ) : '' ); ?>">
				<p class="description">Banneret forsvinner av seg selv på dette tidspunktet. Uten slutt kan kampanjen ikke publiseres.</p>
			</td>
		</tr>
	</table>
	<?php
}

/**
 * Leser og renser skjemaet i metaboksen. Null hvis skjemaet ikke ble sendt (eller nonce er ugyldig),
 * f.eks. ved hurtigredigering.
 *
 * @return array{tekst: string, lenke: string, lenketekst: string, start: int|null, slutt: int|null, start_ugyldig: bool, slutt_ugyldig: bool}|null
 */
function regina_kampanje_les_skjema() {
	if ( ! isset( $_POST['regina_kampanje_nonce'], $_POST['regina_kampanje'] ) || ! is_array( $_POST['regina_kampanje'] ) ) {
		return null;
	}
	if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['regina_kampanje_nonce'] ) ), 'regina_kampanje_lagre' ) ) {
		return null;
	}
	$inn = wp_unslash( $_POST['regina_kampanje'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Renses felt for felt under.

	$start_raa = isset( $inn['start'] ) && is_string( $inn['start'] ) ? trim( $inn['start'] ) : '';
	$slutt_raa = isset( $inn['slutt'] ) && is_string( $inn['slutt'] ) ? trim( $inn['slutt'] ) : '';
	$start     = regina_kampanje_tolk_tid( $start_raa );
	$slutt     = regina_kampanje_tolk_tid( $slutt_raa );

	return array(
		'tekst'         => mb_substr( sanitize_text_field( isset( $inn['tekst'] ) && is_string( $inn['tekst'] ) ? $inn['tekst'] : '' ), 0, REGINA_KAMPANJE_MAKS_TEKST ),
		'lenke'         => regina_kampanje_rens_lenke( isset( $inn['lenke'] ) && is_string( $inn['lenke'] ) ? $inn['lenke'] : '' ),
		'lenketekst'    => mb_substr( sanitize_text_field( isset( $inn['lenketekst'] ) && is_string( $inn['lenketekst'] ) ? $inn['lenketekst'] : '' ), 0, REGINA_KAMPANJE_MAKS_LENKETEKST ),
		'start'         => $start,
		'slutt'         => $slutt,
		'start_ugyldig' => '' !== $start_raa && null === $start,
		'slutt_ugyldig' => '' !== $slutt_raa && null === $slutt,
	);
}

/**
 * Tolker verdien fra <input type="datetime-local"> i butikkens tidssone.
 *
 * Avviser datoer som ikke finnes (31. februar) og klokkeslett som hoppes over ved overgang til sommertid.
 *
 * @param string $verdi F.eks. 2026-11-01T09:00.
 * @return int|null Unix-tid.
 */
function regina_kampanje_tolk_tid( $verdi ) {
	if ( '' === $verdi ) {
		return null;
	}
	foreach ( array( 'Y-m-d\TH:i', 'Y-m-d\TH:i:s' ) as $format ) {
		$dato = DateTimeImmutable::createFromFormat( '!' . $format, $verdi, wp_timezone() );
		if ( $dato instanceof DateTimeImmutable && $dato->format( $format ) === $verdi ) {
			return $dato->getTimestamp();
		}
	}
	return null;
}

/**
 * Renser lenken: en sti på den nye flaten (/…) eller en http(s)-adresse. Alt annet blir tomt.
 *
 * @param string $verdi Fra skjemaet.
 * @return string
 */
function regina_kampanje_rens_lenke( $verdi ) {
	$verdi = trim( $verdi );
	if ( '' === $verdi || false !== strpos( $verdi, '\\' ) ) {
		return '';
	}
	if ( '/' === $verdi[0] ) {
		// Intern sti. «//» ville vært en adresse til et annet nettsted.
		return ( isset( $verdi[1] ) && '/' === $verdi[1] ) ? '' : esc_url_raw( $verdi );
	}
	return esc_url_raw( $verdi, array( 'https', 'http' ) );
}

/**
 * Lagret tidspunkt som heltall, eller null.
 *
 * @param int    $post_id Kampanje.
 * @param string $nokkel  _regina_start eller _regina_slutt.
 * @return int|null
 */
function regina_kampanje_meta_tid( $post_id, $nokkel ) {
	$verdi = get_post_meta( $post_id, $nokkel, true );
	return ( is_numeric( $verdi ) && (int) $verdi > 0 ) ? (int) $verdi : null;
}

/**
 * Hvorfor kampanjen ikke kan publiseres, eller tom tekst hvis den kan.
 *
 * @param string   $tekst Bannerteksten.
 * @param int|null $start Start (null = fra publisering).
 * @param int|null $slutt Slutt.
 * @return string
 */
function regina_kampanje_publiseringsfeil( $tekst, $start, $slutt ) {
	if ( '' === trim( $tekst ) ) {
		return 'Bannerteksten mangler.';
	}
	if ( null === $slutt ) {
		return 'Kampanjen må ha et sluttidspunkt, så den forsvinner av seg selv.';
	}
	if ( $slutt <= ( null === $start ? time() : $start ) ) {
		return 'Sluttidspunktet må være etter starttidspunktet.';
	}
	if ( $slutt <= time() ) {
		return 'Sluttidspunktet har allerede passert.';
	}
	return '';
}

/*
 * Vakt: en kampanje uten gyldig slutt lagres som kladd i stedet for å publiseres. Gjelder vanlig lagring,
 * hurtigredigering, masseredigering og WP-CLI, fordi alt går gjennom wp_insert_post_data.
 */
add_filter( 'wp_insert_post_data', 'regina_kampanje_vakt', 10, 2 );

/**
 * Stopper publisering uten gyldig sluttidspunkt.
 *
 * @param array $data    Innleggsdata som skal lagres.
 * @param array $postarr Rådata.
 * @return array
 */
function regina_kampanje_vakt( $data, $postarr ) {
	if ( REGINA_KAMPANJE_TYPE !== $data['post_type'] || ! in_array( $data['post_status'], array( 'publish', 'future' ), true ) ) {
		return $data;
	}

	$id     = isset( $postarr['ID'] ) ? (int) $postarr['ID'] : 0;
	$skjema = regina_kampanje_les_skjema();

	if ( null !== $skjema ) {
		if ( $skjema['start_ugyldig'] || $skjema['slutt_ugyldig'] ) {
			$feil = 'Start eller slutt er ikke et gyldig tidspunkt.';
		} else {
			$feil = regina_kampanje_publiseringsfeil( $skjema['tekst'], $skjema['start'], $skjema['slutt'] );
		}
	} else {
		$feil = regina_kampanje_publiseringsfeil(
			$id ? (string) get_post_meta( $id, '_regina_tekst', true ) : '',
			$id ? regina_kampanje_meta_tid( $id, '_regina_start' ) : null,
			$id ? regina_kampanje_meta_tid( $id, '_regina_slutt' ) : null
		);
	}

	if ( '' !== $feil ) {
		$data['post_status'] = 'draft';
		$GLOBALS['regina_kampanje_stoppet'] = true; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		set_transient( 'regina_kampanje_varsel_' . get_current_user_id(), 'Kampanjen ble lagret som kladd og er ikke publisert: ' . $feil, MINUTE_IN_SECONDS );
	}
	return $data;
}

// Når vakta slo til, skal WordPress ikke si «Innlegg publisert».
add_filter(
	'redirect_post_location',
	function ( $adresse ) {
		return empty( $GLOBALS['regina_kampanje_stoppet'] ) ? $adresse : add_query_arg( 'message', 10, $adresse );
	}
);

add_action(
	'admin_notices',
	function () {
		$nokkel = 'regina_kampanje_varsel_' . get_current_user_id();
		$tekst  = get_transient( $nokkel );
		if ( is_string( $tekst ) && '' !== $tekst ) {
			delete_transient( $nokkel );
			echo '<div class="notice notice-error"><p>' . esc_html( $tekst ) . '</p></div>';
		}
	}
);

/*
 * Lagring av feltene.
 */
add_action( 'save_post_' . REGINA_KAMPANJE_TYPE, 'regina_kampanje_lagre', 10, 2 );

/**
 * Lagrer metafeltene, setter start ved publisering og ber om revalidering.
 *
 * @param int     $post_id Kampanje.
 * @param WP_Post $post    Kampanjen.
 */
function regina_kampanje_lagre( $post_id, $post ) {
	if ( wp_is_post_autosave( $post_id ) || wp_is_post_revision( $post_id ) ) {
		return;
	}

	$skjema = regina_kampanje_les_skjema();
	if ( null !== $skjema && current_user_can( 'edit_post', $post_id ) ) {
		update_post_meta( $post_id, '_regina_tekst', $skjema['tekst'] );
		update_post_meta( $post_id, '_regina_lenke', $skjema['lenke'] );
		update_post_meta( $post_id, '_regina_lenketekst', $skjema['lenketekst'] );
		foreach ( array(
			'_regina_start' => $skjema['start'],
			'_regina_slutt' => $skjema['slutt'],
		) as $nokkel => $tid ) {
			if ( null === $tid ) {
				delete_post_meta( $post_id, $nokkel );
			} else {
				update_post_meta( $post_id, $nokkel, $tid );
			}
		}
	}

	// Tom start betyr «fra publisering».
	if ( 'publish' === $post->post_status && null === regina_kampanje_meta_tid( $post_id, '_regina_start' ) ) {
		update_post_meta( $post_id, '_regina_start', time() );
	}

	regina_kampanje_planlegg_grenser( $post_id );
	regina_revalider( 'kampanjer' );
}

// Statusendringer (publiser, avpubliser, papirkurv, gjenopprett) og sletting.
add_action(
	'transition_post_status',
	function ( $ny, $gammel, $post ) {
		if ( $post instanceof WP_Post && REGINA_KAMPANJE_TYPE === $post->post_type && $ny !== $gammel ) {
			regina_revalider( 'kampanjer' );
		}
	},
	10,
	3
);
add_action(
	'deleted_post',
	function ( $post_id, $post = null ) {
		if ( $post instanceof WP_Post && REGINA_KAMPANJE_TYPE === $post->post_type ) {
			regina_revalider( 'kampanjer' );
		}
	},
	10,
	2
);

/**
 * Planlegger revalidering når kampanjen kommer inn i 14-dagersvinduet, starter og slutter, så flaten
 * oppdateres selv om ingen lagrer noe. WP-Cron kjører ved trafikk; flaten skal uansett selv filtrere på tid.
 *
 * @param int $post_id Kampanje.
 */
function regina_kampanje_planlegg_grenser( $post_id ) {
	$start = regina_kampanje_meta_tid( $post_id, '_regina_start' );
	$slutt = regina_kampanje_meta_tid( $post_id, '_regina_slutt' );
	foreach ( array( $start ? $start - REGINA_KAMPANJE_VINDU : null, $start, $slutt ) as $tid ) {
		if ( null === $tid || $tid <= time() ) {
			continue;
		}
		$argumenter = array( (int) $post_id, (int) $tid );
		if ( ! wp_next_scheduled( 'regina_kampanje_grense', $argumenter ) ) {
			wp_schedule_single_event( $tid + 5, 'regina_kampanje_grense', $argumenter );
		}
	}
}

add_action(
	'regina_kampanje_grense',
	function () {
		regina_revalider( 'kampanjer' );
	}
);

/*
 * Kolonner i oversikten.
 */
add_filter(
	'manage_' . REGINA_KAMPANJE_TYPE . '_posts_columns',
	function ( $kolonner ) {
		$ut = array();
		foreach ( $kolonner as $nokkel => $navn ) {
			$ut[ $nokkel ] = $navn;
			if ( 'title' === $nokkel ) {
				$ut['regina_tekst'] = 'Tekst';
				$ut['regina_start'] = 'Start';
				$ut['regina_slutt'] = 'Slutt';
				$ut['regina_naa']   = 'Nå';
			}
		}
		unset( $ut['date'] );
		return $ut;
	}
);

add_action(
	'manage_' . REGINA_KAMPANJE_TYPE . '_posts_custom_column',
	function ( $kolonne, $post_id ) {
		$start = regina_kampanje_meta_tid( $post_id, '_regina_start' );
		$slutt = regina_kampanje_meta_tid( $post_id, '_regina_slutt' );
		switch ( $kolonne ) {
			case 'regina_tekst':
				echo esc_html( (string) get_post_meta( $post_id, '_regina_tekst', true ) );
				break;
			case 'regina_start':
				echo esc_html( $start ? wp_date( 'j. M Y H:i', $start ) : '–' );
				break;
			case 'regina_slutt':
				echo esc_html( $slutt ? wp_date( 'j. M Y H:i', $slutt ) : 'Mangler' );
				break;
			case 'regina_naa':
				$naa = time();
				if ( 'publish' !== get_post_status( $post_id ) ) {
					$tilstand = 'Ikke publisert';
				} elseif ( $slutt && $slutt <= $naa ) {
					$tilstand = 'Utløpt';
				} elseif ( $start && $start > $naa ) {
					$tilstand = 'Kommer';
				} else {
					$tilstand = 'Vises';
				}
				echo esc_html( $tilstand );
				break;
		}
	},
	10,
	2
);

/*
 * GET /wp-json/regina/v1/kampanjer
 */
add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'regina/v1',
			'/kampanjer',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => 'regina_kampanje_rest',
				'permission_callback' => '__return_true',
			)
		);
	}
);

/**
 * Publiserte kampanjer som er aktive nå eller starter innen 14 dager, sortert etter start.
 *
 * @return WP_REST_Response [{ id, tekst, lenke, lenketekst, start, slutt }]
 */
function regina_kampanje_rest() {
	$naa      = time();
	$sporring = new WP_Query(
		array(
			'post_type'              => REGINA_KAMPANJE_TYPE,
			'post_status'            => 'publish',
			'posts_per_page'         => 20,
			'no_found_rows'          => true,
			'ignore_sticky_posts'    => true,
			'update_post_term_cache' => false,
			'meta_key'               => '_regina_start', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'orderby'                => array(
				'meta_value_num' => 'ASC',
				'ID'             => 'ASC',
			),
			'meta_query'             => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				'relation' => 'AND',
				array(
					'key'     => '_regina_slutt',
					'value'   => $naa,
					'compare' => '>',
					'type'    => 'NUMERIC',
				),
				array(
					'key'     => '_regina_start',
					'value'   => $naa + REGINA_KAMPANJE_VINDU,
					'compare' => '<=',
					'type'    => 'NUMERIC',
				),
			),
		)
	);

	$ut = array();
	foreach ( $sporring->posts as $post ) {
		$tekst = (string) get_post_meta( $post->ID, '_regina_tekst', true );
		$start = regina_kampanje_meta_tid( $post->ID, '_regina_start' );
		$slutt = regina_kampanje_meta_tid( $post->ID, '_regina_slutt' );
		if ( '' === $tekst || null === $start || null === $slutt ) {
			continue;
		}
		$lenke      = (string) get_post_meta( $post->ID, '_regina_lenke', true );
		$lenketekst = (string) get_post_meta( $post->ID, '_regina_lenketekst', true );
		$ut[]       = array(
			'id'         => (int) $post->ID,
			'tekst'      => $tekst,
			'lenke'      => '' === $lenke ? null : $lenke,
			'lenketekst' => '' === $lenke || '' === $lenketekst ? null : $lenketekst,
			'start'      => regina_iso( $start ),
			'slutt'      => regina_iso( $slutt ),
		);
	}

	return rest_ensure_response( $ut );
}
