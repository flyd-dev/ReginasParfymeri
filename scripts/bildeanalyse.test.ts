import { describe, expect, it } from 'vitest'
import { analyserKant } from './bildeanalyse'

function bilde(
  bredde: number,
  hoyde: number,
  farge: (x: number, y: number) => [number, number, number, number],
) {
  const data = new Uint8Array(bredde * hoyde * 4)
  for (let y = 0; y < hoyde; y++) for (let x = 0; x < bredde; x++) data.set(farge(x, y), (y * bredde + x) * 4)
  return data
}

describe('analyserKant', () => {
  it('kjenner igjen hvit bakgrunn også når produktet når kanten', () => {
    const data = bilde(20, 20, (x) => (x > 6 && x < 12 ? [20, 20, 20, 255] : [255, 255, 255, 255]))
    expect(analyserKant(data, 20, 20)).toEqual({ bakgrunn: 'hvit', flate: '#ffffff' })
  })
  it('måler lys grå studiobakgrunn', () => {
    const data = bilde(20, 20, () => [228, 228, 228, 255])
    expect(analyserKant(data, 20, 20)).toEqual({ bakgrunn: 'flat', flate: '#e4e4e4' })
  })
  it('kjenner igjen gjennomsiktige bilder', () => {
    expect(
      analyserKant(
        bilde(20, 20, () => [0, 0, 0, 0]),
        20,
        20,
      ).bakgrunn,
    ).toBe('transparent')
  })
  it('regner fargerike bakgrunner som foto', () => {
    expect(
      analyserKant(
        bilde(20, 20, (x, y) => [(x * 13) % 255, (y * 29) % 255, 120, 255]),
        20,
        20,
      ).bakgrunn,
    ).toBe('foto')
  })
})
