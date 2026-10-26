// Overgangen til Reginas kasse i WooCommerce.
//
// WooCommerce dokumenterer delbare kasse-lenker: /checkout-link/?products=ID:ANTALL,ID:ANTALL
// (https://woocommerce.com/document/creating-sharable-checkout-urls-in-woocommerce/). Variable
// produkter bruker variasjons-ID-en. IKKE verifisert mot Reginas butikk: vi har ikke kalt lenken,
// fordi det ville opprettet en handlekurv-økt i produksjon. Se docs/integrasjon-woocommerce.md.

export type Kassemodus = 'konsept' | 'woocommerce'

export function kassemodus(verdi = process.env.NEXT_PUBLIC_KASSE): Kassemodus {
  return verdi === 'woocommerce' ? 'woocommerce' : 'konsept'
}

export interface Kasselinje {
  produktId: number
  variantId: number | null
  antall: number
}

export function kasselenke(butikk: string, linjer: Kasselinje[]): string {
  if (linjer.length === 0) throw new Error('Handlekurven er tom.')
  const samlet = new Map<number, number>()
  for (const l of linjer) {
    const id = l.variantId ?? l.produktId
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error(`Ugyldig produkt-ID: ${id}`)
    if (!Number.isSafeInteger(l.antall) || l.antall < 1 || l.antall > 99)
      throw new Error(`Ugyldig antall: ${l.antall}`)
    samlet.set(id, (samlet.get(id) ?? 0) + l.antall)
  }
  const url = new URL('/checkout-link/', butikk)
  const produkter = [...samlet.entries()].map(([id, antall]) => `${id}:${antall}`).join(',')
  return `${url.toString()}?products=${produkter}`
}
