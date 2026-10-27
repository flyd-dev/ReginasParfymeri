// Bygget etter «Ecommerce Category Page» (Mohammad Shehadeh / Hirael, MIT) på 21st.dev – https://21st.dev/@mohammadshehadeh/components/ecommerce-04. Egen kode; ingen kode er kopiert.
//
// Fra forbildet: én rolig nedtrekksliste med pil i verktøylinjen over rutenettet, full bredde på mobil. Her en
// vanlig <select> i et GET-skjema, så sorteringen virker uten JavaScript.

'use client'

import { ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

/** Sortering som nedtrekksliste. Uten JavaScript sendes skjemaet med knappen. */
export function Sortering({
  valgt,
  valg,
  skjulte,
  className,
}: {
  valgt: string
  valg: { id: string; navn: string; url: string }[]
  /** Øvrige parametre som skal følge med når skjemaet sendes uten JavaScript. */
  skjulte: Record<string, string>
  className?: string
}) {
  const router = useRouter()
  return (
    <form method="get" className={cn('flex items-center gap-3', className)}>
      {Object.entries(skjulte).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <label htmlFor="sorter" className="sr-only text-sand-ink sm:not-sr-only sm:shrink-0">
        Sorter etter
      </label>
      <div className="relative min-w-0 flex-1 sm:flex-none">
        <select
          id="sorter"
          name="sorter"
          defaultValue={valgt}
          onChange={(e) => {
            const url = valg.find((v) => v.id === e.target.value)?.url
            if (url) router.push(url, { scroll: false })
          }}
          className="h-11 w-full appearance-none border border-input bg-paper pr-10 pl-3.5 transition-colors duration-(--dur-fast) hover:border-regina-plum sm:w-56"
        >
          {valg.map((v) => (
            <option key={v.id} value={v.id}>
              {v.navn}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-sand-ink"
          aria-hidden
        />
      </div>
      <noscript>
        <button type="submit" className="h-11 border border-regina-plum px-4">
          Sorter
        </button>
      </noscript>
    </form>
  )
}
