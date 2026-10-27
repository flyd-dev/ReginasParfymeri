// Klokken på serveren, samlet ett sted. Sider som viser «Nyhet» eller kampanjer revalideres jevnlig,
// så tidspunktet blir aldri eldre enn revalideringstiden.
export function naa(): Date {
  return new Date()
}

/** Antall dager et produkt regnes som nyhet etter at det ble publisert i WooCommerce. */
export const NYHET_DAGER = 45
