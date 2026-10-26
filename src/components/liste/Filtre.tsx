'use client'

import { useId, useState } from 'react'
import type { Fasetter } from '@/lib/katalog/sporring'
import { SORTERINGER } from '@/lib/katalog/sporring'
import { listeUrl, veksle, type Listetilstand } from '@/lib/katalog/listeurl'
import { Ikon } from '../Ikon'
import { Skuff } from '../Skuff'
import { useListe } from './ListeNavigasjon'
import styles from './Liste.module.css'

interface Felles {
  basis: string
  tilstand: Listetilstand
  fasetter: Fasetter
  kategoritittel: string
}

function Avkrysning({
  valgt,
  navn,
  antall,
  onEndre,
}: {
  valgt: boolean
  navn: string
  antall: number
  onEndre: () => void
}) {
  const id = useId()
  // Avkrysningen følger klikket med en gang; listen oppdateres når svaret kommer.
  const [lokal, setLokal] = useState(valgt)
  const [forrige, setForrige] = useState(valgt)
  if (valgt !== forrige) {
    setForrige(valgt)
    setLokal(valgt)
  }
  return (
    <li className={styles.valg}>
      <input
        id={id}
        type="checkbox"
        checked={lokal}
        onChange={() => {
          setLokal((v) => !v)
          onEndre()
        }}
        disabled={!lokal && antall === 0}
      />
      <label htmlFor={id}>
        <span>{navn}</span>
        <span className={`${styles.valgantall} tall`}>{antall}</span>
      </label>
    </li>
  )
}

function Filterskjema({ basis, tilstand, fasetter, kategoritittel }: Felles) {
  const { naviger } = useListe()
  const [alleMerker, setAlleMerker] = useState(false)
  const f = tilstand.filtre
  const sett = (endring: Partial<Listetilstand['filtre']>) =>
    naviger(listeUrl(basis, tilstand, { filtre: { ...f, ...endring } }))
  const merker = alleMerker ? fasetter.merke : fasetter.merke.slice(0, 8)

  return (
    <div className={styles.skjema}>
      {fasetter.kategori.length > 1 ? (
        <fieldset className={styles.gruppe}>
          <legend>{kategoritittel}</legend>
          <ul role="list">
            {fasetter.kategori.map((k) => (
              <Avkrysning
                key={k.id}
                valgt={k.valgt}
                navn={k.navn}
                antall={k.antall}
                onEndre={() => sett({ kategori: veksle(f.kategori, k.id) })}
              />
            ))}
          </ul>
        </fieldset>
      ) : null}

      {fasetter.merke.length > 1 ? (
        <fieldset className={styles.gruppe}>
          <legend>Merke</legend>
          <ul role="list">
            {merker.map((m) => (
              <Avkrysning
                key={m.id}
                valgt={m.valgt}
                navn={m.navn}
                antall={m.antall}
                onEndre={() => sett({ merke: veksle(f.merke, m.id) })}
              />
            ))}
          </ul>
          {fasetter.merke.length > 8 ? (
            <button
              type="button"
              className={styles.flere}
              onClick={() => setAlleMerker((v) => !v)}
              aria-expanded={alleMerker}
            >
              {alleMerker ? 'Vis færre merker' : `Vis alle ${fasetter.merke.length} merker`}
            </button>
          ) : null}
        </fieldset>
      ) : null}

      {fasetter.pris.length > 1 ? (
        <fieldset className={styles.gruppe}>
          <legend>Pris</legend>
          <ul role="list">
            {fasetter.pris.map((p) => (
              <Avkrysning
                key={p.id}
                valgt={p.valgt}
                navn={p.navn}
                antall={p.antall}
                onEndre={() => sett({ pris: veksle(f.pris, p.id) })}
              />
            ))}
          </ul>
        </fieldset>
      ) : null}

      <fieldset className={styles.gruppe}>
        <legend>Tilgjengelighet</legend>
        <ul role="list">
          <Avkrysning
            valgt={f.lager}
            navn="Bare varer på lager"
            antall={fasetter.lager}
            onEndre={() => sett({ lager: !f.lager })}
          />
          {fasetter.tilbud > 0 || f.tilbud ? (
            <Avkrysning
              valgt={f.tilbud}
              navn="På tilbud"
              antall={fasetter.tilbud}
              onEndre={() => sett({ tilbud: !f.tilbud })}
            />
          ) : null}
        </ul>
      </fieldset>
    </div>
  )
}

export function Filterpanel(props: Felles) {
  return (
    <aside className={styles.sidepanel} aria-label="Filtre">
      <Filterskjema {...props} />
    </aside>
  )
}

export function Verktoylinje({
  antall,
  ...props
}: Felles & { antall: number; antallAktive: number; harSok?: boolean }) {
  const { naviger, filterApen, setFilterApen, laster } = useListe()
  const id = useId()
  const sorteringer = props.harSok
    ? [{ id: 'relevans' as const, navn: 'Mest relevant' }, ...SORTERINGER]
    : SORTERINGER
  return (
    <div className={styles.verktoy}>
      <button
        type="button"
        className={`knapp knapp--sekundar ${styles.filterknapp}`}
        onClick={() => setFilterApen(true)}
        aria-haspopup="dialog"
      >
        <Ikon navn="filter" storrelse={18} /> Filtrer
        {props.antallAktive > 0 ? (
          <span className={`${styles.aktivteller} tall`}>{props.antallAktive}</span>
        ) : null}
      </button>
      <div className={styles.sortering}>
        <label htmlFor={id}>Sorter</label>
        <select
          id={id}
          className={styles.velger}
          value={props.tilstand.sortering}
          onChange={(e) =>
            naviger(
              listeUrl(props.basis, props.tilstand, {
                sortering: e.target.value as Listetilstand['sortering'],
              }),
            )
          }
        >
          {sorteringer.map((s) => (
            <option key={s.id} value={s.id}>
              {s.navn}
            </option>
          ))}
        </select>
        <Ikon navn="ned" storrelse={16} className={styles.velgerpil} />
      </div>

      <Skuff apen={filterApen} onLukk={() => setFilterApen(false)} side="venstre" etikett="Filtre">
        <div className={styles.skuffhode}>
          <p className="t-3">Filtrer</p>
          <button
            type="button"
            className="ikonknapp"
            onClick={() => setFilterApen(false)}
            aria-label="Lukk filtrene"
          >
            <Ikon navn="lukk" />
          </button>
        </div>
        <div className={styles.skuffkropp}>
          <Filterskjema {...props} />
        </div>
        <div className={styles.skufffot}>
          {props.antallAktive > 0 ? (
            <button
              type="button"
              className="tekstlenke"
              onClick={() =>
                naviger(
                  listeUrl(props.basis, {
                    ...props.tilstand,
                    filtre: { kategori: [], merke: [], pris: [], lager: false, tilbud: false, note: null },
                  }),
                )
              }
            >
              Nullstill
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="knapp knapp--primar"
            onClick={() => setFilterApen(false)}
            aria-busy={laster}
          >
            Vis {antall} {antall === 1 ? 'produkt' : 'produkter'}
          </button>
        </div>
      </Skuff>
    </div>
  )
}
