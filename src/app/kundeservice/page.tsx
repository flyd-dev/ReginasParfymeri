import type { Metadata } from 'next'
import { Brodsmuler } from '@/components/Brodsmuler'
import { Ikon } from '@/components/Ikon'
import { BUTIKK, LEVERING, RETUR } from '@/innhold/butikk'
import styles from './kundeservice.module.css'

export const metadata: Metadata = {
  title: 'Levering, retur og kontakt',
  description:
    'Slik sender Regina varene dine, slik returnerer du, og slik kontakter du butikken i Haugesund.',
}

export default function Kundeservice() {
  return (
    <div className={`${styles.side} ramme`}>
      <Brodsmuler smuler={[{ navn: 'Kundeservice' }]} />
      <header className={styles.hode}>
        <p className="kicker">Kundeservice</p>
        <h1 className="t-1">Levering, retur og kontakt</h1>
      </header>

      <div className={styles.innhold}>
        <section id="levering" className={styles.blokk} aria-labelledby="levering-tittel">
          <h2 id="levering-tittel" className="t-3">
            Levering
          </h2>
          <p>{LEVERING.fra}</p>
          <ul role="list" className={styles.alternativer}>
            {LEVERING.alternativer.map((a) => (
              <li key={a.navn}>
                <div className={styles.alternativhode}>
                  <span>{a.navn}</span>
                  <span className="tall">{a.pris}</span>
                </div>
                <p className="liten dempet">{a.tekst}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="retur" className={styles.blokk} aria-labelledby="retur-tittel">
          <h2 id="retur-tittel" className="t-3">
            Retur og angrerett
          </h2>
          {RETUR.tekst.map((t) => (
            <p key={t}>{t}</p>
          ))}
          <p>
            <a href={BUTIKK.betingelser} className="tekstlenke">
              Les salgsbetingelsene <Ikon navn="utenfor" storrelse={14} />
            </a>
          </p>
        </section>

        <section id="kontakt" className={styles.blokk} aria-labelledby="kontakt-tittel">
          <h2 id="kontakt-tittel" className="t-3">
            Kontakt oss
          </h2>
          <p>Har du spørsmål om et produkt, en bestilling eller en retur? Vi hjelper deg gjerne.</p>
          <ul role="list" className={styles.kontakt}>
            <li>
              <Ikon navn="telefon" /> <a href={BUTIKK.telefon.lenke}>{BUTIKK.telefon.visning}</a>
            </li>
            <li>
              <Ikon navn="post" /> <a href={`mailto:${BUTIKK.epost}`}>{BUTIKK.epost}</a>
            </li>
            <li>
              <Ikon navn="sted" /> {BUTIKK.adresse.gate}, {BUTIKK.adresse.postnr} {BUTIKK.adresse.sted}
            </li>
          </ul>
          <p className="mini dempet">
            {BUTIKK.selskap} · Org.nr. {BUTIKK.orgnr}
          </p>
        </section>
      </div>
    </div>
  )
}
