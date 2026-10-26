// Setter sammen katalogen av rådata fra WooCommerce. Ren funksjon – samme vei for
// lagret utdrag og live-lesing, så de to aldri kan gi ulik pris eller variant.

import type { Katalog, Katalogmeta, Merke, MerkeRef } from './typer'
import type { Avvik, Bildeanalyse } from './woo/mapping'
import { lagKategori, lagMerke, lagProdukt } from './woo/mapping'
import type { Raadata } from './woo/hent'
import type { WooProdukt } from './woo/storeApi'

export function byggKatalog(
  raa: Raadata,
  analyser: Record<string, Bildeanalyse>,
  meta: Omit<Katalogmeta, 'antallProdukter'>,
  avvik?: (a: Avvik) => void,
): Katalog {
  const merkeMedId = new Map(raa.merker.map((m) => [m.id, m]))
  const merkeForProdukt = new Map<number, MerkeRef>()
  for (const pm of raa.produktmerker) {
    const forste = pm['pwb-brand'].map((id) => merkeMedId.get(id)).find(Boolean)
    if (forste) merkeForProdukt.set(pm.id, lagMerke(forste, 0))
  }

  const variasjoner = new Map<number, WooProdukt>(raa.variasjoner.map((v) => [v.id, v]))
  const produkter = raa.produkter.map((p, i) =>
    lagProdukt(p, {
      merkeFor: (id) => merkeForProdukt.get(id) ?? null,
      analyse: (src) => analyser[src],
      variasjon: (id) => variasjoner.get(id),
      rekkefolge: i,
      avvik,
    }),
  )

  const antallPerMerke = new Map<number, number>()
  for (const p of produkter) {
    if (p.merke) antallPerMerke.set(p.merke.id, (antallPerMerke.get(p.merke.id) ?? 0) + 1)
  }
  const merker: Merke[] = raa.merker
    .map((m) => lagMerke(m, antallPerMerke.get(m.id) ?? 0))
    .sort((a, b) => a.navn.localeCompare(b.navn, 'nb'))

  return {
    produkter,
    kategorier: raa.kategorier.map(lagKategori),
    merker,
    meta: { ...meta, antallProdukter: produkter.length },
  }
}
