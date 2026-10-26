import styles from './Logo.module.css'

/**
 * Reginas skriftlogo – originalfilen fra reginaparfymeri.no (logo-med-tekst-2.svg), uendret og i
 * logoens egen rosa (#EF3AA7). Slik står den også i toppen av reginaparfymeri.no i dag.
 */
export function Logo({ variant = 'standard' }: { variant?: 'standard' | 'stor' }) {
  return (
    <span className={`${styles.logo} ${styles[variant]}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG-logoen skal vises uendret, uten bildeoptimalisering */}
      <img src="/logo/regina-skrift.svg" alt="" width={404} height={354} className={styles.skrift} />
      <span className="skjult">Regina Parfymeri</span>
    </span>
  )
}
