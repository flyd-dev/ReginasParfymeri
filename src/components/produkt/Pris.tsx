import { kroner } from '@/lib/format'
import type { Ore } from '@/lib/katalog/typer'
import styles from './Pris.module.css'

export function Pris({
  pris,
  forPris,
  fra = false,
  storrelse = 'normal',
}: {
  pris: Ore
  forPris?: Ore | null
  fra?: boolean
  storrelse?: 'normal' | 'stor'
}) {
  return (
    <p className={`${styles.pris} ${styles[storrelse]} tall`}>
      {fra ? <span className={styles.fra}>Fra </span> : null}
      {forPris && forPris > pris ? (
        <>
          <span className={styles.tilbud}>
            <span className="skjult">Tilbudspris </span>
            {kroner(pris)}
          </span>{' '}
          <s className={styles.for}>
            <span className="skjult">Før </span>
            {kroner(forPris)}
          </s>
        </>
      ) : (
        kroner(pris)
      )}
    </p>
  )
}
