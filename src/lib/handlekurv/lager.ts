// Handlekurven i nettleseren som en ekstern butikk for useSyncExternalStore.
// localStorage er sannheten (så flere faner holder seg like); virker ikke lagringen
// (privat modus, blokkert), lever kurven i minnet for denne fanen.

import { kurvReducer, type Kurvhandling, type Kurvlinje } from './kurv'

const NOKKEL = 'regina-kurv-v1'

let minne: Kurvlinje[] = []
let cache: { raa: string; linjer: Kurvlinje[] } | null = null
const lyttere = new Set<() => void>()

function gyldig(l: Kurvlinje): boolean {
  return (
    Number.isSafeInteger(l.produktId) &&
    (l.variantId === null || Number.isSafeInteger(l.variantId)) &&
    Number.isSafeInteger(l.antall) &&
    l.antall > 0 &&
    Number.isSafeInteger(l.enhetspris)
  )
}

const TOM: Kurvlinje[] = []

/** `undefined` når lagringen ikke kan leses (privat modus, blokkert). */
function lesRaa(): string | null | undefined {
  try {
    return window.localStorage.getItem(NOKKEL)
  } catch {
    return undefined
  }
}

export function tolk(raa: string | null): Kurvlinje[] {
  if (!raa) return []
  try {
    const data = JSON.parse(raa) as { versjon?: number; linjer?: Kurvlinje[] }
    if (data.versjon !== 1 || !Array.isArray(data.linjer)) return []
    return data.linjer.filter(gyldig)
  } catch {
    return []
  }
}

/** Øyeblikksbildet. Samme objekt så lenge innholdet er likt – det krever useSyncExternalStore. */
export function hentLinjer(): Kurvlinje[] {
  const raa = lesRaa()
  if (raa === undefined) return minne
  if (raa === null) return TOM
  if (cache?.raa === raa) return cache.linjer
  cache = { raa, linjer: tolk(raa) }
  return cache.linjer
}

/** På serveren finnes ingen kurv; `null` betyr «ikke lest ennå». */
export function hentLinjerServer(): null {
  return null
}

function varsle(): void {
  for (const l of lyttere) l()
}

export function abonner(lytter: () => void): () => void {
  lyttere.add(lytter)
  const vedLagring = (e: StorageEvent) => {
    if (e.key === NOKKEL) lytter()
  }
  window.addEventListener('storage', vedLagring)
  return () => {
    lyttere.delete(lytter)
    window.removeEventListener('storage', vedLagring)
  }
}

export function endre(h: Kurvhandling): void {
  const ny = kurvReducer(hentLinjer(), h)
  minne = ny
  try {
    window.localStorage.setItem(NOKKEL, JSON.stringify({ versjon: 1, linjer: ny }))
  } catch {
    // Lagringen er full eller blokkert: kurven lever videre i minnet for denne fanen.
  }
  varsle()
}
