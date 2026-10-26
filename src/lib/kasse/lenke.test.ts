import { describe, expect, it } from 'vitest'
import { kassemodus, kasselenke } from './lenke'

const BUTIKK = 'https://nettbutikk.reginaparfymeri.no'

describe('kasselenke', () => {
  it('bruker variasjons-ID for variable produkter og produkt-ID ellers', () => {
    expect(
      kasselenke(BUTIKK, [
        { produktId: 6223, variantId: 6225, antall: 1 },
        { produktId: 10481, variantId: null, antall: 2 },
      ]),
    ).toBe('https://nettbutikk.reginaparfymeri.no/checkout-link/?products=6225:1,10481:2')
  })

  it('slår sammen like linjer', () => {
    expect(
      kasselenke(BUTIKK, [
        { produktId: 1, variantId: 2, antall: 1 },
        { produktId: 1, variantId: 2, antall: 2 },
      ]),
    ).toMatch(/products=2:3$/)
  })

  it('nekter tom kurv, ugyldige ID-er og ugyldige antall', () => {
    expect(() => kasselenke(BUTIKK, [])).toThrow()
    expect(() => kasselenke(BUTIKK, [{ produktId: -1, variantId: null, antall: 1 }])).toThrow()
    expect(() => kasselenke(BUTIKK, [{ produktId: 1, variantId: null, antall: 0 }])).toThrow()
    expect(() => kasselenke(BUTIKK, [{ produktId: 1, variantId: null, antall: 1.5 }])).toThrow()
  })
})

describe('kassemodus', () => {
  it('er konsept med mindre WooCommerce er valgt eksplisitt', () => {
    expect(kassemodus(undefined)).toBe('konsept')
    expect(kassemodus('ja')).toBe('konsept')
    expect(kassemodus('woocommerce')).toBe('woocommerce')
  })
})
