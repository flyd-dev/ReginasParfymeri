import Image from 'next/image'
import Link from 'next/link'
import logo from '../../../public/brand/regina-skrift.svg'

/**
 * Reginas logo – originalfilen i vektor fra reginaparfymeri.no, uendret. PNG-logoen fra nettbutikken
 * (public/brand/regina-parfymeri-logo.png) har hvit, ugjennomsiktig bakgrunn og kan ikke stå på sand.
 */
export function Logo({ className, prioritet = false }: { className?: string; prioritet?: boolean }) {
  return (
    <Link href="/" className={className} aria-label="Regina Parfymeri – til forsiden">
      <Image src={logo} alt="Regina Parfymeri" priority={prioritet} className="h-full w-auto" />
    </Link>
  )
}
