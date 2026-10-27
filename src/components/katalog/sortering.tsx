'use client'

import { useRouter } from 'next/navigation'

/** Sortering som nedtrekksliste. Uten JavaScript sendes skjemaet med knappen. */
export function Sortering({
  valgt,
  valg,
  skjulte,
}: {
  valgt: string
  valg: { id: string; navn: string; url: string }[]
  /** Øvrige parametre som skal følge med når skjemaet sendes uten JavaScript. */
  skjulte: Record<string, string>
}) {
  const router = useRouter()
  return (
    <form method="get" className="flex items-center gap-2">
      {Object.entries(skjulte).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <label htmlFor="sorter" className="text-sm text-sand-ink">
        Sorter
      </label>
      <select
        id="sorter"
        name="sorter"
        defaultValue={valgt}
        onChange={(e) => {
          const url = valg.find((v) => v.id === e.target.value)?.url
          if (url) router.push(url, { scroll: false })
        }}
        className="h-10 border border-input bg-paper px-3 pr-8 text-[0.9375rem]"
      >
        {valg.map((v) => (
          <option key={v.id} value={v.id}>
            {v.navn}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="h-10 border border-regina-plum px-3 text-sm">
          Sorter
        </button>
      </noscript>
    </form>
  )
}
