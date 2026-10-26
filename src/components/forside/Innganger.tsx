import Link from 'next/link'
import type { Bilde } from '@/lib/katalog/typer'
import { Ikon } from '../Ikon'
import { Produktbilde } from '../produkt/Produktbilde'
import styles from './Innganger.module.css'

export interface Inngang {
  navn: string
  href: string
  antall: number
  tekst: string
  bilde: Bilde | null
}

export function Innganger({ innganger }: { innganger: Inngang[] }) {
  return (
    <section className={`seksjon ${styles.seksjon}`} aria-labelledby="innganger-tittel">
      <div className={`${styles.rutenett} ramme`}>
        <div className={styles.intro}>
          <p className="kicker">Handle etter kategori</p>
          <h2 id="innganger-tittel" className="t-1">
            Hva leter du etter?
          </h2>
          <p className="dempet">Hele sortimentet i nettbutikken, ordnet slik du finner det i butikken.</p>
        </div>
        <ul className={styles.liste} role="list">
          {innganger.map((i, n) => (
            <li key={i.href} data-avdekk style={{ '--forsinkelse': n } as React.CSSProperties}>
              <Link href={i.href} className={styles.rad}>
                <span className={styles.nummer} aria-hidden="true">
                  {String(n + 1).padStart(2, '0')}
                </span>
                <span className={styles.navn}>{i.navn}</span>
                <span className={styles.tekst}>{i.tekst}</span>
                <span className={`${styles.antall} tall`}>{i.antall} produkter</span>
                <span className={styles.forhand} aria-hidden="true">
                  <Produktbilde bilde={i.bilde} sizes="96px" storrelse="mini" />
                </span>
                <Ikon navn="pil" storrelse={22} className={styles.pil} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
