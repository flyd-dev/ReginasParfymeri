<?php
/**
 * Plugin Name: Regina headless
 * Description: Bro mellom den nye Next.js-flaten og WooCommerce: kurvoverføring til kassen, kampanjebannere, butikkinfo, lagervarsler og revalidering. Fase 0 (spike) – ikke godkjent før den er testet i staging.
 * Version:     0.1.0
 * Author:      Flyd
 * Requires PHP: 7.4
 *
 * Laster filene i mappen regina-headless/. WordPress laster bare PHP-filer som ligger rett i
 * mu-plugins/, ikke undermapper – derfor denne lasteren.
 *
 * Konstanter i wp-config.php (alle valgfrie, se docs/architecture.md):
 *   REGINA_REVALIDATE_URL     – f.eks. https://www.reginaparfymeri.no/api/revalidate
 *   REGINA_REVALIDATE_SECRET  – delt hemmelighet for X-Regina-Signature (aldri i git)
 *   REGINA_TILLIT_PROXY       – IP-er (kommaseparert) som får sende X-Forwarded-For, f.eks. Next.js-serveren
 *   REGINA_FRONTEND_URL       – adressen til den nye flaten, brukes i lenken i lagervarsel-e-posten
 *
 * Opsjon (AV som standard): regina_varsling_send = yes slår på utsending av lagervarsler.
 *
 * @package Regina
 */

defined( 'ABSPATH' ) || exit;

if ( defined( 'REGINA_HEADLESS_VERSJON' ) ) {
	return;
}

define( 'REGINA_HEADLESS_VERSJON', '0.1.0' );
define( 'REGINA_HEADLESS_MAPPE', __DIR__ . '/regina-headless' );

foreach ( array( 'felles', 'kurvtoken', 'revalidering', 'kurvoverforing', 'kampanjer', 'butikkinfo', 'varsling' ) as $regina_fil ) {
	require_once REGINA_HEADLESS_MAPPE . '/' . $regina_fil . '.php';
}
unset( $regina_fil );
