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
}) {
  return (
    <div className={cn('relative isolate aspect-square overflow-hidden bg-paper', className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={prioritet}
          className={cn(
            'object-contain mix-blend-multiply',
            luft && 'p-[7%]',
            zoom && 'transition-transform duration-(--dur-slow) ease-out group-hover:scale-[1.04]',
          )}
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-sand-ink">
          Bilde mangler
        </span>
      )}
    </div>
  )
}
