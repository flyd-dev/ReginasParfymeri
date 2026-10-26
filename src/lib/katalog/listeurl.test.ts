import { describe, expect, it } from 'vitest'
import { listeUrl, veksle } from './listeurl'
import { TOMME_FILTRE } from './sporring'

const grunn = { filtre: TOMME_FILTRE, sortering: 'nyeste' as const, side: 1 }

describe('listeUrl', () => {
  it('gir ren adresse uten filtre', () => {
    expect(listeUrl('/kategori/duft', grunn)).toBe('/kategori/duft')
  })

  it('tar med filtre og sortering, og går til første side ved ny filtrering', () => {
    const t = { ...grunn, side: 3 }
    expect(
      listeUrl('/kategori/duft', t, { filtre: { ...TOMME_FILTRE, merke: ['creed', 'initio'], lager: true } }),
    ).toBe('/kategori/duft?merke=creed%2Cinitio&lager=1')
    expect(listeUrl('/kategori/duft', t, { sortering: 'pris-stigende' })).toBe(
      '/kategori/duft?sorter=pris-stigende',
    )
    expect(listeUrl('/kategori/duft', t, { side: 4 })).toBe('/kategori/duft?side=4')
  })

  it('beholder søket og bruker relevans som standard der', () => {
    expect(listeUrl('/sok', { ...grunn, sortering: 'relevans', sok: 'rose' })).toBe('/sok?q=rose')
    expect(listeUrl('/sok', { ...grunn, sortering: 'relevans', sok: 'rose' }, { sortering: 'navn' })).toBe(
      '/sok?q=rose&sorter=navn',
    )
  })
})

describe('veksle', () => {
  it('legger til og tar bort', () => {
    expect(veksle(['a'], 'b')).toEqual(['a', 'b'])
    expect(veksle(['a', 'b'], 'a')).toEqual(['b'])
  })
})
