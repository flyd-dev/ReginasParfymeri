import { cn } from '@/lib/utils'

/**
 * Liten rosa prikk foran overlinjer («● Sist lagt til»), som på flyd.no (R-32). Erstatter den korte streken. Ren
 * rosa er lov her: prikken er pynt, ikke tekst, og skjult for skjermlesere.
 */
export function Prikk({ className }: { className?: string }) {
  return <span className={cn('size-2 shrink-0 rounded-full bg-regina-pink', className)} aria-hidden />
}
