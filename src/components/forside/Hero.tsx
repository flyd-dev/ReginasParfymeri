import Image from 'next/image'
import Link from 'next/link'
import { BILDER } from '@/innhold/bilder'
import { HISTORIE } from '@/innhold/butikk'
import { kroner } from '@/lib/format'
import type { Kortdata } from '@/lib/visning'
import { Ikon } from '../Ikon'
import styles from './Hero.module.css'

// Redaksjonell kollasj (mønster fra 21st.dev «Editorial Collage Hero», bygget om uten Tailwind og
// Motion): butikkdøren i en bue, en frilagt flaske fra sortimentet foran og et lite bilde fra disken.
// Lagene beveger seg i ulik fart når siden rulles – bare transform, og ingenting ved redusert bevegelse.

export function Hero({ antallMerker, flaske }: { antallMerker: number; flaske: Kortdata | null }) {
  return (
    <section className={styles.hero} aria-labelledby="hero-tittel">
      <div className={`${styles.rutenett} ramme`}>
        <div className={styles.tekst}>
          <p className="kicker" data-inn style={{ '--i': 0 } as React.CSSProperties}>
            <span>
              <span className={styles.sted}>Haugesund · </span>Familietradisjon siden {HISTORIE.grunnlagt}
            </span>
          </p>
          <h1 id="hero-tittel" className={`t-mega ${styles.tittel}`}>
            <span className={styles.linje}>
              <span style={{ '--i': 0 } as React.CSSProperties}>Dufter du ikke</span>
            </span>{' '}
            <span className={styles.linje}>
              <span style={{ '--i': 1 } as React.CSSProperties}>
                finner <em>overalt</em>.
              </span>
            </span>
          </h1>
          <p className={`ingress ${styles.ingress}`} data-inn style={{ '--i': 3 } as React.CSSProperties}>
            Nisjeparfymer fra Creed, Initio, Parfums de Marly, Fugazzi og BDK – og hudpleie og makeup valgt
            med omhu. Handle her, eller kom innom Haraldsgata for personlig veiledning.
          </p>
          <div className={styles.handlinger} data-inn style={{ '--i': 4 } as React.CSSProperties}>
            <Link href="/kategori/nisjeduft" className="knapp knapp--primar knapp--stor">
              Utforsk nisjeduft <Ikon navn="pil" storrelse={18} data-pil />
            </Link>
            <Link href="/merker" className="tekstlenke">
              Alle {antallMerker} merker i nettbutikken
            </Link>
          </div>
          <p className={styles.tillit} data-inn style={{ '--i': 5 } as React.CSSProperties}>
            <Ikon navn="sjekk" storrelse={16} /> Autorisert forhandler av alle merkene vi fører
          </p>
        </div>

        <div className={styles.kollasj}>
          <figure className={styles.bue}>
            <div className={styles.bueInn}>
              <Image
                src={BILDER.fasade.bilde}
                alt={BILDER.fasade.alt}
                preload
                placeholder="blur"
                quality={90}
                sizes="(min-width: 64rem) 640px, 100vw"
                className={styles.foto}
              />
            </div>
            <figcaption className={styles.bildetekst}>
              <Ikon navn="sted" storrelse={16} /> Haraldsgata 138, rett overfor Viktoriahjørnet
            </figcaption>
          </figure>

          <div className={`${styles.lag} ${styles.lagSmaa}`} aria-hidden="true">
            <div className={styles.smaa}>
              <Image
                src={BILDER.vedDisken.bilde}
                alt=""
                placeholder="blur"
                sizes="(min-width: 64rem) 200px, 34vw"
                className={styles.foto}
              />
            </div>
          </div>

          {flaske?.bilde ? (
            <div className={`${styles.lag} ${styles.lagFlaske}`}>
              <Link href={`/produkt/${flaske.slug}`} className={styles.flaske}>
                <span className={styles.flaskebilde}>
                  <Image
                    src={flaske.bilde.src}
                    alt=""
                    fill
                    preload
                    sizes="(min-width: 64rem) 220px, 30vw"
                    className={styles.flaskefoto}
                  />
                </span>
                <span className={styles.etikett}>
                  {flaske.merke ? <span className={styles.etikettMerke}>{flaske.merke}</span> : null}
                  <span className={styles.etikettNavn}>{flaske.navn}</span>
                  <span className={`${styles.etikettPris} tall`}>
                    {flaske.fra ? 'Fra ' : ''}
                    {kroner(flaske.pris)}
                    <Ikon navn="pil" storrelse={14} />
                  </span>
                </span>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
