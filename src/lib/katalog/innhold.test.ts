import { describe, expect, it } from 'vitest'
import { finnDuftnoter, ingress, lagInnhold, tilLinjer } from './innhold'

describe('finnDuftnoter', () => {
  it('leser noter på egne linjer', () => {
    const html =
      '<p>En rik duft.</p><p>Toppnoter: Bergamott, røkelse, ingefær og krydderakkord.<br>Hjertenoter: Rose Centifolia.<br>Bunnoter: 80 år gammel oud, patchouli, sandeltre, myrra, lakrisrot og tonkabønne.</p>'
    expect(finnDuftnoter(tilLinjer(html))).toEqual({
      topp: ['Bergamott', 'Røkelse', 'Ingefær', 'Krydderakkord'],
      hjerte: ['Rose Centifolia'],
      bunn: ['80 år gammel oud', 'Patchouli', 'Sandeltre', 'Myrra', 'Lakrisrot', 'Tonkabønne'],
    })
  })

  it('leser noter som står på samme linje', () => {
    const noter = finnDuftnoter(['Toppnoter: sitron, mynte Hjertenoter: jasmin Basenoter: mosk'])
    expect(noter).toEqual({ topp: ['Sitron', 'Mynte'], hjerte: ['Jasmin'], bunn: ['Mosk'] })
  })

  it('tolker aldri løpende tekst som noter', () => {
    expect(finnDuftnoter(['Duften åpner med pistasj før appelsinblomst og tonkabønne tar over.'])).toBeNull()
  })

  it('krever minst to nivåer, så en tilfeldig «toppnote:» ikke blir en pyramide', () => {
    expect(finnDuftnoter(['Toppnoter: sitron'])).toBeNull()
  })
})

describe('lagInnhold', () => {
  it('lager avsnitt, overskrifter og lister – aldri HTML', () => {
    const blokker = lagInnhold(
      '<p>Nærende olje.<br />\nHOVEDINGREDIENSER OG EFFEKT:<br />\n&#8211; Argan<br />– Kamelia</p><script>alert(1)</script>',
      false,
    )
    expect(blokker).toEqual([
      { type: 'avsnitt', tekst: 'Nærende olje.' },
      { type: 'overskrift', tekst: 'Hovedingredienser og effekt' },
      { type: 'liste', punkter: ['Argan', 'Kamelia'] },
      { type: 'avsnitt', tekst: 'alert(1)' },
    ])
  })

  it('tar ut notelinjene når notene vises for seg', () => {
    const blokker = lagInnhold(
      '<p>Tekst.</p><p>Duftnoter</p><p>Toppnoter: A, B</p><p>Hjertenoter: C</p>',
      true,
    )
    expect(blokker).toEqual([{ type: 'avsnitt', tekst: 'Tekst.' }])
  })
})

describe('ingress', () => {
  it('kutter ved et ord', () => {
    expect(ingress([{ type: 'avsnitt', tekst: 'en to tre fire fem seks' }], 12)).toBe('en to tre…')
  })
})
