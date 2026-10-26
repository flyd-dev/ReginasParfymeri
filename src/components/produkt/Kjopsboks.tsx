'use client'

// Kjøpsboksen: valg av variant, antall og «Legg i handlekurven».
// Et variabelt produkt får aldri en variant valgt for seg – bortsett fra når det bare finnes én.

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { BUTIKK } from '@/innhold/butikk'
import { kroner } from '@/lib/format'
import type { NyLinje } from '@/lib/handlekurv/kurv'
import type { Egenskap, Lager, Ore, Pris as PrisT } from '@/lib/katalog/typer'
import { Ikon } from '../Ikon'
import { useKurv } from '../kurv/KurvProvider'
import { Lagerstatus } from './Lagerstatus'
import { Pris } from './Pris'
import styles from './Kjopsboks.module.css'

export interface Kjopsvariant {
  id: number
  valg: Record<string, string>
  pris: PrisT
  lager: Lager
  kjopbar: boolean
  maks: number
  sku: string
}

export interface Kjopsdata {
  navn: string
  merke: string | null
  type: 'enkel' | 'variabel'
  pris: PrisT
  prisspenn: { fra: Ore; til: Ore } | null
  lager: Lager
  kjopbar: boolean
  maks: number
  egenskaper: Egenskap[]
  varianter: Kjopsvariant[]
  /** Ferdige kurvlinjer per variant-ID (0 for enkle produkter), laget på serveren. */
  linjer: Record<number, NyLinje>
}

function passer(v: Kjopsvariant, valgt: Record<string, string | null>): boolean {
  return Object.entries(valgt).every(([navn, verdi]) => verdi === null || v.valg[navn] === verdi)
}

export function Kjopsboks({ data }: { data: Kjopsdata }) {
  const { leggTil } = useKurv()
  const id = useId()
  const [valgt, setValgt] = useState<Record<string, string | null>>(() => {
    const start: Record<string, string | null> = {}
    const eneste = data.varianter.length === 1 ? data.varianter[0] : undefined
    for (const e of data.egenskaper) start[e.navn] = eneste?.valg[e.navn] ?? null
    return start
  })
  const [onsketAntall, setAntall] = useState(1)
  const [mangler, setMangler] = useState(false)
  const [lagt, setLagt] = useState(false)
  const [visLinje, setVisLinje] = useState(false)
  const knapp = useRef<HTMLButtonElement>(null)
  const forsteValg = useRef<HTMLInputElement>(null)

  const variant = useMemo(() => {
    if (data.type !== 'variabel') return null
    if (Object.values(valgt).some((v) => v === null)) return null
    return data.varianter.find((v) => passer(v, valgt)) ?? null
  }, [data, valgt])

  const lager = variant ? variant.lager : data.type === 'enkel' ? data.lager : null
  const kjopbar = variant ? variant.kjopbar : data.type === 'enkel' ? data.kjopbar : true
  const maks = variant ? variant.maks : data.maks
  const pris = variant ? variant.pris : data.pris
  const egenskapsnavn = data.egenskaper[0]?.navn.toLocaleLowerCase('nb-NO') ?? 'variant'

  // Bytter kunden til en variant med mindre beholdning, følger antallet med.
  const antall = Math.min(onsketAntall, Math.max(maks, 1))

  // Fast kjøpslinje på mobil når hovedknappen er rullet ut av bildet.
  useEffect(() => {
    const k = knapp.current
    if (!k || !('IntersectionObserver' in window)) return
    const o = new IntersectionObserver(([e]) =>
      setVisLinje(!!e && !e.isIntersecting && e.boundingClientRect.top < 0),
    )
    o.observe(k)
    return () => o.disconnect()
  }, [])

  useEffect(() => {
    if (visLinje) document.body.dataset.kjopslinje = ''
    else delete document.body.dataset.kjopslinje
    return () => {
      delete document.body.dataset.kjopslinje
    }
  }, [visLinje])

  const leggIKurv = (kilde: 'boks' | 'linje') => {
    if (data.type === 'variabel' && !variant) {
      setMangler(true)
      if (kilde === 'linje') forsteValg.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      forsteValg.current?.focus({ preventScroll: kilde === 'linje' })
      return
    }
    const linje = data.linjer[variant?.id ?? 0]
    if (!linje || !kjopbar) return
    const bilde = document.querySelector<HTMLElement>(
      '[data-produktgalleri] [data-aktiv] [data-produktbilde], [data-produktgalleri] [data-produktbilde]',
    )
    leggTil(linje, antall, bilde)
    setLagt(true)
    window.setTimeout(() => setLagt(false), 1800)
  }

  const prisvisning = (
    <Pris
      pris={variant || data.type === 'enkel' ? pris.pris : (data.prisspenn?.fra ?? pris.pris)}
      forPris={pris.tilbud ? pris.ordinaer : null}
      fra={!variant && data.prisspenn !== null}
      storrelse="stor"
    />
  )

  const sporsmal = `mailto:${BUTIKK.epost}?subject=${encodeURIComponent(`Spørsmål om ${data.merke ? `${data.merke} ` : ''}${data.navn}`)}`

  return (
    <div className={styles.boks}>
      <div className={styles.prisrad}>
        {prisvisning}
        <p className="mini dempet">inkl. mva.</p>
      </div>

      {data.egenskaper.map((e, ei) => {
        const prisVaries = new Set(data.varianter.map((v) => v.pris.pris)).size > 1
        return (
          <fieldset
            key={e.navn}
            className={styles.valg}
            aria-describedby={mangler ? `${id}-mangler` : undefined}
          >
            <legend className={styles.valgtittel}>
              {e.navn}
              {valgt[e.navn] ? (
                <span className={styles.valgtverdi}>
                  : {e.verdier.find((v) => v.verdi === valgt[e.navn])?.visning}
                </span>
              ) : null}
            </legend>
            <div
              className={styles.alternativer}
              data-type={e.navn.toLocaleLowerCase('nb-NO') === 'størrelse' ? 'storrelse' : 'farge'}
            >
              {e.verdier
                .map((verdi) => {
                  const kandidat = { ...valgt, [e.navn]: verdi.verdi }
                  const treff = data.varianter.filter((v) => passer(v, kandidat))
                  return { verdi, treff }
                })
                .filter(({ treff }) => treff.length > 0)
                .map(({ verdi, treff }, vi) => {
                  const utsolgt = treff.every((v) => v.lager.status === 'utsolgt' || !v.kjopbar)
                  const enesteTreff = treff.length === 1 ? treff[0] : undefined
                  return (
                    <label
                      key={verdi.verdi}
                      className={styles.alternativ}
                      data-utsolgt={utsolgt || undefined}
                    >
                      <input
                        ref={ei === 0 && vi === 0 ? forsteValg : undefined}
                        type="radio"
                        name={`${id}-${e.navn}`}
                        value={verdi.verdi}
                        checked={valgt[e.navn] === verdi.verdi}
                        onChange={() => {
                          setValgt((v) => ({ ...v, [e.navn]: verdi.verdi }))
                          setMangler(false)
                        }}
                      />
                      <span className={styles.alternativnavn}>{verdi.visning}</span>
                      {prisVaries && enesteTreff ? (
                        <span className={`${styles.alternativpris} tall`}>
                          {kroner(enesteTreff.pris.pris)}
                        </span>
                      ) : null}
                      {utsolgt ? <span className={styles.alternativstatus}>Utsolgt</span> : null}
                    </label>
                  )
                })}
            </div>
          </fieldset>
        )
      })}

      {mangler ? (
        <p id={`${id}-mangler`} className={styles.mangler} role="alert">
          <Ikon navn="info" storrelse={16} /> Velg {egenskapsnavn} først.
        </p>
      ) : null}

      <div className={styles.status} aria-live="polite">
        {lager ? (
          <Lagerstatus lager={lager} />
        ) : (
          <p className="liten dempet">
            {data.varianter.filter((v) => v.lager.status !== 'utsolgt').length} av {data.varianter.length}{' '}
            {egenskapsnavn === 'størrelse' ? 'størrelser' : 'varianter'} på lager i nettbutikken
          </p>
        )}
      </div>

      {lager?.status === 'utsolgt' || (data.type === 'enkel' && !kjopbar) ? (
        <div className={styles.utsolgt}>
          <p>
            Denne er utsolgt i nettbutikken. Butikken i Haraldsgata kan ha den inne eller skaffe den – spør
            oss gjerne.
          </p>
          <div className={styles.handlinger}>
            <a href={BUTIKK.telefon.lenke} className="knapp knapp--sekundar">
              <Ikon navn="telefon" storrelse={18} /> Ring {BUTIKK.telefon.visning}
            </a>
            <a href={sporsmal} className="tekstlenke">
              Send e-post
            </a>
          </div>
        </div>
      ) : (
        <div className={styles.kjop}>
          {maks > 1 ? (
            <div className={styles.antall} role="group" aria-label="Antall">
              <button
                type="button"
                onClick={() => setAntall(Math.max(1, antall - 1))}
                disabled={antall <= 1}
                aria-label="Ett færre"
              >
                <Ikon navn="minus" storrelse={16} />
              </button>
              <output className="tall" aria-live="polite">
                {antall}
              </output>
              <button
                type="button"
                onClick={() => setAntall(Math.min(maks, antall + 1))}
                disabled={antall >= maks}
                aria-label="Ett til"
              >
                <Ikon navn="pluss" storrelse={16} />
              </button>
            </div>
          ) : null}
          <button
            ref={knapp}
            type="button"
            className={`knapp knapp--primar knapp--stor ${styles.kjopknapp}`}
            data-lagt={lagt || undefined}
            onClick={() => leggIKurv('boks')}
          >
            <span className={styles.kjopikon} aria-hidden="true">
              <Ikon navn={lagt ? 'sjekk' : 'kurv'} storrelse={20} />
            </span>
            {lagt ? 'Lagt i handlekurven' : 'Legg i handlekurven'}
          </button>
        </div>
      )}

      <div className={styles.kjopslinje} data-synlig={visLinje || undefined} aria-hidden={!visLinje}>
        <div className={styles.kjopslinjetekst}>
          <p className={styles.kjopslinjenavn}>{data.navn}</p>
          <p className="tall mini">
            {variant || data.type === 'enkel'
              ? kroner(pris.pris)
              : `Fra ${kroner(data.prisspenn?.fra ?? pris.pris)}`}
          </p>
        </div>
        {lager?.status === 'utsolgt' ? (
          <a href={BUTIKK.telefon.lenke} className="knapp knapp--sekundar" tabIndex={visLinje ? 0 : -1}>
            Spør butikken
          </a>
        ) : (
          <button
            type="button"
            className="knapp knapp--primar"
            onClick={() => leggIKurv('linje')}
            tabIndex={visLinje ? 0 : -1}
          >
            {data.type === 'variabel' && !variant ? `Velg ${egenskapsnavn}` : 'Legg i kurven'}
          </button>
        )}
      </div>
    </div>
  )
}
