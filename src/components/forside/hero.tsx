'use client'

import { ArrowRight, Pause, Play } from 'lucide-react'
import Image, { type StaticImageData } from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { HISTORIE, BUTIKK } from '@/content/butikk'
import type { Visningsprodukt } from '@/lib/forside'
import { produktUrl } from '@/lib/lenker'

/**
 * Hero som kollasj: stor tittel, butikkbildet i en høy ramme og en frilagt nisjeflaske på papirflate som ligger
 * over rammens hjørne. Lagene gir dybde uten skygger. Butikkbildene er små (1000 px), derfor ramme og ikke
 * fullbredde.
 *
 * Video: PLASSHOLDER. Regina har ikke levert egen film ennå. Når den kommer, settes `video`, og filmen spiller
 * dempet i rammen med pauseknapp (WCAG 2.2.2). Den starter ikke ved redusert bevegelse. Aldri demovideo.
 * Se docs/components.md, «Video-hero».
 */
export function Hero({
  foto,
  fotoAlt,
  produkt,
  video,
}: {
  foto: StaticImageData
  fotoAlt: string
  produkt: Visningsprodukt | null
  video?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [spiller, setSpiller] = useState(false)

  useEffect(() => {
    const v = ref.current
    if (!v || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    v.play()
      .then(() => setSpiller(true))
      .catch(() => setSpiller(false))
  }, [])

  return (
    <section className="relative isolate overflow-hidden bg-sand-50" aria-labelledby="hero-tittel">
      {/* Rosa løper: den tynne streken går fra butikkdøren i bildet og ned i siden. */}
      <span
        className="absolute top-0 right-[18%] -z-10 hidden h-full w-px bg-regina-pink/40 lg:block"
        aria-hidden
      />
      <div className="mx-auto grid max-w-screen-2xl gap-y-14 px-4 pt-8 pb-20 md:px-6 lg:min-h-[calc(100svh-9.5rem)] lg:grid-cols-12 lg:items-center lg:gap-x-8 lg:py-14">
        <div className="order-2 lg:order-1 lg:col-span-6 xl:col-span-6">
          <p className="text-sm tracking-[0.24em] text-sand-ink uppercase">
            Haugesund · siden {HISTORIE.grunnlagt}
          </p>
          <h1
            id="hero-tittel"
            className="mt-6 text-[clamp(3.4rem,1.2rem+7vw,8rem)] leading-[0.92] tracking-[-0.02em]"
          >
            Nisjedufter
            <br />
            med <em className="text-regina-pink">historie</em>
          </h1>
          <p className="mt-8 max-w-md text-lg text-sand-ink-deep md:text-xl">
            Et av Norges eldste frittstående parfymerier. Eksklusive dufter, hudpleie og personlig veiledning
            – i Haraldsgata og på nett.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/produktkategori/duft/nisjeduft/">Utforsk nisjeduft</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent">
              <Link href="/kontakt/">Besøk butikken</Link>
            </Button>
          </div>
          <dl className="mt-14 grid max-w-lg grid-cols-[auto_auto_1fr] gap-x-8 gap-y-4 border-t border-sand-200 pt-6 text-sm">
            <div>
              <dt className="text-sand-ink">Siden</dt>
              <dd className="mt-1 font-heading text-xl md:text-2xl">{HISTORIE.grunnlagt}</dd>
            </div>
            <div>
              <dt className="text-sand-ink">Butikken</dt>
              <dd className="mt-1 font-heading text-xl leading-tight md:text-2xl">{BUTIKK.adresse.gate}</dd>
            </div>
            <div>
              <dt className="text-sand-ink">Generasjon</dt>
              <dd className="mt-1 font-heading text-xl md:text-2xl">Femte</dd>
            </div>
          </dl>
        </div>

        <div className="relative order-1 pb-16 lg:order-2 lg:col-span-6 lg:pb-0 xl:col-span-6">
          <div className="relative ml-auto aspect-[4/5] w-[78%] overflow-hidden bg-sand-100 sm:w-[64%] lg:w-[74%]">
            {video ? (
              <>
                <video
                  ref={ref}
                  className="absolute inset-0 size-full object-cover"
                  src={video}
                  poster={foto.src}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={fotoAlt}
                />
                <button
                  type="button"
                  onClick={() => {
                    const v = ref.current
                    if (!v) return
                    if (v.paused) void v.play().then(() => setSpiller(true))
                    else {
                      v.pause()
                      setSpiller(false)
                    }
                  }}
                  className="absolute top-3 right-3 grid size-11 place-items-center bg-paper/90 text-regina-plum"
                  aria-label={spiller ? 'Pause filmen' : 'Spill filmen'}
                >
                  {spiller ? (
                    <Pause className="size-4" aria-hidden />
                  ) : (
                    <Play className="size-4" aria-hidden />
                  )}
                </button>
              </>
            ) : (
              <Image
                src={foto}
                alt={fotoAlt}
                fill
                priority
                placeholder="blur"
                sizes="(min-width: 1024px) 34vw, (min-width: 640px) 60vw, 78vw"
                className="object-cover"
              />
            )}
          </div>
          {produkt && (
            <Link
              href={produktUrl(produkt.slug)}
              className="group absolute bottom-0 left-0 block w-[56%] border border-sand-200 bg-paper sm:w-[44%] lg:-bottom-4 lg:w-[46%]"
            >
              <span className="relative block aspect-square overflow-hidden">
                {produkt.bilde && (
                  <Image
                    src={produkt.bilde}
                    alt={produkt.alt}
                    fill
                    priority
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 40vw, 56vw"
                    className="object-contain p-[9%] mix-blend-multiply transition-transform duration-(--dur-slow) ease-out group-hover:scale-[1.04]"
                  />
                )}
              </span>
              <span className="block border-t border-sand-200 px-4 py-3">
                {produkt.merke && (
                  <span className="block text-xs tracking-[0.16em] text-sand-ink uppercase">
                    {produkt.merke}
                  </span>
                )}
                <span className="mt-0.5 block font-heading text-lg leading-snug md:text-xl">
                  {produkt.navn}
                </span>
                <span className="mt-1 flex items-center justify-between gap-2 text-sm">
                  <span className="tabular-nums">{produkt.pris}</span>
                  <ArrowRight
                    className="size-4 text-regina-pink-strong transition-transform duration-(--dur-base) group-hover:translate-x-1"
                    aria-hidden
                  />
                </span>
              </span>
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
