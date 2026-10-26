import Image from 'next/image'
import Link from 'next/link'
import { BILDER } from '@/innhold/bilder'
import { HISTORIE } from '@/innhold/butikk'
import { Ikon } from '../Ikon'
import styles from './Hero.module.css'

export function Hero({ antallMerker }: { antallMerker: number }) {
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
            <span data-inn style={{ '--i': 1 } as React.CSSProperties}>
              Dufter du ikke
            </span>{' '}
            <span data-inn style={{ '--i': 2 } as React.CSSProperties}>
              finner <em>overalt</em>.
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

        <figure className={styles.bilde}>
          <div className={styles.bue}>
            <Image
              src={BILDER.fasade.bilde}
              alt={BILDER.fasade.alt}
              preload
              placeholder="blur"
              quality={90}
              sizes="(min-width: 64rem) 1000px, 100vw"
              className={styles.foto}
            />
          </div>
          {/* Løperen fra døren i Haraldsgata ruller videre ut på siden. */}
          <span className={styles.loper} aria-hidden="true" />
          <figcaption className={styles.bildetekst}>
            <Ikon navn="sted" storrelse={16} /> Haraldsgata 138, rett overfor Viktoriahjørnet
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
