// Markøren i variantvalget er bygget etter «Segmented Control» (halaska-studio, MIT) på 21st.dev – https://21st.dev/@halaska-studio/components/segmented-control. Egen kode; ingen kode er kopiert.
'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { useKurv } from '@/components/kurv/kurv-provider'
import { Button } from '@/components/ui/button'
import { fraKroner, kroner } from '@/lib/format'
import { normaliserMal } from '@/lib/tekst'
import type { Produkt, Variant } from '@/lib/woocommerce/typer'
import { cn } from '@/lib/utils'
import { Antallvelger } from '@/components/kurv/antallvelger'
import { Kjopslinje } from './kjopslinje'
import { Lagerstatus } from './lagerstatus'
import { Pris } from './pris'
import { VarsleSkjema } from './varsle-skjema'

/**
 * Variantvalg, pris, lager, antall og «Legg i handlekurven». Et variabelt produkt får aldri en variant valgt
 * for seg – unntatt når det bare finnes én. Doble variasjoner vises ikke (WooCommerce bruker den første).
 * Uten JavaScript er dette et vanlig skjema som poster til /api/kurv/.
 *
 * Alternativene er piller (R-32), og valgt variant markeres med en rosa pille (hvit tekst på #C2106F) som glir
 * mellom valgene (som tommelen i forbildet). Uten JavaScript, og til markøren har funnet plassen sin, er det valgte
 * alternativet farget med CSS (:has(:checked)). På mobil kommer en kjøpslinje opp nederst når kjøpsknappen er
 * rullet forbi (kjopslinje.tsx).
 */
export function Kjopsboks({ produkt: p }: { produkt: Produkt }) {
  const { leggTil, opptatt } = useKurv()
  const varianter = p.varianter.filter((v) => v.duplikatAv === null)
  const egenskap = p.egenskaper.find((e) => e.variasjon)
  const [valgt, setValgt] = useState<Variant | null>(varianter.length === 1 ? (varianter[0] ?? null) : null)
  const [antall, setAntall] = useState(1)
  const [mangler, setMangler] = useState(false)
  const gruppe = useId()
  const valgliste = useRef<HTMLDivElement>(null)
  const markor = useRef<HTMLSpanElement>(null)
  const boks = useRef<HTMLDivElement>(null)

  const erVariabel = p.type === 'variabel'
  const lager = erVariabel ? (valgt?.lager ?? p.lager) : p.lager
  const kjopbar = erVariabel ? (valgt ? valgt.kjopbar && p.kjopbar : p.kjopbar) : p.kjopbar
  const maks = erVariabel ? (valgt?.maks ?? 1) : p.maks
  const verdinavn = (v: Variant) => {
    const navn = egenskap?.navn ?? Object.keys(v.valg)[0] ?? ''
    const slug = v.valg[navn] ?? ''
    return normaliserMal(egenskap?.verdier.find((x) => x.slug === slug)?.navn ?? slug)
  }
  const valgtIndeks = valgt ? varianter.findIndex((v) => v.id === valgt.id) : -1

  // Markøren legges over det valgte alternativet: første gang uten å gli (den toner inn), deretter glir den.
  useLayoutEffect(() => {
    if (valgliste.current && markor.current)
      plasserMarkor(valgliste.current, markor.current, valgtIndeks, true)
  }, [valgtIndeks])
  // Plasseres på nytt uten bevegelse når raden eller et alternativ endrer størrelse (rotering, skriften lastes,
  // større skrift). Observatøren lages én gang; ellers ville det første kallet avbryte glidningen ved hvert valg.
  useEffect(() => {
    const liste = valgliste.current
    const m = markor.current
    if (!liste || !m) return
    const valg = [...liste.querySelectorAll('label')]
    const observator = new ResizeObserver(() => {
      const valgt = liste.querySelector('label:has(:checked)')
      plasserMarkor(liste, m, valg.indexOf(valgt as HTMLLabelElement), false)
    })
    observator.observe(liste)
    valg.forEach((v) => observator.observe(v))
    return () => observator.disconnect()
  }, [])

  // Kunden må velge selv: vis meldingen og flytt fokus til første alternativ.
  const krevValg = () => {
    setMangler(true)
    document.getElementById(`${gruppe}-0`)?.focus()
  }

  // Fra kjøpslinjen: rull til valget og sett fokus der, uten å velge noe for kunden.
  const visValg = () => {
    const felt = valgliste.current?.closest('fieldset')
    const fart = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    felt?.scrollIntoView({ block: 'center', behavior: fart })
    const inndata = document.getElementById(`${gruppe}-${Math.max(0, valgtIndeks)}`)
    inndata?.focus({ preventScroll: true })
  }

  const leggIKurven = () => void leggTil({ produktId: p.id, variantId: valgt?.id ?? null, antall })

  // Linjen nederst: navn, valgt variant og pris på én linje (ikke «90 ml» alene, så teksten ikke forveksles med valget).
  const prislinje = [
    valgt && erVariabel && varianter.length > 1 ? verdinavn(valgt) : null,
    erVariabel && !valgt
      ? p.prisspenn
        ? fraKroner(p.prisspenn.fra)
        : kroner(p.pris.pris)
      : kroner((erVariabel && valgt ? valgt.pris : p.pris).pris),
  ]
    .filter(Boolean)
    .join(' · ')
  const maaVelge = erVariabel && (!valgt || !kjopbar)

  return (
    <div ref={boks}>
      <form
        action="/api/kurv/"
        method="post"
        onSubmit={(e) => {
          e.preventDefault()
          if (erVariabel && !valgt) {
            krevValg()
            return
          }
          leggIKurven()
        }}
      >
        <input type="hidden" name="produktId" value={p.id} />
        <input type="hidden" name="antall" value={antall} />

        <Pris
          pris={erVariabel && valgt ? valgt.pris : p.pris}
          fra={erVariabel && !valgt ? (p.prisspenn?.fra ?? null) : null}
          className="text-2xl"
        />
        <p className="mt-1 text-sm text-sand-ink">Inkl. mva. Frakt beregnes i kassen.</p>

        {erVariabel && egenskap && (
          <fieldset className="mt-8 scroll-mt-28" aria-describedby={mangler ? `${gruppe}-feil` : undefined}>
            <legend className="mb-3 text-sm font-medium">
              {egenskap.navn}
              {valgt && <span className="font-normal text-sand-ink">: {verdinavn(valgt)}</span>}
            </legend>
            <div ref={valgliste} className="group/valg relative flex flex-wrap gap-2">
              <span
                ref={markor}
                className="pointer-events-none absolute top-0 left-0 origin-top-left rounded-full bg-regina-pink-strong opacity-0 transition-[transform,opacity] duration-(--dur-slow) ease-(--ease-ut)"
                aria-hidden
              />
              {varianter.map((v, i) => (
                <label
                  key={v.id}
                  className={cn(
                    'relative inline-flex min-h-11 min-w-18 cursor-pointer items-center justify-center rounded-full border border-input px-5 text-[0.9375rem] transition-[color,border-color,transform] duration-(--dur-slow) ease-out select-none active:scale-[0.97]',
                    'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-regina-pink-strong',
                    'hover:border-regina-pink-strong has-checked:border-regina-pink-strong has-checked:text-white',
                    // Før markøren er på plass (og uten JavaScript) bærer alternativet selv fargen.
                    'has-checked:bg-regina-pink-strong group-data-markor/valg:has-checked:bg-transparent',
                    !v.kjopbar && 'text-sand-ink line-through decoration-1 has-checked:no-underline',
                  )}
                >
                  <input
                    id={`${gruppe}-${i}`}
                    type="radio"
                    name="variantId"
                    value={v.id}
                    checked={valgt?.id === v.id}
                    onChange={() => {
                      setValgt(v)
                      setMangler(false)
                      setAntall(1)
                    }}
                    className="sr-only"
                    required
                  />
                  {verdinavn(v)}
                  {!v.kjopbar && <span className="sr-only"> (utsolgt)</span>}
                </label>
              ))}
            </div>
            {mangler && (
              <p id={`${gruppe}-feil`} role="alert" className="mt-3 text-sm text-status-feil">
                Velg {egenskap.navn.toLocaleLowerCase('nb')} først.
              </p>
            )}
          </fieldset>
        )}

        {/* Lager og antall på samme rad, knappen i full bredde under: får plass på 390 px i kortet, og raden har
            samme høyde før og etter at antallsvelgeren kommer til syne (ingen hopp når kunden velger variant). */}
        <div className="mt-6 flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <Lagerstatus lager={lager} />
          {kjopbar && maks > 1 && (!erVariabel || valgt) && (
            <Antallvelger antall={antall} maks={maks} navn={p.visningsnavn} onEndre={setAntall} />
          )}
        </div>

        {kjopbar && (
          <div className="mt-4">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={opptatt}
              onClick={(e) => {
                // Før nettleserens egen «required»-melding: vår egen, på norsk, ved feltet.
                if (erVariabel && !valgt) {
                  e.preventDefault()
                  krevValg()
                }
              }}
            >
              Legg i handlekurven
            </Button>
          </div>
        )}
      </form>
      {!kjopbar && <VarsleSkjema produktId={p.id} variantId={valgt?.id ?? null} />}
      {p.kjopbar && (
        <Kjopslinje
          mal={boks}
          navn={p.visningsnavn}
          prislinje={prislinje}
          knapp={
            maaVelge && egenskap
              ? { tekst: `Velg ${egenskap.navn.toLocaleLowerCase('nb')}`, handling: visValg }
              : { tekst: 'Legg i handlekurven', handling: leggIKurven }
          }
          opptatt={opptatt}
        />
      )}
    </div>
  )
}

/**
 * Legger markøren over alternativ nr. `indeks` (-1: ingen). Markøren får målets størrelse med en gang (uten
 * overgang), så pilleformen er nøyaktig når den står stille. Glidningen er FLIP: den starter der markøren står nå
 * – også midt i en glidning – uttrykt som forskyvning og skalering av den nye størrelsen, og bare transformen har
 * overgang (R-30: bare transform og opacity). Første gang, og når `gli` er av, hopper den rett på plass.
 */
function plasserMarkor(liste: HTMLElement, m: HTMLElement, indeks: number, gli: boolean) {
  const mal = liste.querySelectorAll('label')[indeks]
  if (!(mal instanceof HTMLElement)) {
    m.style.opacity = '0'
    delete liste.dataset.markor
    return
  }
  const { offsetLeft: x, offsetTop: y, offsetWidth: bredde, offsetHeight: hoyde } = mal
  const hopp = !gli || !('markor' in liste.dataset)
  // Der markøren ses nå, med transformen den har akkurat nå.
  const naa = new DOMMatrixReadOnly(getComputedStyle(m).transform)
  const fraBredde = m.offsetWidth * naa.a
  const fraHoyde = m.offsetHeight * naa.d
  m.style.transition = 'none'
  m.style.width = `${bredde}px`
  m.style.height = `${hoyde}px`
  m.style.transform =
    hopp || fraBredde <= 0 || fraHoyde <= 0
      ? `translate(${x}px, ${y}px)`
      : `translate(${naa.e}px, ${naa.f}px) scale(${fraBredde / bredde}, ${fraHoyde / hoyde})`
  void m.offsetWidth // Ta i bruk startpunktet før overgangen slås på igjen.
  m.style.removeProperty('transition')
  m.style.transform = `translate(${x}px, ${y}px)`
  m.style.opacity = '1'
  liste.dataset.markor = ''
}
