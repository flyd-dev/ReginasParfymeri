import type { Lager } from '@/lib/katalog/typer'
import styles from './Lagerstatus.module.css'

/** Lagerstatus slik WooCommerce oppgir den. Ingen egne løfter om levering. */
export function lagertekst(lager: Pick<Lager, 'status' | 'tekst' | 'antall'>): string {
  switch (lager.status) {
    case 'utsolgt':
      return 'Utsolgt i nettbutikken'
    case 'restordre':
      return lager.tekst || 'Kan bestilles'
    case 'fa-igjen':
      return lager.antall ? `Få igjen – ${lager.antall} på lager` : 'Få igjen'
    default:
      return lager.tekst || 'På lager'
  }
}

export function Lagerstatus({ lager }: { lager: Pick<Lager, 'status' | 'tekst' | 'antall'> }) {
  return (
    <p className={styles.lager} data-status={lager.status}>
      <span className={styles.prikk} aria-hidden="true" />
      {lagertekst(lager)}
    </p>
  )
}
