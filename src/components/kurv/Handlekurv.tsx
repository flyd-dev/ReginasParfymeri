'use client'

import Link from 'next/link'
import { kroner } from '@/lib/format'
import type { Kurvlinje, Linjestatus } from '@/lib/handlekurv/kurv'
import { nokkel } from '@/lib/handlekurv/kurv'
import { Ikon } from '../Ikon'
import { Produktbilde } from '../produkt/Produktbilde'
import { Skuff } from '../Skuff'
import { useKurv } from './KurvProvider'
import styles from './Handlekurv.module.css'

function statustekst(s: Linjestatus | undefined): string | null {
  if (!s) return null
  switch (s.type) {
    case 'pris-endret':
      return `Prisen er endret fra ${kroner(s.fra)} til ${kroner(s.til)}.`
    case 'antall-justert':
      return `Vi har bare ${s.til} igjen – antallet er justert.`
    case 'utsolgt':
      return 'Utsolgt i nettbutikken. Fjern varen for å gå videre, eller spør butikken.'
    case 'finnes-ikke':
      return 'Varen finnes ikke lenger i nettbutikken.'
    default:
      return null
  }
}

export function Antallvelger({
  linje,
  onEndre,
  deaktivert,
}: {
  linje: Kurvlinje
  onEndre: (antall: number) => void
  deaktivert?: boolean
}) {
  const navn = `${linje.navn}${linje.variantTekst ? `, ${linje.variantTekst}` : ''}`
  return (
    <div className={styles.antall} role="group" aria-label={`Antall av ${navn}`}>
      <button
        type="button"
        className={styles.steg}
        onClick={() => onEndre(linje.antall - 1)}
        disabled={deaktivert || linje.antall <= 1}
        aria-label={`Ett færre av ${navn}`}
      >
        <Ikon navn="minus" storrelse={16} />
      </button>
      <output className={`${styles.verdi} tall`} aria-live="polite">
        {linje.antall}
      </output>
      <button
        type="button"
        className={styles.steg}
        onClick={() => onEndre(linje.antall + 1)}
        disabled={deaktivert || linje.antall >= linje.maks}
        aria-label={`Ett til av ${navn}`}
      >
        <Ikon navn="pluss" storrelse={16} />
      </button>
    </div>
  )
}

export function Kurvlinjer({ redigerbar = true }: { redigerbar?: boolean }) {
  const { linjer, status, settAntall, fjern, lukk, sistLagtTil } = useKurv()
  return (
    <ul className={styles.linjer} role="list">
      {linjer.map((l) => {
        const n = nokkel(l)
        const s = status.get(n)
        const melding = statustekst(s?.status)
        const ugyldig = s?.gyldig === false
        return (
          <li
            key={n}
            className={styles.linje}
            data-ny={n === sistLagtTil || undefined}
            data-ugyldig={ugyldig || undefined}
          >
            <Produktbilde bilde={l.bilde} sizes="80px" storrelse="mini" className={styles.miniatyr} />
            <div className={styles.linjetekst}>
              {l.merke ? <p className={styles.merke}>{l.merke}</p> : null}
              {l.slug ? (
                <Link href={`/produkt/${l.slug}`} className={styles.navn} onClick={lukk}>
                  {l.navn}
                </Link>
              ) : (
                <p className={styles.navn}>{l.navn}</p>
              )}
              {l.variantTekst ? <p className={styles.variant}>{l.variantTekst}</p> : null}
              {melding ? (
                <p className={styles.melding} data-type={s?.status.type} role="status">
                  <Ikon navn="info" storrelse={16} />
                  {melding}
                </p>
              ) : null}
              <div className={styles.linjebunn}>
                {redigerbar ? (
                  <Antallvelger linje={l} onEndre={(a) => settAntall(n, a)} deaktivert={ugyldig} />
                ) : (
                  <p className="liten dempet tall">Antall: {l.antall}</p>
                )}
                <p className={`${styles.linjepris} tall`}>
                  {kroner(l.enhetspris * l.antall)}
                  {l.antall > 1 ? (
                    <span className={styles.stykk}>{kroner(l.enhetspris)} pr. stk.</span>
                  ) : null}
                </p>
              </div>
              {redigerbar ? (
                <button type="button" className={styles.fjern} onClick={() => fjern(n)}>
                  Fjern<span className="skjult"> {l.navn}</span>
                </button>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function Handlekurv() {
  const { linjer, klar, apen, lukk, antall, delsum, validering, valider, status, sistLagtTil } = useKurv()
  const sist = linjer.find((l) => nokkel(l) === sistLagtTil)
  const harUgyldige = linjer.some((l) => status.get(nokkel(l))?.gyldig === false)

  return (
    <Skuff apen={apen} onLukk={lukk} etikett="Handlekurven" side="hoyre">
      <div className={styles.hode}>
        <h2 className={`${styles.tittel} t-3`}>
          Handlekurven{' '}
          {antall > 0 ? (
            <span className={`${styles.teller} tall`}>
              ({antall} {antall === 1 ? 'vare' : 'varer'})
            </span>
          ) : null}
        </h2>
        <button type="button" className="ikonknapp" onClick={lukk} aria-label="Lukk handlekurven" autoFocus>
          <Ikon navn="lukk" />
        </button>
      </div>

      <div className={styles.melding_ny} aria-live="polite">
        {sist ? (
          <p className={styles.lagtTil}>
            <span className={styles.hake} aria-hidden="true">
              <Ikon navn="sjekk" storrelse={16} />
            </span>
            Lagt i handlekurven: {sist.navn}
            {sist.variantTekst ? ` · ${sist.variantTekst.replace(/^.*?: /, '')}` : ''}
          </p>
        ) : null}
      </div>

      <div className={styles.kropp}>
        {!klar ? (
          <div className={styles.laster} aria-busy="true" aria-label="Laster handlekurven">
            {[0, 1].map((i) => (
              <div key={i} className={styles.skjelettlinje}>
                <div className="skjelett" style={{ inlineSize: 80, blockSize: 80 }} />
                <div style={{ display: 'grid', gap: 8, flex: 1 }}>
                  <div className="skjelett" style={{ blockSize: 12, inlineSize: '40%' }} />
                  <div className="skjelett" style={{ blockSize: 16, inlineSize: '80%' }} />
                  <div className="skjelett" style={{ blockSize: 12, inlineSize: '30%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : linjer.length === 0 ? (
          <div className={styles.tom}>
            <p className="t-3">Handlekurven er tom</p>
            <p className="dempet">Usikker på hvor du skal begynne? Her er noen gode innganger.</p>
            <ul className={styles.forslag} role="list">
              <li>
                <Link href="/kategori/nisjeduft" onClick={lukk} className="tekstlenke">
                  Nisjeduft <Ikon navn="pil" storrelse={16} data-pil />
                </Link>
              </li>
              <li>
                <Link href="/kategori/hudpleie" onClick={lukk} className="tekstlenke">
                  Hudpleie <Ikon navn="pil" storrelse={16} data-pil />
                </Link>
              </li>
              <li>
                <Link href="/kategori/gavesett" onClick={lukk} className="tekstlenke">
                  Gavesett <Ikon navn="pil" storrelse={16} data-pil />
                </Link>
              </li>
            </ul>
          </div>
        ) : (
          <Kurvlinjer />
        )}
      </div>

      {klar && linjer.length > 0 ? (
        <div className={styles.fot}>
          {validering === 'feil' ? (
            <div className={styles.feil} role="alert">
              <p>Vi fikk ikke sjekket pris og lager akkurat nå.</p>
              <button type="button" className="tekstlenke" onClick={() => void valider()}>
                Prøv igjen
              </button>
            </div>
          ) : null}
          <dl className={styles.sum}>
            <div>
              <dt>Delsum</dt>
              <dd className="tall" aria-busy={validering === 'laster'}>
                {kroner(delsum)}
              </dd>
            </div>
          </dl>
          <p className={styles.frakt}>Frakt velges i kassen. Hent i butikken er gratis.</p>
          <Link href="/kasse" className="knapp knapp--primar knapp--bred knapp--stor" onClick={lukk}>
            Gå til kassen <Ikon navn="pil" storrelse={18} data-pil />
          </Link>
          {harUgyldige ? (
            <p className={styles.frakt}>Noen varer kan ikke bestilles – se merknadene over.</p>
          ) : null}
          <button type="button" className={`tekstlenke ${styles.fortsett}`} onClick={lukk}>
            Fortsett å handle
          </button>
        </div>
      ) : null}
    </Skuff>
  )
}
