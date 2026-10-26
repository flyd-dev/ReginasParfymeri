import { beforeEach, describe, expect, it, vi } from 'vitest'

class Lagring {
  data = new Map<string, string>()
  feil = false
  getItem(k: string) {
    if (this.feil) throw new Error('blokkert')
    return this.data.get(k) ?? null
  }
  setItem(k: string, v: string) {
    if (this.feil) throw new Error('blokkert')
    this.data.set(k, v)
  }
}

const linje = {
  produktId: 1,
  variantId: null,
  slug: 'a',
  merke: null,
  navn: 'A',
  variantTekst: null,
  bilde: null,
  enhetspris: 10000,
  maks: 5,
}

let lagring: Lagring

beforeEach(() => {
  vi.resetModules()
  lagring = new Lagring()
  vi.stubGlobal('window', { localStorage: lagring, addEventListener() {}, removeEventListener() {} })
})

describe('kurvlageret', () => {
  it('gir samme objekt så lenge innholdet er likt', async () => {
    const { endre, hentLinjer } = await import('./lager')
    expect(hentLinjer()).toBe(hentLinjer())
    endre({ type: 'legg-til', linje, antall: 2 })
    const a = hentLinjer()
    expect(a).toBe(hentLinjer())
    expect(a[0]?.antall).toBe(2)
  })

  it('tømmes når en annen fane tømmer lagringen', async () => {
    const { endre, hentLinjer } = await import('./lager')
    endre({ type: 'legg-til', linje, antall: 1 })
    lagring.data.clear()
    expect(hentLinjer()).toEqual([])
  })

  it('forkaster ugyldige linjer fra lagringen', async () => {
    lagring.data.set(
      'regina-kurv-v1',
      JSON.stringify({
        versjon: 1,
        linjer: [
          { ...linje, antall: -1 },
          { ...linje, antall: 1, produktId: 2, enhetspris: 1.5 },
          { ...linje, antall: 1 },
        ],
      }),
    )
    const { hentLinjer } = await import('./lager')
    expect(hentLinjer().map((l) => l.produktId)).toEqual([1])
  })

  it('virker i minnet når lagringen er blokkert', async () => {
    lagring.feil = true
    const { endre, hentLinjer } = await import('./lager')
    endre({ type: 'legg-til', linje, antall: 1 })
    expect(hentLinjer()[0]?.antall).toBe(1)
  })
})
