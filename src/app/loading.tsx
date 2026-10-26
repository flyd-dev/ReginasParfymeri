import styles from './laster.module.css'

/** Vises mens en side lastes. Samme form som innholdet, så ingenting hopper. */
export default function Laster() {
  return (
    <div className={`${styles.laster} ramme`} aria-busy="true" aria-label="Laster">
      <div className="skjelett" style={{ blockSize: 14, inlineSize: '12rem' }} />
      <div className="skjelett" style={{ blockSize: 56, inlineSize: 'min(28rem, 80%)' }} />
      <div className={styles.rutenett}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={styles.kort}>
            <div className="skjelett" style={{ aspectRatio: '4 / 5' }} />
            <div className="skjelett" style={{ blockSize: 12, inlineSize: '40%' }} />
            <div className="skjelett" style={{ blockSize: 16, inlineSize: '85%' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
