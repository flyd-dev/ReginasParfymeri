'use client'

import { ArrowRight, Pause, Play } from 'lucide-react'
import Image, { type StaticImageData } from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Inn } from '@/components/bevegelse/inn'
import { Prikk } from '@/components/layout/prikk'
import { Button } from '@/components/ui/button'
import { HISTORIE, BUTIKK } from '@/content/butikk'
import type { Visningsprodukt } from '@/lib/forside'
import { produktUrl } from '@/lib/lenker'
import { Flate } from './flate'
import { Ordskifte } from './ordskifte'
import { Tallteller } from './tallteller'

/** Ordene som skifter i tittelen: Reginas egne ord om nisjeduft («dybde og karakter», NISJE.tekst). */
const TITTELORD = ['historie', 'karakter', 'dybde'] as const

/** Plassen i inngangsrekken (× --stagger) for faktaraden under knappene. */
const FAKTA_I = 5

/** Fargen på streken over hvert tall i faktaraden, som tallene på flyd.no (R-32). Pynt. */
const STREK = ['bg-regina-pink', 'bg-regina-plum'] as const

/** Ett ord i tittelen bak en maske (samme mønster som AvdekkTekst, data-inn="ord" i globals.css). */
function Ord({ j, loddrett = false, children }: { j: number; loddrett?: boolean; children: ReactNode }) {
  return (
    // `loddrett`: masken klipper bare opp og ned, så et skiftende ord som er bredere enn det første ikke kuttes.
    <span className="ord-maske" style={loddrett ? { overflowX: 'visible', overflowY: 'clip' } : undefined}>
      <span className="ord" style={{ '--j': j } as CSSProperties}>
        {children}
      </span>
    </span>
  )
}

/**
 * Hero som kollasj: stor tittel, butikkbildet i en høy ramme med runde hjørner på en rosa flate, og en frilagt
 * nisjeflaske på papirkort som ligger over rammens hjørne (R-32). Lagene gir dybde uten skygger. Butikkbildene er
 * små (1000 px), derfor ramme og ikke fullbredde.
 *
 * Inngangen (R-30) er koreografert og drives av CSS og BevegelseSkript, ikke av React: den rosa flaten feies inn,
 * butikkbildet glir opp, flaskekortet kommer etter, og tittelen avsløres ord for ord. Så skifter det rosa ordet
 * én runde (historie → karakter → dybde → historie, under 5 s), og faktaraden får sine streker og teller opp.
 * Uten JavaScript og ved redusert bevegelse står alt der fra start. Bildet er forhåndslastet og venter aldri på
 * JavaScript-bunten.
 *
 * Video: PLASSHOLDER. Regina har ikke levert egen film ennå. Når den kommer, settes `video`, og filmen spiller
 * dempet i rammen med pauseknapp (WCAG 2.2.2). Den starter ikke ved redusert bevegelse. Aldri demovideo.
 * Se docs/components.md, «Video-hero».
 */
export function Hero({
  foto,
  fotoAlt,
  produkt,
  nisjedufter,
  video,
}: {
  foto: StaticImageData
  fotoAlt: string
  produkt: Visningsprodukt | null
  /** Antall nisjedufter i katalogen (WooCommerce), eller null hvis kategorien mangler. */
  nisjedufter: number | null
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

  // Faktaraden kommer inn forskjøvet fra FAKTA_I; tallene begynner å telle i samme øyeblikk som de tones inn.
  const fakta: { navn: string; verdi: ReactNode }[] = [
    { navn: 'Siden', verdi: <Tallteller verdi={HISTORIE.grunnlagt} aar i={FAKTA_I} /> },
    ...(nisjedufter
      ? [{ navn: 'Nisjedufter', verdi: <Tallteller verdi={nisjedufter} i={FAKTA_I + 1} /> }]
      : []),
    { navn: 'Butikken', verdi: BUTIKK.adresse.gate },
    { navn: 'Generasjon', verdi: 'Femte' },
  ]

  return (
    <section className="relative isolate overflow-hidden bg-sand-50" aria-labelledby="hero-tittel">
      {/* Den rosa flaten er en innfelt boks med runde hjørner (R-32) som bærer bildet: lys bakgrunn, rosa og foto i
          tre plan gir dybde uten skygger. Hjørnene klipper flaten mens den feies inn. */}
      <Flate
        farge="bg-regina-pink"
        className="absolute top-12 right-2 -z-10 h-[23rem] w-[56%] overflow-hidden rounded-3xl sm:top-14 sm:h-[29rem] md:right-4 lg:top-4 lg:bottom-4 lg:h-auto lg:w-[30%]"
      />
      <div className="mx-auto grid max-w-screen-2xl gap-y-14 px-4 pt-8 pb-20 md:px-6 lg:min-h-[calc(100svh-9.5rem)] lg:grid-cols-12 lg:items-center lg:gap-x-8 lg:py-14">
        <div className="order-2 lg:order-1 lg:col-span-6 xl:col-span-6">
          <Inn
            som="p"
            i={2}
            className="flex items-center gap-3 text-sm tracking-[0.24em] text-sand-ink uppercase"
          >
            <Prikk />
            Haugesund · siden {HISTORIE.grunnlagt}
          </Inn>
          <h1
            id="hero-tittel"
            data-inn="ord"
            style={{ '--i': 3 } as CSSProperties}
            suppressHydrationWarning
            className="mt-6 text-[clamp(3.4rem,1.2rem+6.5vw,7.5rem)] leading-[0.92] tracking-[-0.02em]"
          >
            <Ord j={0}>Nisjedufter</Ord>
            <br />
            <Ord j={1}>med</Ord>{' '}
            <em className="text-regina-pink">
              <span className="sr-only">{TITTELORD[0]}</span>
              <Ord j={2} loddrett>
                <Ordskifte ord={TITTELORD} />
              </Ord>
            </em>
          </h1>
          <Inn som="p" i={5} className="mt-8 max-w-md text-lg text-sand-ink-deep md:text-xl">
            Et av Norges eldste frittstående parfymerier. Eksklusive dufter, hudpleie og personlig veiledning
            – i Haraldsgata og på nett.
          </Inn>
          <Inn i={6} className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/produktkategori/duft/nisjeduft/">Utforsk nisjeduft</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent">
              <Link href="/kontakt/">Besøk butikken</Link>
            </Button>
          </Inn>
          <dl className="mt-14 grid max-w-xl grid-cols-2 gap-x-6 gap-y-7 text-sm sm:grid-cols-[repeat(3,minmax(5.5rem,auto))_1fr] sm:gap-x-8">
            {fakta.map((f, n) => (
              <Inn key={f.navn} i={FAKTA_I + n}>
                <dt className="relative pt-4 text-sand-ink">
                  {/* Farget strek over hvert tall (rosa og plum om hverandre), tegnes inn fra venstre. */}
                  <Flate
                    className="absolute inset-x-0 top-0 h-0.5 overflow-hidden rounded-full"
                    farge={STREK[n % STREK.length]}
                    fra="venstre"
                    i={FAKTA_I + n}
                  />
                  {f.navn}
                </dt>
                <dd className="mt-1 font-heading text-xl leading-tight md:text-2xl">{f.verdi}</dd>
              </Inn>
            ))}
          </dl>
        </div>

        <div className="relative order-1 pb-16 lg:order-2 lg:col-span-6 lg:pb-0 xl:col-span-6">
          <div className="parallakse-ut relative mr-6 ml-auto aspect-[4/5] w-[74%] [--parallakse:3rem] sm:mr-10 sm:w-[60%] lg:mr-16 lg:w-[72%]">
            {/* Bildet glir på plass og skaleres ned fra 1,08, men er synlig fra første bilde: det er stort nok til å
                bli LCP, så det skal ikke skjules bak et teppe som venter på skriptet. */}
            <Inn variant="glid" y="2rem" i={1} className="absolute inset-0">
              <div className="teppe absolute inset-0 overflow-hidden rounded-2xl bg-sand-100 lg:rounded-3xl">
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
                      className="absolute top-3 right-3 grid size-11 place-items-center rounded-full bg-paper/90 text-regina-plum"
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
                    preload
                    placeholder="blur"
                    sizes="(min-width: 1024px) 34vw, (min-width: 640px) 56vw, 70vw"
                    className="object-cover"
                  />
                )}
              </div>
            </Inn>
          </div>
          {produkt && (
            <Inn
              variant="glid"
              i={6}
              y="3rem"
              className="absolute bottom-0 left-0 w-[56%] sm:w-[44%] lg:-bottom-4 lg:w-[46%]"
            >
              <Link
                href={produktUrl(produkt.slug)}
                className="parallakse-ut group block overflow-hidden rounded-xl border border-sand-200 bg-paper [--parallakse:-1.5rem] lg:rounded-2xl"
              >
                {/* Papirflaten ligger på det som animeres: en flate med opacity/transform er en egen gruppe, og
                    multiply må ha papiret under seg i gruppen, ellers ses bildets hvite bakgrunn underveis. */}
                <Inn
                  som="span"
                  variant="glid"
                  y="0.75rem"
                  i={9}
                  className="relative block aspect-square overflow-hidden bg-paper"
                >
                  {produkt.bilde && (
                    <Image
                      src={produkt.bilde}
                      alt={produkt.alt}
                      fill
                      loading="eager"
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 40vw, 56vw"
                      className="object-contain p-[9%] mix-blend-multiply transition-transform duration-(--dur-slow) ease-out group-hover:scale-[1.04]"
                    />
                  )}
                </Inn>
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
            </Inn>
          )}
        </div>
      </div>
    </section>
  )
}
