// Handlekurven i konseptet. Ren logikk – lagring i nettleseren og visning ligger i
// komponentene. Pris og lager valideres alltid mot katalogen (`validerKurv`) før de vises
// som gjeldende, så en gammel pris i nettleseren aldri blir stående.

import type { Bilde, Katalog, Ore, Produkt, Variant } from '../katalog/typer'

export interface Kurvlinje {
  produktId: number
  /** Variasjons-ID for variable produkter, ellers null. */
  variantId: number | null
  antall: number
  slug: string
  merke: string | null
  navn: string
  /** F.eks. «Størrelse: 50 ml». */
  variantTekst: string | null
  bilde: Bilde | null
  enhetspris: Ore
  maks: number
}

export type NyLinje = Omit<Kurvlinje, 'antall'>

export type Kurvhandling =
  | { type: 'legg-til'; linje: NyLinje; antall: number }
  | { type: 'sett-antall'; nokkel: string; antall: number }
  | { type: 'fjern'; nokkel: string }
  | { type: 'erstatt'; linjer: Kurvlinje[] }
  | { type: 'tom' }

export function nokkel(l: Pick<Kurvlinje, 'produktId' | 'variantId'>): string {
  return `${l.produktId}:${l.variantId ?? 0}`
}

function heltall(antall: number, maks: number): number {
  if (!Number.isFinite(antall)) return 1
  return Math.min(Math.max(Math.trunc(antall), 1), Math.max(maks, 1))
}

export function kurvReducer(linjer: Kurvlinje[], h: Kurvhandling): Kurvlinje[] {
  switch (h.type) {
    case 'legg-til': {
      if (h.antall < 1) return linjer
      const n = nokkel(h.linje)
      const eksisterende = linjer.find((l) => nokkel(l) === n)
      if (eksisterende) {
        return linjer.map((l) =>
          nokkel(l) === n ? { ...l, ...h.linje, antall: heltall(l.antall + h.antall, h.linje.maks) } : l,
        )
      }
      return [...linjer, { ...h.linje, antall: heltall(h.antall, h.linje.maks) }]
    }
    case 'sett-antall':
      return linjer.map((l) => (nokkel(l) === h.nokkel ? { ...l, antall: heltall(h.antall, l.maks) } : l))
    case 'fjern':
      return linjer.filter((l) => nokkel(l) !== h.nokkel)
    case 'erstatt':
      return h.linjer
    case 'tom':
      return []
  }
}

export function antallVarer(linjer: Kurvlinje[]): number {
  return linjer.reduce((s, l) => s + l.antall, 0)
}

export function delsum(linjer: Kurvlinje[]): Ore {
  return linjer.reduce((s, l) => s + l.enhetspris * l.antall, 0)
}

// ---------- Validering mot katalogen ----------

export type Linjestatus =
  | { type: 'ok' }
  | { type: 'pris-endret'; fra: Ore; til: Ore }
  | { type: 'antall-justert'; til: number }
  | { type: 'utsolgt' }
  | { type: 'finnes-ikke' }

export interface ValidertLinje {
  linje: Kurvlinje
  status: Linjestatus
  /** Kan linjen tas med til kassen? */
  gyldig: boolean
}

export function variantTekst(produkt: Produkt, variant: Variant): string {
  return produkt.egenskaper
    .map((e) => {
      const verdi = variant.valg[e.navn]
      const visning = e.verdier.find((v) => v.verdi === verdi)?.visning ?? verdi
      return visning ? `${e.navn}: ${visning}` : null
    })
    .filter(Boolean)
    .join(' · ')
}

/** Lager en kurvlinje av et produkt (og eventuelt valgt variant). Kaster hvis valget ikke er gyldig. */
export function lagLinje(produkt: Produkt, variantId: number | null): NyLinje {
  if (produkt.type === 'variabel') {
    const variant = produkt.varianter.find((v) => v.id === variantId)
    if (!variant) throw new Error('Velg variant før varen legges i handlekurven.')
    return {
      produktId: produkt.id,
      variantId: variant.id,
      slug: produkt.slug,
      merke: produkt.merke?.navn ?? null,
      navn: produkt.visningsnavn,
      variantTekst: variantTekst(produkt, variant),
      bilde: produkt.bilder[0] ?? null,
      enhetspris: variant.pris.pris,
      maks: variant.maks,
    }
  }
  if (variantId !== null) throw new Error('Produktet har ingen varianter.')
  return {
    produktId: produkt.id,
    variantId: null,
    slug: produkt.slug,
    merke: produkt.merke?.navn ?? null,
    navn: produkt.visningsnavn,
    variantTekst: null,
    bilde: produkt.bilder[0] ?? null,
    enhetspris: produkt.pris.pris,
    maks: produkt.maks,
  }
}

export function validerKurv(
  linjer: Pick<Kurvlinje, 'produktId' | 'variantId' | 'antall' | 'enhetspris'>[],
  k: Katalog,
): ValidertLinje[] {
  const etterId = new Map(k.produkter.map((p) => [p.id, p]))
  return linjer.map((l) => {
    const produkt = etterId.get(l.produktId)
    const ugyldig = (status: Linjestatus, grunnlag?: NyLinje): ValidertLinje => ({
      linje: grunnlag
        ? { ...grunnlag, antall: l.antall }
        : {
            produktId: l.produktId,
            variantId: l.variantId,
            antall: l.antall,
            slug: '',
            merke: null,
            navn: 'Varen finnes ikke lenger',
            variantTekst: null,
            bilde: null,
            enhetspris: l.enhetspris,
            maks: 1,
          },
      status,
      gyldig: false,
    })
    if (!produkt) return ugyldig({ type: 'finnes-ikke' })
    if ((produkt.type === 'variabel') !== (l.variantId !== null)) return ugyldig({ type: 'finnes-ikke' })
    const variant = l.variantId === null ? null : produkt.varianter.find((v) => v.id === l.variantId)
    if (l.variantId !== null && !variant) return ugyldig({ type: 'finnes-ikke' })

    const ny = lagLinje(produkt, l.variantId)
    const lager = variant ? variant.lager : produkt.lager
    const kjopbar = variant ? variant.kjopbar : produkt.kjopbar
    if (lager.status === 'utsolgt' || !kjopbar) return ugyldig({ type: 'utsolgt' }, ny)

    const antall = heltall(l.antall, ny.maks)
    const linje: Kurvlinje = { ...ny, antall }
    if (ny.enhetspris !== l.enhetspris) {
      return { linje, status: { type: 'pris-endret', fra: l.enhetspris, til: ny.enhetspris }, gyldig: true }
    }
    if (antall !== l.antall) return { linje, status: { type: 'antall-justert', til: antall }, gyldig: true }
    return { linje, status: { type: 'ok' }, gyldig: true }
  })
}

/**
 * Raskt kjøp fra produktkortet er bare lov når det ikke finnes noe valg å ta:
 * et enkelt produkt, eller et variabelt produkt med nøyaktig én variant.
 * Vi legger aldri en tilfeldig størrelse eller farge i kurven.
 */
export function hurtigkjop(p: Produkt): { variantId: number | null } | null {
  if (!p.kjopbar || p.lager.status === 'utsolgt') return null
  if (p.type === 'enkel') return { variantId: null }
  if (p.varianter.length === 1) {
    const eneste = p.varianter[0]
    if (eneste && eneste.kjopbar && eneste.lager.status !== 'utsolgt') return { variantId: eneste.id }
  }
  return null
}
