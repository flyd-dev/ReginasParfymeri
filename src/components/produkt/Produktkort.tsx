import Link from 'next/link'
import type { Kortdata } from '@/lib/visning'
import { Ikon } from '../Ikon'
import { HurtigKjop } from './HurtigKjop'
import { Pris } from './Pris'
import { Produktbilde } from './Produktbilde'
import styles from './Produktkort.module.css'

export function Produktkort({
  produkt,
  prioritet = false,
  sizes = '(min-width: 80rem) 22vw, (min-width: 48rem) 30vw, 46vw',
  forsinkelse,
  avdekk = true,
}: {
  produkt: Kortdata
  prioritet?: boolean
  sizes?: string
  forsinkelse?: number
  avdekk?: boolean
}) {
  const href = `/produkt/${produkt.slug}`
  const merkelapp =
    produkt.lager === 'utsolgt'
      ? 'Utsolgt'
      : produkt.forPris
        ? 'Tilbud'
        : produkt.lager === 'fa-igjen'
          ? 'Få igjen'
          : null

  return (
    <article
      className={styles.kort}
      data-utsolgt={produkt.lager === 'utsolgt' || undefined}
      data-avdekk={avdekk || undefined}
      style={
        forsinkelse !== undefined ? ({ '--forsinkelse': forsinkelse } as React.CSSProperties) : undefined
      }
    >
      <div className={styles.bildeomrade}>
        <Produktbilde bilde={produkt.bilde} bilde2={produkt.bilde2} sizes={sizes} prioritet={prioritet} />
        {merkelapp ? (
          <span className={styles.merkelapp} data-type={merkelapp}>
            {merkelapp}
          </span>
        ) : null}
        {produkt.hurtig ? (
          <HurtigKjop linje={produkt.hurtig} navn={produkt.navn} className={styles.hurtig} />
        ) : produkt.lager !== 'utsolgt' && produkt.variantinfo ? (
          <Link href={href} className={styles.velg} tabIndex={-1} aria-hidden="true">
            Velg {produkt.variantinfo.includes('farge') ? 'farge' : 'størrelse'}
            <Ikon navn="pil" storrelse={16} data-pil />
          </Link>
        ) : null}
      </div>
      <div className={styles.tekst}>
        {produkt.merke ? <p className={styles.merke}>{produkt.merke}</p> : null}
        <h3 className={styles.navn}>
          <Link href={href} className={styles.lenke}>
            {produkt.navn}
          </Link>
        </h3>
        {produkt.variantinfo ? <p className={styles.variant}>{produkt.variantinfo}</p> : null}
        <Pris pris={produkt.pris} forPris={produkt.forPris} fra={produkt.fra} />
      </div>
    </article>
  )
}
