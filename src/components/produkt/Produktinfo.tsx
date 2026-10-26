import type { Duftnoter, Innholdsblokk } from '@/lib/katalog/typer'
import styles from './Produktinfo.module.css'

/** Topp-, hjerte- og bunnoter – bare når de står oppgitt i produktbeskrivelsen. */
export function Duftpyramide({ noter }: { noter: Duftnoter }) {
  const nivaa = [
    { navn: 'Toppnoter', tekst: 'Det første du kjenner', noter: noter.topp },
    { navn: 'Hjertenoter', tekst: 'Duftens kjerne', noter: noter.hjerte },
    { navn: 'Bunnoter', tekst: 'Det som blir værende', noter: noter.bunn },
  ].filter((n) => n.noter.length > 0)
  return (
    <ol role="list" className={styles.pyramide}>
      {nivaa.map((n, i) => (
        <li key={n.navn} className={styles.nivaa} style={{ '--n': i } as React.CSSProperties} data-avdekk>
          <div className={styles.nivaahode}>
            <p className={styles.nivaanavn}>{n.navn}</p>
            <p className={styles.nivaatekst}>{n.tekst}</p>
          </div>
          <ul role="list" className={styles.noter}>
            {n.noter.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}

export function Beskrivelse({ blokker }: { blokker: Innholdsblokk[] }) {
  return (
    <div className={styles.beskrivelse}>
      {blokker.map((b, i) => {
        if (b.type === 'overskrift') return <h3 key={i}>{b.tekst}</h3>
        if (b.type === 'liste')
          return (
            <ul key={i}>
              {b.punkter.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )
        return <p key={i}>{b.tekst}</p>
      })}
    </div>
  )
}
