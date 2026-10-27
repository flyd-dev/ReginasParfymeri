import Link from 'next/link'
import { BUTIKK, HUDPLEIE, KUN_I_BUTIKKEN, LEVERING, NISJE, RETUR } from '@/innhold/butikk'
import { Ikon } from '../Ikon'
import styles from './Sporsmal.module.css'

// Spørsmål og svar (mønster fra 21st.dev-malen «YukoHealth storefront»). Svarene er bare Reginas egne
// opplysninger fra vilkårene og nettsidene (src/innhold/butikk.ts) – ingenting nytt er lovet.
// Bygget på <details>, så det virker uten JavaScript og med tastatur.

export function Sporsmal() {
  const henting = LEVERING.alternativer.find((a) => a.navn === 'Hent i butikken')
  return (
    <section className={`${styles.sporsmal} seksjon`} aria-labelledby="sporsmal-tittel">
      <div className={`${styles.rutenett} ramme`}>
        <div className={styles.hode}>
          <p className="kicker">Spørsmål og svar</p>
          <h2 id="sporsmal-tittel" className="t-1">
            Godt å vite før du handler
          </h2>
          <p className="dempet">
            Finner du ikke svaret, ring oss på{' '}
            <a href={BUTIKK.telefon.lenke} className="tekstlenke">
              {BUTIKK.telefon.visning}
            </a>
            .
          </p>
        </div>
        <div className={styles.liste}>
          <details className={styles.punkt} name="sporsmal">
            <summary>
              Hva koster frakten, og hvor lang tid tar det?
              <Ikon navn="pluss" storrelse={20} className={styles.ikon} />
            </summary>
            <div className={styles.svar}>
              <p>{LEVERING.fra}</p>
              <ul role="list">
                {LEVERING.alternativer.map((a) => (
                  <li key={a.navn}>
                    <strong>
                      {a.navn} · {a.pris}
                    </strong>{' '}
                    – {a.tekst}
                  </li>
                ))}
              </ul>
            </div>
          </details>
          {henting ? (
            <details className={styles.punkt} name="sporsmal">
              <summary>
                Kan jeg hente bestillingen i butikken?
                <Ikon navn="pluss" storrelse={20} className={styles.ikon} />
              </summary>
              <div className={styles.svar}>
                <p>
                  Ja, det er gratis. {henting.tekst} Butikken ligger i {BUTIKK.adresse.gate},{' '}
                  {BUTIKK.adresse.sted}.
                </p>
              </div>
            </details>
          ) : null}
          <details className={styles.punkt} name="sporsmal">
            <summary>
              Hvordan returnerer jeg en vare?
              <Ikon navn="pluss" storrelse={20} className={styles.ikon} />
            </summary>
            <div className={styles.svar}>
              {RETUR.tekst.map((t) => (
                <p key={t}>{t}</p>
              ))}
              <p>
                <Link href="/kundeservice#retur" className="tekstlenke">
                  Mer om retur og angrerett
                </Link>
              </p>
            </div>
          </details>
          <details className={styles.punkt} name="sporsmal">
            <summary>
              Hvorfor finner jeg ikke {KUN_I_BUTIKKEN[0]} eller {KUN_I_BUTIKKEN[1]} i nettbutikken?
              <Ikon navn="pluss" storrelse={20} className={styles.ikon} />
            </summary>
            <div className={styles.svar}>
              <p>
                Enkelte eksklusive merker selges bare i butikken i Haraldsgata, etter avtale med leverandørene
                – blant annet {KUN_I_BUTIKKEN.slice(0, 6).join(', ')}. Ring eller send oss en e-post, så
                hjelper vi deg.
              </p>
              <p>
                <Link href="/merker#butikken" className="tekstlenke">
                  Se merkene i butikken
                </Link>
              </p>
            </div>
          </details>
          <details className={styles.punkt} name="sporsmal">
            <summary>
              Kan jeg få hjelp til å finne en duft?
              <Ikon navn="pluss" storrelse={20} className={styles.ikon} />
            </summary>
            <div className={styles.svar}>
              <p>{NISJE.veiledning}</p>
              <p>
                Ring {BUTIKK.telefon.visning} eller skriv til{' '}
                <a href={`mailto:${BUTIKK.epost}`} className="tekstlenke">
                  {BUTIKK.epost}
                </a>
                .
              </p>
            </div>
          </details>
          <details className={styles.punkt} name="sporsmal">
            <summary>
              Hvordan bestiller jeg time i hudpleieavdelingen?
              <Ikon navn="pluss" storrelse={20} className={styles.ikon} />
            </summary>
            <div className={styles.svar}>
              <p>{HUDPLEIE.tekst}</p>
              <p>
                <a href={BUTIKK.timebestilling} className="tekstlenke">
                  Bestill time hos Ledig Time
                </a>
              </p>
            </div>
          </details>
        </div>
      </div>
    </section>
  )
}
