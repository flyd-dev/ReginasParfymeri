'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import type { Bilde } from '@/lib/woocommerce/typer'

/**
 * Produktgalleri (opptil 8 bilder). Mobil: sveip mellom bildene (scroll-snap, virker uten JavaScript).
 * Stor skjerm: første bilde stort, resten i to kolonner – store bilder, ingen klikk for å se dem.
 */
export function Galleri({ bilder, navn }: { bilder: Bilde[]; navn: string }) {
  const liste = bilder.slice(0, 8)
  const [aktiv, setAktiv] = useState(0)
  const rull = useRef<HTMLUListElement>(null)

  if (liste.length === 0) {
    return (
      <div className="grid aspect-square place-items-center bg-paper text-sand-ink">
        Bilde mangler for {navn}
      </div>
    )
  }

  return (
    <div>
      <ul
        ref={rull}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] md:grid md:grid-cols-2 md:gap-3 md:overflow-visible [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => {
          const el = e.currentTarget
          setAktiv(Math.round(el.scrollLeft / el.clientWidth))
        }}
        aria-label={`Bilder av ${navn}`}
      >
        {liste.map((b, i) => (
          <li
            key={b.src}
            className={`relative aspect-square w-full shrink-0 snap-center bg-paper ${i === 0 ? 'md:col-span-2' : ''}`}
          >
            <Image
              src={b.src}
              alt={i === 0 ? b.alt : `${b.alt} – bilde ${i + 1} av ${liste.length}`}
              fill
              priority={i === 0}
              sizes={i === 0 ? '(min-width: 768px) 55vw, 100vw' : '(min-width: 768px) 27vw, 100vw'}
              className="object-contain p-[6%] mix-blend-multiply"
            />
          </li>
        ))}
      </ul>
      {liste.length > 1 && (
        <p className="mt-3 text-center text-sm text-sand-ink tabular-nums md:hidden" aria-hidden>
          {aktiv + 1} / {liste.length}
        </p>
      )}
    </div>
  )
}
