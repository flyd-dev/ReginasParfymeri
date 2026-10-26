// Måler bakgrunnen i et produktbilde ut fra pikslene langs kanten.
// Ren funksjon (RGBA-buffer inn), så den kan testes uten bildefiler.
//
// Pakkebilder går ofte helt ut i kanten på den beskårne miniatyren, så vi ser på hva
// som dominerer kanten – ikke om hele kanten er hvit.

import type { Bildeanalyse } from '../src/lib/katalog/woo/mapping'

function hex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
}

type Piksel = [number, number, number, number]

export function analyserKant(
  piksler: Uint8Array | Buffer,
  bredde: number,
  hoyde: number,
  kant = 2,
): Bildeanalyse {
  const kantpiksler: Piksel[] = []
  for (let y = 0; y < hoyde; y++) {
    for (let x = 0; x < bredde; x++) {
      if (x >= kant && x < bredde - kant && y >= kant && y < hoyde - kant) continue
      const i = (y * bredde + x) * 4
      kantpiksler.push([piksler[i] ?? 0, piksler[i + 1] ?? 0, piksler[i + 2] ?? 0, piksler[i + 3] ?? 0])
    }
  }
  const n = kantpiksler.length
  if (n === 0) return { bakgrunn: 'ukjent', flate: null }

  const gjennomsiktige = kantpiksler.filter((p) => p[3] < 16).length
  if (gjennomsiktige / n >= 0.6) return { bakgrunn: 'transparent', flate: null }

  // Lys og nøytral: alle kanaler høye og nesten like (hvitt eller lys grå studiobakgrunn).
  const lyse = kantpiksler.filter((p) => {
    const min = Math.min(p[0], p[1], p[2])
    const max = Math.max(p[0], p[1], p[2])
    return p[3] > 240 && min >= 215 && max - min <= 12
  })
  if (lyse.length / n >= 0.6) {
    const snitt = [0, 1, 2].map((k) => lyse.reduce((s, p) => s + p[k]!, 0) / lyse.length) as [
      number,
      number,
      number,
    ]
    const [r, g, b] = snitt
    return { bakgrunn: Math.min(r, g, b) >= 250 ? 'hvit' : 'flat', flate: hex(r, g, b) }
  }
  return { bakgrunn: 'foto', flate: null }
}
