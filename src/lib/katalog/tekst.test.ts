import { describe, expect, it } from 'vitest'
import { dekodHtml, lagVisningsnavn, normaliserMal, roligeVersaler, sokbar } from './tekst'

describe('dekodHtml', () => {
  it('dekoder navngitte og numeriske entiteter', () => {
    expect(dekodHtml('CREED &#8211; Aventus')).toBe('CREED – Aventus')
    expect(dekodHtml('Camille&amp;Sand')).toBe('Camille&Sand')
    expect(dekodHtml('&#xF8;l &oslash;l')).toBe('øl øl')
  })
  it('lar ukjente entiteter stå', () => {
    expect(dekodHtml('&ukjent;')).toBe('&ukjent;')
  })
})

describe('normaliserMal', () => {
  it('skriver mål på norsk', () => {
    expect(normaliserMal('100ML')).toBe('100 ml')
    expect(normaliserMal('30 ML')).toBe('30 ml')
    expect(normaliserMal('Badesalt 800g')).toBe('Badesalt 800 g')
    expect(normaliserMal('Soap 100gr')).toBe('Soap 100 g')
    expect(normaliserMal('1,5 ml')).toBe('1,5 ml')
  })
})

describe('roligeVersaler', () => {
  it('gjør versalnavn rolige, med små småord og faste forkortelser', () => {
    expect(roligeVersaler('LAYTON EDP SPRAY')).toBe('Layton EdP Spray')
    expect(roligeVersaler('DELINA EXCLUSIF PARFUM')).toBe('Delina Exclusif Parfum')
    expect(roligeVersaler('GRIS CHARNEL EXTRAIT 100 ML')).toBe('Gris Charnel Extrait 100 Ml')
  })
  it('beholder navn som allerede har små bokstaver', () => {
    expect(roligeVersaler('Side Effect EdP')).toBe('Side Effect EdP')
    expect(roligeVersaler('In love with the cocos')).toBe('In love with the cocos')
  })
  it('beholder koder med tall', () => {
    expect(roligeVersaler('MOLECULE M01')).toBe('Molecule M01')
  })
})

describe('lagVisningsnavn', () => {
  it('tar bort merkeprefikset når merket vises for seg', () => {
    expect(lagVisningsnavn('CREED – Aventus edp', 'Creed')).toBe('Aventus edp')
    expect(lagVisningsnavn('PARFUMS DE MARLY – LAYTON EDP SPRAY', 'Parfums de Marly')).toBe(
      'Layton EdP Spray',
    )
    expect(lagVisningsnavn('INITIO – Side Effect EdP', 'Initio Parfums Privés')).toBe('Side Effect EdP')
  })
  it('kjenner igjen skrivefeil og varianter av merket', () => {
    expect(lagVisningsnavn('FUGUAZZI – Angel dust edp', 'Fugazzi')).toBe('Angel dust edp')
    expect(lagVisningsnavn('LÖVENGRIP – The Cure – Repair & Shine Conditioner', 'Löwengrip')).toBe(
      'The Cure – Repair & Shine Conditioner',
    )
  })
  it('beholder det som står etter merket i prefikset', () => {
    expect(lagVisningsnavn('AHAVA SOAP – Soothing Salt 100gr', 'AHAVA')).toBe('Soap – Soothing Salt 100 g')
  })
  it('tar bort merket når det står først uten tankestrek', () => {
    expect(lagVisningsnavn('MAVALA MINI COLOR 16 BAGHDAD', 'Mavala')).toBe('Mini Color 16 Baghdad')
    expect(lagVisningsnavn('MEMO African leather 75ml', 'Memo')).toBe('African leather 75\u00a0ml')
    expect(lagVisningsnavn('Creed', 'Creed')).toBe('Creed')
  })
  it('lar navnet være når prefikset ikke er merket', () => {
    expect(lagVisningsnavn('GRANDEPout | Plumping Lip Mask', 'Grande Cosmetics')).toBe(
      'GRANDEPout | Plumping Lip Mask',
    )
    expect(lagVisningsnavn('Pinsett – skrå', null)).toBe('Pinsett – skrå')
    expect(lagVisningsnavn('IDC – Glitter Øyemaske', null)).toBe('IDC – Glitter Øyemaske')
  })
})

describe('sokbar', () => {
  it('gjør søk uavhengig av aksenter og store bokstaver', () => {
    expect(sokbar('Löwengrip')).toBe('lowengrip')
    expect(sokbar('Hårspray')).toBe('harspray')
    expect(sokbar('Crème  Ø')).toBe('creme ø')
  })
})
