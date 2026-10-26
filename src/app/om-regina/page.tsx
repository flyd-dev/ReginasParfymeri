import type { Metadata } from 'next'
import Image from 'next/image'
import { Brodsmuler } from '@/components/Brodsmuler'
import { Ikon } from '@/components/Ikon'
import { BILDER } from '@/innhold/bilder'
import { BUTIKK, HISTORIE, HUDPLEIE, NISJE } from '@/innhold/butikk'
import styles from './om.module.css'

export const metadata: Metadata = {
  title: 'Om Regina',
  description:
    'Regina er et av Norges eldste frittstående parfymerier – en familietradisjon fra 1863, i Haraldsgata i Haugesund.',
}

export default function OmRegina() {
  return (
    <div className={styles.side}>
      <div className="ramme">
        <Brodsmuler smuler={[{ navn: 'Om Regina' }]} />
      </div>

      <section className={`${styles.topp} ramme`} aria-labelledby="om-tittel">
        <div className={styles.topptekst}>
          <p className="kicker">Om Regina</p>
          <h1 id="om-tittel" className="t-mega">
            Et parfymeri med <em>røtter</em>
          </h1>
          <p className="ingress">{HISTORIE.tekst[0]}</p>
        </div>
        <figure className={styles.toppbilde}>
          <Image
            src={BILDER.fasade.bilde}
            alt={BILDER.fasade.alt}
            placeholder="blur"
            preload
            sizes="(min-width: 64rem) 1000px, 100vw"
            quality={90}
          />
        </figure>
      </section>

      <section className={`${styles.tidslinje} ramme`} aria-label="Historien">
        <ol role="list">
          <li data-avdekk>
            <p className={styles.aar}>{HISTORIE.grunnlagt}</p>
            <p>Grethes tippoldefar starter Nilsen &amp; Sønner – begynnelsen på familietradisjonen.</p>
          </li>
          <li data-avdekk style={{ '--forsinkelse': 1 } as React.CSSProperties}>
            <p className={styles.aar}>{HISTORIE.etablert}</p>
            <p>AS Regina etableres.</p>
          </li>
          <li data-avdekk style={{ '--forsinkelse': 2 } as React.CSSProperties}>
            <p className={styles.aar}>I dag</p>
            <p>{HISTORIE.tekst[1]}</p>
          </li>
        </ol>
      </section>

      <section className={`${styles.delt} ramme`} aria-labelledby="nisje-tittel">
        <figure className={styles.deltbilde} data-avdekk>
          <Image
            src={BILDER.tomFord.bilde}
            alt={BILDER.tomFord.alt}
            placeholder="blur"
            sizes="(min-width: 64rem) 50vw, 100vw"
          />
        </figure>
        <div className={styles.delttekst} data-avdekk>
          <p className="kicker">Nisjeduft og veiledning</p>
          <h2 id="nisje-tittel" className="t-2">
            Tid til å finne din duft
          </h2>
          <p>{NISJE.tekst}</p>
          <p>{NISJE.veiledning}</p>
          <p className="dempet liten">{HISTORIE.autorisert}</p>
        </div>
      </section>

      <section className={`${styles.delt} ${styles.speilet} ramme`} aria-labelledby="hud-tittel">
        <figure className={styles.deltbilde} data-avdekk>
          <Image
            src={BILDER.behandlingsrom.bilde}
            alt={BILDER.behandlingsrom.alt}
            placeholder="blur"
            sizes="(min-width: 64rem) 50vw, 100vw"
          />
        </figure>
        <div className={styles.delttekst} data-avdekk>
          <p className="kicker">Hudpleieavdelingen</p>
          <h2 id="hud-tittel" className="t-2">
            Behandlinger i andre etasje
          </h2>
          <p>{HUDPLEIE.tekst}</p>
          <a href={BUTIKK.timebestilling} className="knapp knapp--mork">
            <Ikon navn="kalender" storrelse={18} /> Bestill time
            <span className="skjult"> (åpner timebestillingen hos Ledig Time)</span>
          </a>
        </div>
      </section>

      <section id="besok" className={styles.besok} aria-labelledby="besok-tittel">
        <div className={`${styles.besokinnhold} ramme`}>
          <div>
            <p className="kicker">Besøk oss</p>
            <h2 id="besok-tittel" className="t-1">
              {BUTIKK.adresse.gate}
            </h2>
            <p className="ingress">
              {BUTIKK.adresse.postnr} {BUTIKK.adresse.sted}. {BUTIKK.beliggenhet}.
            </p>
          </div>
          <dl className={styles.kontakt}>
            <div>
              <dt>Telefon</dt>
              <dd>
                <a href={BUTIKK.telefon.lenke}>{BUTIKK.telefon.visning}</a> · butikken{' '}
                <a href={BUTIKK.telefonButikk.lenke}>{BUTIKK.telefonButikk.visning}</a>
              </dd>
            </div>
            <div>
              <dt>E-post</dt>
              <dd>
                <a href={`mailto:${BUTIKK.epost}`}>{BUTIKK.epost}</a>
              </dd>
            </div>
            <div>
              <dt>Kart</dt>
              <dd>
                <a href={BUTIKK.kart}>Veibeskrivelse</a>
              </dd>
            </div>
            <div>
              <dt>Følg oss</dt>
              <dd>
                <a href={BUTIKK.instagram.lenke}>Instagram {BUTIKK.instagram.navn}</a> ·{' '}
                <a href={BUTIKK.facebook.lenke}>Facebook</a>
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  )
}
