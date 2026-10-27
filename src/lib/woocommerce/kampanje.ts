// Kampanjebanneret: tekst, lenke, start og slutt fra WordPress (mu-pluginen) eller src/content/kampanjer.json.
// Rene funksjoner, brukt på serveren og testet i kampanje.test.ts.

export interface Kampanje {
  id: number
  tekst: string
  lenke: string | null
  lenketekst: string | null
  /** ISO 8601 med tidssone. */
  start: string
  slutt: string
}

/** Aktiv nå: startet og ikke utløpt. Brukes både på serveren og i nettleseren. */
export function erAktiv(k: Pick<Kampanje, 'start' | 'slutt'>, naa: Date): boolean {
  const start = Date.parse(k.start)
  const slutt = Date.parse(k.slutt)
  if (!Number.isFinite(start) || !Number.isFinite(slutt)) return false
  return start <= naa.getTime() && naa.getTime() < slutt
}

export function gyldigKampanje(k: unknown): k is Kampanje {
  if (typeof k !== 'object' || k === null) return false
  const x = k as Record<string, unknown>
  return (
    typeof x.id === 'number' &&
    typeof x.tekst === 'string' &&
    x.tekst.trim().length > 0 &&
    typeof x.start === 'string' &&
    typeof x.slutt === 'string' &&
    Number.isFinite(Date.parse(x.start)) &&
    Number.isFinite(Date.parse(x.slutt)) &&
    (x.lenke === null ||
      x.lenke === undefined ||
      (typeof x.lenke === 'string' && /^(\/|https:\/\/)/.test(x.lenke)))
  )
}
