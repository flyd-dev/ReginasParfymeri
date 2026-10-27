'use client'

import { Pause, Play } from 'lucide-react'
import Image, { type StaticImageData } from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

/**
 * Hero med video. PLASSHOLDER: Regina har ikke levert egen film fra butikken ennå. Til da vises plakatbildet
 * (butikkfasaden) på sand – aldri en demovideo. Når filmen kommer, settes `video` (mp4/webm i /public eller CDN).
 * Videoen spiller dempet, kan pauses (WCAG 2.2.2) og starter ikke ved redusert bevegelse.
 * Se docs/components.md, «Video-hero».
 */
export function Hero({
  plakat,
  plakatAlt,
  video,
}: {
  plakat: StaticImageData
  plakatAlt: string
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
    <section className="relative isolate overflow-hidden bg-sand-100" aria-labelledby="hero-tittel">
      <div className="mx-auto grid max-w-screen-2xl md:min-h-[min(82vh,52rem)] md:grid-cols-[1fr_1.1fr]">
        <div className="order-2 flex flex-col justify-center px-4 py-12 md:order-1 md:px-6 md:py-20 lg:pr-16">
          <p className="text-sm tracking-[0.22em] text-sand-ink-deep uppercase animate-in fade-in slide-in-from-bottom-1 duration-(--dur-slow)">
            Haugesund · siden 1863
          </p>
          <h1 id="hero-tittel" className="mt-5 text-5xl leading-[1.05] md:text-6xl xl:text-7xl">
            Nisjedufter med <em className="text-regina-pink">historie</em>
          </h1>
          <p className="mt-6 max-w-md text-lg text-sand-ink-deep">
            Et av Norges eldste frittstående parfymerier. Eksklusive dufter, hudpleie og personlig veiledning
            – i Haraldsgata og på nett.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/produktkategori/duft/nisjeduft/">Utforsk nisjeduft</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent">
              <Link href="/kontakt/">Besøk butikken</Link>
            </Button>
          </div>
        </div>
        <div className="relative order-1 aspect-[4/3] md:order-2 md:aspect-auto">
          {video ? (
            <>
              <video
                ref={ref}
                className="absolute inset-0 size-full object-cover"
                src={video}
                poster={plakat.src}
                muted
                loop
                playsInline
                preload="metadata"
                aria-label={plakatAlt}
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
                className="absolute right-4 bottom-4 grid size-11 place-items-center bg-paper/90 text-regina-plum"
                aria-label={spiller ? 'Pause filmen' : 'Spill filmen'}
              >
                {spiller ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
              </button>
            </>
          ) : (
            <Image
              src={plakat}
              alt={plakatAlt}
              fill
              priority
              placeholder="blur"
              sizes="(min-width: 768px) 55vw, 100vw"
              className="object-cover"
            />
          )}
        </div>
      </div>
    </section>
  )
}
