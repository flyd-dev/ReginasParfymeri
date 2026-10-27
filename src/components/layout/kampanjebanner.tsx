'use client'

// Kampanjebanner fra WordPress (tekst, lenke, start og slutt). Serveren sender aktive og kommende kampanjer;
// her sjekkes klokken på nytt, så banneret forsvinner straks sluttdatoen passeres – også på en side som ble
// bygget før (ISR). Uten JavaScript vises det serveren mente var aktivt da siden ble laget.

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Kampanje } from '@/lib/woocommerce/kampanje'

function aktiv(k: Kampanje, naa: number) {
  return Date.parse(k.start) <= naa && naa < Date.parse(k.slutt)
}

export function Kampanjebanner({ kampanjer, bygget }: { kampanjer: Kampanje[]; bygget: number }) {
  const [naa, setNaa] = useState(bygget)

  useEffect(() => {
    let tid: ReturnType<typeof setTimeout> | undefined
    const oppdater = () => {
      const t = Date.now()
      setNaa(t)
      const neste = kampanjer
        .flatMap((k) => [Date.parse(k.start), Date.parse(k.slutt)])
        .filter((x) => x > t)
        .sort((a, b) => a - b)[0]
      // setTimeout tåler ikke mer enn ~24 dager
      if (neste !== undefined) tid = setTimeout(oppdater, Math.min(neste - t + 500, 2 ** 31 - 1))
    }
    oppdater()
    return () => clearTimeout(tid)
  }, [kampanjer])

  const k = kampanjer.find((x) => aktiv(x, naa))
  if (!k) return null
  return (
    <div className="border-b border-sand-200 bg-sand-100">
      <p className="mx-auto max-w-screen-2xl px-4 py-2.5 text-center text-sm md:px-6">
        <span>{k.tekst}</span>
        {k.lenke && (
          <>
            {' '}
            <Link
              href={k.lenke}
              className="font-medium text-regina-plum underline underline-offset-4 hover:text-regina-pink-strong"
            >
              {k.lenketekst ?? 'Les mer'}
            </Link>
          </>
        )}
      </p>
    </div>
  )
}
