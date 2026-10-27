import { kroner } from '@/lib/format'
import type { Kurvmelding } from '@/lib/kurv/typer'

export function meldingstekst(m: Kurvmelding): string {
  switch (m.type) {
    case 'pris-endret':
      return `Prisen på ${m.navn} er endret fra ${kroner(m.fra)} til ${kroner(m.til)}.`
    case 'utsolgt':
      return `${m.navn} er dessverre utsolgt og er tatt ut av handlekurven.`
    case 'antall-justert':
      return `Vi har bare ${m.antall} igjen av ${m.navn}. Antallet er justert.`
    case 'fjernet':
      return `${m.navn} finnes ikke lenger i nettbutikken og er tatt ut av handlekurven.`
  }
}

export function Kurvmeldinger({ meldinger }: { meldinger: Kurvmelding[] }) {
  if (meldinger.length === 0) return null
  return (
    <ul className="space-y-1 border-l-2 border-regina-pink bg-paper px-4 py-3 text-sm" role="status">
      {meldinger.map((m, i) => (
        <li key={i}>{meldingstekst(m)}</li>
      ))}
    </ul>
  )
}
