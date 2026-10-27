'use client'

import { useId, useState } from 'react'
import { useKurv } from '@/components/kurv/kurv-provider'
import { Button } from '@/components/ui/button'
import { normaliserMal } from '@/lib/tekst'
import type { Produkt, Variant } from '@/lib/woocommerce/typer'
import { cn } from '@/lib/utils'
import { Antallvelger } from '@/components/kurv/antallvelger'
import { Lagerstatus } from './lagerstatus'
import { Pris } from './pris'
import { VarsleSkjema } from './varsle-skjema'

/**
 * Variantvalg, pris, lager, antall og «Legg i handlekurven». Et variabelt produkt får aldri en variant valgt
 * for seg – unntatt når det bare finnes én. Doble variasjoner vises ikke (WooCommerce bruker den første).
 * Uten JavaScript er dette et vanlig skjema som poster til /api/kurv/.
 */
export function Kjopsboks({ produkt: p }: { produkt: Produkt }) {
  const { leggTil, opptatt } = useKurv()
  const varianter = p.varianter.filter((v) => v.duplikatAv === null)
  const egenskap = p.egenskaper.find((e) => e.variasjon)
  const [valgt, setValgt] = useState<Variant | null>(varianter.length === 1 ? (varianter[0] ?? null) : null)
  const [antall, setAntall] = useState(1)
  const [mangler, setMangler] = useState(false)
  const gruppe = useId()

  const erVariabel = p.type === 'variabel'
  const lager = erVariabel ? (valgt?.lager ?? p.lager) : p.lager
  const kjopbar = erVariabel ? (valgt ? valgt.kjopbar && p.kjopbar : p.kjopbar) : p.kjopbar
  const maks = erVariabel ? (valgt?.maks ?? 1) : p.maks
  const verdinavn = (v: Variant) => {
    const navn = egenskap?.navn ?? Object.keys(v.valg)[0] ?? ''
    const slug = v.valg[navn] ?? ''
    return normaliserMal(egenskap?.verdier.find((x) => x.slug === slug)?.navn ?? slug)
  }

  return (
    <div>
      <form
        action="/api/kurv/"
        method="post"
        onSubmit={(e) => {
          e.preventDefault()
          if (erVariabel && !valgt) {
            setMangler(true)
            document.getElementById(`${gruppe}-0`)?.focus()
            return
          }
          void leggTil({ produktId: p.id, variantId: valgt?.id ?? null, antall })
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
          <fieldset className="mt-8" aria-describedby={mangler ? `${gruppe}-feil` : undefined}>
            <legend className="mb-3 text-sm font-medium">
              {egenskap.navn}
              {valgt && <span className="font-normal text-sand-ink">: {verdinavn(valgt)}</span>}
            </legend>
            <div className="flex flex-wrap gap-2">
              {varianter.map((v, i) => (
                <label
                  key={v.id}
                  className={cn(
                    'relative inline-flex min-h-11 min-w-16 cursor-pointer items-center justify-center border px-4 text-[0.9375rem] transition-colors duration-(--dur-fast)',
                    'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-regina-pink-strong',
                    valgt?.id === v.id
                      ? 'border-regina-plum bg-regina-plum text-white'
                      : 'border-input bg-paper hover:border-regina-plum',
                    !v.kjopbar && valgt?.id !== v.id && 'text-sand-ink line-through decoration-1',
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

        <Lagerstatus lager={lager} className="mt-6" />

        {kjopbar && (
          <div className="mt-4 flex gap-3">
            {maks > 1 && (!erVariabel || valgt) && (
              <Antallvelger antall={antall} maks={maks} navn={p.visningsnavn} onEndre={setAntall} />
            )}
            <Button type="submit" size="lg" className="flex-1" disabled={opptatt}>
              Legg i handlekurven
            </Button>
          </div>
        )}
      </form>
      {!kjopbar && <VarsleSkjema produktId={p.id} variantId={valgt?.id ?? null} />}
    </div>
  )
}
