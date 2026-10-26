import Image from 'next/image'
import Link from 'next/link'
import type { Fotografi } from '@/innhold/bilder'
import type { Inngangsflate } from '@/innhold/forside'
import type { Bilde } from '@/lib/katalog/typer'
import { Ikon } from '../Ikon'
import { Produktbilde } from '../produkt/Produktbilde'
import styles from './Innganger.module.css'

// Kategoriene som et rutenett av kort (mønster fra 21st.dev «Shop by Category Grid», bygget om):
// Reginas egne butikkbilder der de viser det kategorien selger, ellers frilagte produkter fra
// kategorien på en farget flate. Hele kortet er én lenke med kategorinavn og antall.

export type Inngangsvisning =
  | { type: 'foto'; foto: Fotografi; nokkel: string }
  | { type: 'flasker'; bilder: Bilde[]; flate: Inngangsflate }
  | { type: 'produkt'; bilde: Bilde | null }

export interface Inngang {
  navn: string
  href: string
  antall: number
  tekst: string
  plass: 'stor' | 'hoy' | 'bred' | 'vanlig'
  visning: Inngangsvisning
}

export function Innganger({ innganger }: { innganger: Inngang[] }) {
  return (
    <section className={`seksjon ${styles.seksjon}`} aria-labelledby="innganger-tittel">
      <div className="ramme">
        <div className={styles.hode}>
          <p className="kicker">Handle etter kategori</p>
          <h2 id="innganger-tittel" className="t-1">
            Hva leter du etter?
          </h2>
          <p className="dempet">Hele sortimentet i nettbutikken, ordnet slik du finner det i butikken.</p>
        </div>
        <ul className={styles.rutenett} role="list">
          {innganger.map((i, n) => (
            <li
              key={i.href}
              className={styles.celle}
              data-plass={i.plass}
              data-avdekk
              style={{ '--forsinkelse': n % 4 } as React.CSSProperties}
            >
              <Link
                href={i.href}
                className={styles.kort}
                data-visning={i.visning.type}
                data-farge={i.visning.type === 'flasker' ? i.visning.flate : undefined}
                data-foto={i.visning.type === 'foto' ? i.visning.nokkel : undefined}
              >
                <Visning visning={i.visning} stor={i.plass === 'stor'} />
                <span className={styles.etikett}>
                  <span className={styles.navn}>{i.navn}</span>
                  <span className={styles.meta}>
                    <span className="tall">{i.antall} produkter</span>
                    <span className={styles.tekst}> · {i.tekst}</span>
                  </span>
                </span>
                <span className={styles.pil} aria-hidden="true">
                  <Ikon navn="pil" storrelse={18} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Samme bilde som kortet på forsiden, uten lenke – til toppen av kategorisiden. */
export function Inngangsflate({ visning }: { visning: Inngangsvisning }) {
  return (
    <span
      className={styles.kort}
      data-visning={visning.type}
      data-farge={visning.type === 'flasker' ? visning.flate : undefined}
      data-foto={visning.type === 'foto' ? visning.nokkel : undefined}
    >
      <Visning visning={visning} stor />
    </span>
  )
}

function Visning({ visning, stor }: { visning: Inngangsvisning; stor: boolean }) {
  if (visning.type === 'foto') {
    return (
      <span className={styles.foto}>
        <Image
          src={visning.foto.bilde}
          alt=""
          placeholder="blur"
          sizes={stor ? '(min-width: 64rem) 50vw, 100vw' : '(min-width: 64rem) 25vw, 50vw'}
          className={styles.fotoBilde}
        />
      </span>
    )
  }
  if (visning.type === 'flasker') {
    return (
      <span className={styles.flasker} data-antall={visning.bilder.length}>
        {visning.bilder.map((b, n) => (
          <span key={b.src} className={styles.flaske} style={{ '--n': n } as React.CSSProperties}>
            <Image
              src={b.src}
              alt=""
              fill
              sizes={stor ? '(min-width: 64rem) 18vw, 40vw' : '(min-width: 64rem) 14vw, 30vw'}
              className={styles.flaskeBilde}
            />
          </span>
        ))}
      </span>
    )
  }
  return (
    <span className={styles.produkt}>
      <Produktbilde bilde={visning.bilde} sizes="(min-width: 64rem) 14vw, 30vw" storrelse="mini" />
    </span>
  )
}
