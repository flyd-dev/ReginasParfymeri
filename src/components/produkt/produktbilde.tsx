import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * Produktbilde på papirflate. De fleste pakkebildene har hvit bakgrunn; med multiply smelter det hvite inn i
 * --paper i stedet for å stå som en hvit boks på sand (oppdraget §4). Kvadratisk flate, bildet uten beskjæring.
 */
export function Produktbilde({
  src,
  alt,
  sizes,
  prioritet = false,
  className,
  luft = true,
  zoom = false,
  bytte = null,
  morf,
}: {
  src: string | null
  alt: string
  sizes: string
  prioritet?: boolean
  className?: string
  /** Luft rundt pakken. Av for miniatyrer. */
  luft?: boolean
  /** Svak zoom når en forelder med `group` får peker (produktkort). */
  zoom?: boolean
  /**
   * Bilde nummer to, som toner fram når en forelder med `group` får peker (produktkort). Bare på skjermer med
   * mus: på berøringsskjermer er det skjult (display: none), og da laster nettleseren det heller ikke ned.
   */
  bytte?: string | null
  /** Navnet til den delte overgangen til produktsiden (morf.tsx). */
  morf?: string
}) {
  const bilde = cn(
    'object-contain mix-blend-multiply',
    luft && 'p-[7%]',
    zoom && 'transition-transform duration-(--dur-slow) ease-out group-hover:scale-[1.04]',
  )
  const medBytte = Boolean(src && bytte)
  return (
    <div
      className={cn('relative isolate aspect-square overflow-hidden bg-paper', className)}
      data-morf={morf}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={prioritet}
          className={cn(
            bilde,
            // Med bilde nummer to: det første toner ut samtidig, ellers skinner det gjennom det hvite (multiply).
            medBytte && 'transition-[opacity,transform] pointer-fine:group-hover:opacity-0',
          )}
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-sand-ink">
          Bilde mangler
        </span>
      )}
      {medBytte && bytte && (
        // Spennet styrer bare om bildet finnes (display); opasiteten står på selve bildet. Et omslag med opasitet
        // ville blitt en egen gruppe, og da blander multiply mot ingenting – det hvite ville lyst opp mens det toner.
        <span className="absolute inset-0 hidden pointer-fine:block" aria-hidden>
          <Image
            src={bytte}
            alt=""
            fill
            sizes={sizes}
            className={cn(bilde, 'opacity-0 transition-[opacity,transform] group-hover:opacity-100')}
          />
        </span>
      )}
    </div>
  )
}
