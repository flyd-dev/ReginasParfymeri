'use client'

import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Inn } from '@/components/bevegelse/inn'
import type { Nisjemerke } from '@/lib/forside'
import { merkeUrl } from '@/lib/lenker'
import { cn } from '@/lib/utils'

/**
 * Nisjemerkene som nummerert liste med forhåndsvisning: peker eller fokus på en rad viser merkets mest solgte
 * flaske i rammen ved siden av. Mønsteret er fra 21st.dev («Interactive List Preview», hyperiux, MIT, og
 * «Hover Image List», educalvolpz, MIT), bygget her uten gsap/motion – bare opacity og transform. Byttet i
 * rammen er et teppe som i «Animated Slideshow» (youcefbnm, MIT,
 * https://21st.dev/@youcefbnm/components/animated-slideshow): den nye flasken avdekkes nedenfra mens den gamle
 * blir liggende under. Egen kode; ingen kode er kopiert.
 *
 * Mobil har ingen peker (R-31): hver rad har en liten flaske på papir, og raden midt på skjermen blir aktiv mens
 * kunden ruller – navnet glir litt inn og flasken løftes. Uten JavaScript er lista vanlige lenker med flasker,
 * og den første flasken står i rammen.
 */
export function Merkeliste({ merker }: { merker: Nisjemerke[] }) {
  const [{ aktiv, forrige }, setVis] = useState({ aktiv: 0, forrige: -1 })
  const [rullet, setRullet] = useState(false)
  const liste = useRef<HTMLOListElement>(null)
  const velg = (i: number) => setVis((v) => (i === v.aktiv ? v : { aktiv: i, forrige: v.aktiv }))

  // Under lg: raden som krysser midten av skjermen er aktiv (rulling i stedet for peker).
  useEffect(() => {
    const ol = liste.current
    if (!ol || !('IntersectionObserver' in window)) return
    const mobil = matchMedia('(max-width: 1023.98px)')
    let io: IntersectionObserver | null = null
    const koble = () => {
      io?.disconnect()
      io = null
      setRullet(false)
      if (!mobil.matches) return
      io = new IntersectionObserver(
        (rader) => {
          for (const r of rader) {
            if (!r.isIntersecting) continue
            const i = Number((r.target as HTMLElement).dataset.rad)
            setVis((v) => (i === v.aktiv ? v : { aktiv: i, forrige: v.aktiv }))
            setRullet(true)
          }
        },
        { rootMargin: '-45% 0px -45% 0px' },
      )
      ol.querySelectorAll('[data-rad]').forEach((li) => io?.observe(li))
    }
    koble()
    mobil.addEventListener('change', koble)
    return () => {
      mobil.removeEventListener('change', koble)
      io?.disconnect()
    }
  }, [])

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
      <ol ref={liste} className="border-t border-sand-200 lg:col-span-7">
        {merker.map((m, i) => {
          const pa = i === aktiv
          return (
            <Inn
              som="li"
              key={m.slug}
              i={Math.min(i, 5) + 1}
              data-rad={String(i)}
              className="border-b border-sand-200"
            >
              <Link
                href={merkeUrl(m.slug)}
                onMouseEnter={() => velg(i)}
                onFocus={() => velg(i)}
                className="group grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-4 sm:grid-cols-[2.5rem_1fr_auto] sm:gap-4 md:grid-cols-[3.5rem_1fr_auto] md:py-7"
              >
                <span className="text-sm text-sand-ink tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                <span
                  className={cn(
                    'font-heading text-3xl leading-tight transition-transform duration-(--dur-base) ease-out group-hover:translate-x-3 md:text-5xl xl:text-6xl',
                    pa && 'lg:translate-x-3',
                    pa && rullet && 'max-lg:translate-x-2',
                  )}
                >
                  {m.navn}
                </span>
                <span className="flex items-center gap-3 text-sm text-sand-ink">
                  <span className="hidden sm:inline">{m.antall} produkter</span>
                  {/* Mobil: liten flaske på papir. Pynt – navnet står i lenken – derfor tom alt. */}
                  {m.produkt?.bilde && (
                    <span
                      className={cn(
                        'relative isolate size-14 shrink-0 overflow-hidden rounded-lg border border-sand-200 bg-paper transition-transform duration-(--dur-slow) ease-out lg:hidden',
                        pa && rullet ? '-translate-y-1 scale-105' : 'translate-y-0 scale-100',
                      )}
                    >
                      <Image
                        src={m.produkt.bilde}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-contain p-1.5 mix-blend-multiply"
                      />
                    </span>
                  )}
                  <ArrowRight
                    className="size-5 shrink-0 text-regina-plum transition-transform duration-(--dur-base) group-hover:translate-x-1"
                    aria-hidden
                  />
                </span>
              </Link>
            </Inn>
          )
        })}
      </ol>

      {/* Rammen er pynt for seende med peker: flaskene står også på merkesidene, så den skjules for skjermlesere. */}
      <div className="hidden lg:col-span-4 lg:col-start-9 lg:block" aria-hidden>
        <div className="sticky top-28">
          <Inn variant="teppe" i={2} className="relative aspect-[4/5] rounded-2xl border border-sand-200">
            <div className="teppe absolute inset-0 bg-paper">
              {merker.map((m, i) => {
                if (!m.produkt?.bilde) return null
                const t = i === aktiv ? 'aktiv' : i === forrige ? 'forrige' : 'av'
                return (
                  // Teppe: ytre flate glir opp fra bunnen, indre motsatt vei – flasken står i ro mens kanten går
                  // opp. Papiret ligger på den indre flaten, så multiply har papir under seg.
                  <span
                    key={m.slug}
                    className={cn(
                      'absolute inset-0 overflow-hidden',
                      t === 'aktiv' && 'z-10 translate-y-0 transition-transform duration-(--dur-inn) ease-ut',
                      // Den forrige fullfører sin egen overgang under den nye, i stedet for å hoppe.
                      t === 'forrige' && 'translate-y-0 transition-transform duration-(--dur-inn) ease-ut',
                      t === 'av' && 'invisible translate-y-full transition-none',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute inset-0 bg-paper',
                        t === 'aktiv' &&
                          'translate-y-0 scale-100 transition-transform duration-(--dur-inn) ease-ut',
                        t === 'forrige' &&
                          'translate-y-0 scale-100 transition-transform duration-(--dur-inn) ease-ut',
                        t === 'av' && '-translate-y-full scale-[1.05] transition-none',
                      )}
                    >
                      <Image
                        src={m.produkt.bilde}
                        alt=""
                        fill
                        sizes="30vw"
                        className="object-contain p-[12%] mix-blend-multiply"
                      />
                    </span>
                  </span>
                )
              })}
            </div>
          </Inn>
          <p className="mt-3 flex justify-between gap-4 text-sm text-sand-ink">
            <span>{merker[aktiv]?.produkt?.navn ?? merker[aktiv]?.navn}</span>
            <span className="tabular-nums">{merker[aktiv]?.produkt?.pris}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
