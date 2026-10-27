import type { CSSProperties, ElementType, ReactNode } from 'react'

type Variant = '' | 'glid' | 'skala' | 'teppe'

/**
 * Inngang når elementet kommer til syne (globals.css, «Inngang»). Server-komponent: data-synlig settes av
 * BevegelseSkript før hydrering, derfor suppressHydrationWarning. Legg ikke egne transition-klasser på samme
 * element – pakk heller innholdet inn.
 */
export function Inn({
  som: Element = 'div',
  variant = '',
  i = 0,
  y,
  className,
  style,
  children,
  ...rest
}: {
  som?: ElementType
  variant?: Variant
  /** Plass i rekken: forsinkelsen er i × --stagger. */
  i?: number
  /** Hvor langt elementet glir, f.eks. '2.5rem'. */
  y?: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
} & Partial<Record<`aria-${string}` | `data-${string}` | 'id', string>>) {
  return (
    <Element
      data-inn={variant}
      className={className}
      style={{ '--i': i, ...(y ? { '--inn-y': y } : {}), ...style } as CSSProperties}
      suppressHydrationWarning
      {...rest}
    >
      {children}
    </Element>
  )
}
