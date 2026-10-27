import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { gyldigSignatur } from './signatur'

const kropp = '{"id":10481,"name":"GUINOT"}'
const signer = (k: string, n: string) => createHmac('sha256', n).update(k).digest('base64')

describe('webhook-signatur', () => {
  it('godtar riktig signatur', () => {
    expect(gyldigSignatur(kropp, signer(kropp, 'hemmelig'), 'hemmelig')).toBe(true)
  })
  it('avviser feil nøkkel, endret kropp, manglende signatur og manglende nøkkel', () => {
    expect(gyldigSignatur(kropp, signer(kropp, 'annen'), 'hemmelig')).toBe(false)
    expect(gyldigSignatur(`${kropp} `, signer(kropp, 'hemmelig'), 'hemmelig')).toBe(false)
    expect(gyldigSignatur(kropp, null, 'hemmelig')).toBe(false)
    expect(gyldigSignatur(kropp, signer(kropp, 'hemmelig'), undefined)).toBe(false)
    expect(gyldigSignatur(kropp, 'ikke-base64-!!', 'hemmelig')).toBe(false)
  })
})
