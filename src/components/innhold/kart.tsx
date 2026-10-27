'use client'

import { MapPin } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

/**
 * Kart lastes først når kunden ber om det: OpenStreetMap-innbyggingen sender IP-adressen til en tredjepart,
 * så ingenting hentes før klikket (personvern).
 */
export function Kart({ lenke }: { lenke: string }) {
  const [vis, setVis] = useState(false)
  // Haraldsgata 138, Haugesund – koordinater fra OpenStreetMap Nominatim (node 2817037540), 27.10.2026.
  const bbox = '5.2647,59.4110,5.2737,59.4144'
  const markor = '59.412669,5.269193'
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden border border-sand-200 bg-sand-100">
      {vis ? (
        <iframe
          title="Kart over Haraldsgata 138 i Haugesund"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${markor}`}
          className="absolute inset-0 size-full"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <div>
            <MapPin className="mx-auto size-6 text-regina-pink" aria-hidden />
            <p className="mt-3 max-w-xs text-sm text-sand-ink-deep">
              Kartet hentes fra OpenStreetMap når du ber om det.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => setVis(true)}>
                Vis kart
              </Button>
              <Button asChild variant="ghost">
                <a href={lenke} rel="noopener">
                  Åpne i Google Maps
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
