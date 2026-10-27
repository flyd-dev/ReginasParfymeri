// SEO: ingen adresser fra dagens butikk skal gå tapt (oppdraget §8).

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { produktUrl, kategoriUrl } from '@/lib/lenker'
import type { GammeltMerkeJson, KategoriJson, ProduktJson } from '@/lib/woocommerce/json-format'
import { gamleAdresser, merkeomdirigeringer } from './omdirigeringer'

const les = <T>(fil: string): T =>
  JSON.parse(readFileSync(path.join(process.cwd(), 'data', fil), 'utf8')) as T

describe('adressene fra dagens butikk', () => {
  it('alle produkter har samme adresse som før', () => {
    for (const p of les<ProduktJson[]>('products.json')) {
      expect(new URL(p.source_url).pathname, p.slug).toBe(produktUrl(p.slug))
    }
  })
  it('alle kategorier har samme adresse som før', () => {
    const stier = new Set<string>()
    const gaa = (k: KategoriJson[]) =>
      k.forEach((c) => (stier.add(kategoriUrl(c.path.split('/'))), gaa(c.children)))
    gaa(les<KategoriJson[]>('categories.json'))
    for (const p of les<ProduktJson[]>('products.json')) {
      for (const c of p.categories)
        expect(stier.has(kategoriUrl(c.path_slugs)), c.path_slugs.join('/')).toBe(true)
    }
  })
  it('gamle merkeadresser beholdes eller sendes videre', () => {
    const gamle = les<GammeltMerkeJson[]>('legacy_brands.json')
    const videre = new Map(merkeomdirigeringer(gamle).map((r) => [r.source, r.destination]))
    for (const m of gamle) {
      if (m.new_slug === m.slug) expect(videre.has(`/brand/${m.slug}/`)).toBe(false)
    }
    expect(videre.get('/brand/tweezerman/')).toBe('/merker/')
  })
  it('ingen omdirigering peker på seg selv', () => {
    for (const r of gamleAdresser()) expect(r.destination, r.source).not.toBe(r.source)
  })
})
