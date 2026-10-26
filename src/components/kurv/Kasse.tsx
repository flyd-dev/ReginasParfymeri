'use client'

// Kassen i konseptet: en gjennomgang av handlekurven før videre til Reginas egen kasse i WooCommerce.
// I konseptmodus sendes ingenting videre, og det finnes ingen betalingsknapp som later som.

import Link from 'next/link'
import { useEffect } from 'react'
import { LEVERING } from '@/innhold/butikk'
import { kroner } from '@/lib/format'
import { nokkel } from '@/lib/handlekurv/kurv'
import { kasselenke, type Kassemodus } from '@/lib/kasse/lenke'
import { Ikon } from '../Ikon'
import { Kurvlinjer } from './Handlekurv'
import { useKurv } from './KurvProvider'
import styles from './Kasse.module.css'

export function Kasse({ modus, butikk }: { modus: Kassemodus; butikk: string }) {
  const { linjer, klar, delsum, antall, validering, valider, status } = useKurv()

  useEffect(() => {
    if (klar) void valider()
    // Valider på nytt når innholdet endres.
  }, [klar, valider, linjer.length])

  const ugyldige = linjer.filter((l) => status.get(nokkel(l))?.gyldig === false)
  const klarForKasse = klar && linjer.length > 0 && ugyldige.length === 0 && validering === 'ok'

  return (
    <div className={`${styles.side} ramme`}>
      <ol className={styles.steg} aria-label="Steg i bestillingen">
        <li data-ferdig>
          <span className={styles.stegnr}>
            <Ikon navn="sjekk" storrelse={14} />
          </span>
          Handlekurv
        </li>
        <li aria-current="step">
          <span className={styles.stegnr}>2</span>
          Se over
        </li>
        <li>
          <span className={styles.stegnr}>3</span>
          Levering og betaling
        </li>
      </ol>

      <h1 className="t-1">Se over bestillingen</h1>

      {!klar ? (
        <div className={styles.laster} aria-busy="true">
          <div className="skjelett" style={{ blockSize: 96 }} />
          <div className="skjelett" style={{ blockSize: 96 }} />
        </div>
      ) : linjer.length === 0 ? (
        <div className={styles.tom}>
          <p className="t-3">Handlekurven er tom</p>
          <p className="dempet">Legg noe i handlekurven først, så kan du gå videre til kassen herfra.</p>
          <Link href="/kategori/nisjeduft" className="knapp knapp--primar">
            Utforsk nisjeduft <Ikon navn="pil" storrelse={18} data-pil />
          </Link>
        </div>
      ) : (
        <div className={styles.oppsett}>
          <div className={styles.venstre}>
            <section aria-labelledby="linjer-tittel" className={styles.blokk}>
              <h2 id="linjer-tittel" className={styles.blokktittel}>
                Varer ({antall})
              </h2>
              <Kurvlinjer />
            </section>

            <section aria-labelledby="levering-tittel" className={styles.blokk}>
              <h2 id="levering-tittel" className={styles.blokktittel}>
                Levering
              </h2>
              <p className="liten dempet">{LEVERING.fra} Du velger leveringsmåte i neste steg.</p>
              <ul role="list" className={styles.levering}>
                {LEVERING.alternativer.map((a) => (
                  <li key={a.navn}>
                    <div className={styles.leveringshode}>
                      <span className={styles.leveringsnavn}>{a.navn}</span>
                      <span className="tall">{a.pris}</span>
                    </div>
                    <p className="mini dempet">{a.tekst}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className={styles.sammendrag} aria-labelledby="sum-tittel">
            <h2 id="sum-tittel" className={styles.blokktittel}>
              Sammendrag
            </h2>
            <dl className={styles.summer}>
              <div>
                <dt>Varer</dt>
                <dd className="tall" aria-busy={validering === 'laster'}>
                  {kroner(delsum)}
                </dd>
              </div>
              <div>
                <dt>Frakt</dt>
                <dd>Velges i neste steg</dd>
              </div>
            </dl>
            <p className="mini dempet">
              Prisene er inkludert mva. Totalbeløpet med frakt ser du før du betaler.
            </p>

            {validering === 'feil' ? (
              <div className={styles.feil} role="alert">
                <p>Vi fikk ikke sjekket pris og lager akkurat nå.</p>
                <button type="button" className="tekstlenke" onClick={() => void valider()}>
                  Prøv igjen
                </button>
              </div>
            ) : null}
            {ugyldige.length > 0 ? (
              <p className={styles.advarsel} role="status">
                {ugyldige.length === 1 ? 'Én vare' : `${ugyldige.length} varer`} kan ikke bestilles. Fjern{' '}
                {ugyldige.length === 1 ? 'den' : 'dem'} for å gå videre.
              </p>
            ) : null}

            {modus === 'woocommerce' ? (
              klarForKasse ? (
                <a
                  href={kasselenke(
                    butikk,
                    linjer.map((l) => ({ produktId: l.produktId, variantId: l.variantId, antall: l.antall })),
                  )}
                  className="knapp knapp--primar knapp--bred knapp--stor"
                >
                  Fortsett til levering og betaling <Ikon navn="pil" storrelse={18} data-pil />
                </a>
              ) : (
                <p className="liten dempet" role="status">
                  {validering === 'laster'
                    ? 'Sjekker pris og lager …'
                    : 'Rett opp merknadene over for å gå videre.'}
                </p>
              )
            ) : (
              <div className={styles.konsept} role="note">
                <p className={styles.konsepttittel}>Konseptversjon</p>
                <p>
                  I den ferdige nettbutikken går du herfra videre til Reginas kasse for levering og betaling.
                  I denne versjonen er betaling ikke aktivert, og ingen bestilling blir sendt.
                </p>
              </div>
            )}

            <Link href="/" className={`tekstlenke ${styles.fortsett}`}>
              Fortsett å handle
            </Link>
          </aside>
        </div>
      )}
    </div>
  )
}
