import { dato } from '@/lib/format'
import type { SideBlokkJson, SideJson, TekstbitJson } from '@/lib/woocommerce/json-format'

function Bit({ bit }: { bit: TekstbitJson }) {
  const tekst = bit.strong ? <strong>{bit.text}</strong> : bit.text
  if (!bit.href) return <>{tekst}</>
  // Lenker fra Reginas egne sider: bare http(s), e-post og telefon.
  if (!/^(https?:|mailto:|tel:|\/)/.test(bit.href)) return <>{tekst}</>
  return (
    <a href={bit.href} className="text-regina-pink-strong underline underline-offset-4">
      {tekst}
    </a>
  )
}

function Blokk({ blokk }: { blokk: SideBlokkJson }) {
  switch (blokk.type) {
    case 'heading':
      return <h2 className="mt-10 font-sans text-lg font-semibold first:mt-0">{blokk.text}</h2>
    case 'paragraph':
      return (
        <p>
          {blokk.runs.map((b, i) => (
            <Bit key={i} bit={b} />
          ))}
        </p>
      )
    case 'list':
      return (
        <ul className="list-disc space-y-1 pl-5">
          {blokk.items.map((punkt, i) => (
            <li key={i}>
              {punkt.map((b, j) => (
                <Bit key={j} bit={b} />
              ))}
            </li>
          ))}
        </ul>
      )
  }
}

const likt = (a: string, b: string) =>
  a.toLocaleLowerCase('nb').replace(/&/g, 'og').replace(/\s+/g, ' ').trim() ===
  b.toLocaleLowerCase('nb').replace(/&/g, 'og').replace(/\s+/g, ' ').trim()

/**
 * Reginas egne tekster (vilkår, frakt, retur, om oss, personvern) slik de står på dagens nettsider –
 * gjort om til rene tekstblokker, aldri rå HTML. `stopp` kutter ved en overskrift (f.eks. kontaktinfo).
 */
export function Sidetekst({ side, stopp, tittel }: { side: SideJson; stopp?: string; tittel: string }) {
  let blokker = side.blocks
  // Den første overskriften er ofte sidetittelen igjen.
  if (blokker[0]?.type === 'heading' && likt(blokker[0].text, tittel)) blokker = blokker.slice(1)
  if (stopp) {
    const i = blokker.findIndex((b) => b.type === 'heading' && likt(b.text, stopp))
    if (i >= 0) blokker = blokker.slice(0, i)
  }
  return (
    <div className="max-w-2xl space-y-4 text-[1.0625rem] leading-relaxed break-words">
      {blokker.map((b, i) => (
        <Blokk key={i} blokk={b} />
      ))}
      <p className="pt-6 text-sm text-sand-ink">Sist endret {dato(side.modified)}.</p>
    </div>
  )
}
