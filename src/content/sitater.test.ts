// Sitater skal stå ordrett i Reginas egne tekster – ingen omskriving, ingen kundesitater.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { KILDER, NISJE } from './butikk'
import { SITATER } from './sitater'

interface Blokk {
  type: string
  runs?: { text: string }[]
}

const sider = JSON.parse(readFileSync(path.join(process.cwd(), 'data', 'pages.json'), 'utf8')) as {
  slug: string
  blocks: Blokk[]
}[]
const omOss = (sider.find((s) => s.slug === 'om-oss')?.blocks ?? [])
  .map((b) => (b.runs ?? []).map((r) => r.text).join(''))
  .join(' ')

describe('sitater', () => {
  it('har minst to sitater, alle med kilde', () => {
    expect(SITATER.length).toBeGreaterThanOrEqual(2)
    for (const s of SITATER) {
      expect(s.kilde).not.toBe('')
      expect(s.kontroll).not.toBe('')
    }
  })

  it.each(SITATER.filter((s) => s.kontroll === KILDER.omOss))(
    '«$tema» står ordrett i «Om oss» (data/pages.json)',
    (s) => {
      expect(omOss).toContain(s.tekst)
    },
  )

  it('sitater fra reginaparfymeri.no er Reginas egen tekst i butikk.ts', () => {
    for (const s of SITATER.filter((s) => s.kontroll === KILDER.hjemmeside)) {
      expect([NISJE.veiledning, NISJE.tekst]).toContain(s.tekst)
    }
  })
})
