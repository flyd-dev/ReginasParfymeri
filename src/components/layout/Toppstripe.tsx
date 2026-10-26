import { FORDELER } from '@/innhold/butikk'
import styles from './Toppstripe.module.css'

/** Bare bekreftede fordeler fra Reginas egne vilkår (se innhold/butikk.ts). */
export function Toppstripe() {
  return (
    <div className={styles.stripe}>
      <ul className={styles.liste} role="list">
        {FORDELER.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </div>
  )
}
