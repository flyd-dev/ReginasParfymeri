// Filtrene bor i adressen, så en filtrert liste kan deles, bokmerkes og gås tilbake til.

import type { Filtre, Sortering } from './sporring'

export interface Listetilstand {
  filtre: Filtre
  sortering: Sortering | 'relevans'
  side: number
  sok?: string
}

export function listeUrl(basis: string, t: Listetilstand, endring: Partial<Listetilstand> = {}): string {
  const n: Listetilstand = { ...t, ...endring, filtre: { ...t.filtre, ...endring.filtre } }
  // En ny filtrering starter alltid på første side.
  if (endring.filtre || endring.sortering) n.side = 1
  const p = new URLSearchParams()
  if (n.sok) p.set('q', n.sok)
  if (n.filtre.kategori.length) p.set('kategori', n.filtre.kategori.join(','))
  if (n.filtre.merke.length) p.set('merke', n.filtre.merke.join(','))
  if (n.filtre.pris.length) p.set('pris', n.filtre.pris.join(','))
  if (n.filtre.lager) p.set('lager', '1')
  if (n.filtre.tilbud) p.set('tilbud', '1')
  if (n.filtre.note) p.set('note', n.filtre.note)
  const standard = n.sok ? 'relevans' : 'nyeste'
  if (n.sortering !== standard) p.set('sorter', n.sortering)
  if (n.side > 1) p.set('side', String(n.side))
  const q = p.toString()
  return q ? `${basis}?${q}` : basis
}

export function veksle(liste: string[], verdi: string): string[] {
  return liste.includes(verdi) ? liste.filter((v) => v !== verdi) : [...liste, verdi]
}
