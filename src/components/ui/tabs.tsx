// Streken under fanene i line-varianten er bygget etter «Vercel Tabs» (Yadwinder Singh, MIT) på 21st.dev – https://21st.dev/@yadwinder/components/vercel-tabs. Egen kode; ingen kode er kopiert.
//
// Fra forbildet: én strek som glir fra fanen man forlater til fanen man velger, og tilpasser bredden underveis.
// Her er streken ett element som flyttes og skaleres med transform (ingen left/width). Uten JavaScript, før den
// er målt, og i loddrett retning står den gamle streken (::after) under den valgte fanen. Innholdet tones svakt
// inn når kunden bytter fane (ikke ved første visning).
'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'cn'
import { Tabs as TabsPrimitive } from 'radix-ui'

function Tabs({
  className,
  orientation = 'horizontal',
  onValueChange,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  // Satt etter første bytte: da glir innholdet inn, men ikke når siden lastes.
  const [byttet, setByttet] = React.useState(false)
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      data-byttet={byttet || undefined}
      orientation={orientation}
      onValueChange={(verdi) => {
        setByttet(true)
        onValueChange?.(verdi)
      }}
      className={cn('group/tabs flex gap-2 data-horizontal:flex-col', className)}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  'group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none',
  {
    variants: {
      variant: {
        default: 'bg-muted',
        line: 'relative gap-1 bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

/**
 * Plasserer streken under den aktive fanen. Måler med offsetLeft/offsetWidth når fanen byttes og når listen
 * endrer størrelse (skrift lastet, bredere vindu), og skriver bare transform – ingen React-tilstand, ingen
 * omtegning av fanene.
 */
function useGlidestrek(pa: boolean) {
  const liste = React.useRef<HTMLDivElement>(null)
  const strek = React.useRef<HTMLSpanElement>(null)
  React.useEffect(() => {
    const l = liste.current
    const s = strek.current
    if (!pa || !l || !s) return
    let ramme = 0
    const plasser = () => {
      ramme = 0
      const aktiv = l.querySelector<HTMLElement>('[role="tab"][data-state="active"]')
      if (!aktiv || l.closest('[data-orientation="vertical"]')) {
        l.removeAttribute('data-glidestrek')
        return
      }
      // Samme sted som ::after-streken: 5px under fanen, 2px høy.
      const y = aktiv.offsetTop + aktiv.offsetHeight + 3
      s.style.transform = `translate3d(${aktiv.offsetLeft}px, ${y}px, 0) scaleX(${aktiv.offsetWidth})`
      if (!l.hasAttribute('data-glidestrek')) {
        l.setAttribute('data-glidestrek', '')
        // Første plassering skal ikke gli inn fra venstre kant; overgangen slås på i neste bilde.
        requestAnimationFrame(() => s.setAttribute('data-klar', ''))
      }
    }
    const be = () => {
      if (!ramme) ramme = requestAnimationFrame(plasser)
    }
    plasser()
    const storrelse = new ResizeObserver(be)
    storrelse.observe(l)
    const tilstand = new MutationObserver(be)
    tilstand.observe(l, { attributes: true, subtree: true, attributeFilter: ['data-state'] })
    return () => {
      cancelAnimationFrame(ramme)
      storrelse.disconnect()
      tilstand.disconnect()
    }
  }, [pa])
  return { liste, strek }
}

function TabsList({
  className,
  variant = 'default',
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  const { liste, strek } = useGlidestrek(variant === 'line')
  return (
    <TabsPrimitive.List
      ref={liste}
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    >
      {children}
      {variant === 'line' && (
        <span
          ref={strek}
          aria-hidden
          data-slot="tabs-glidestrek"
          className="pointer-events-none absolute top-0 left-0 hidden h-0.5 w-px origin-left bg-regina-pink group-data-glidestrek/tabs-list:block data-klar:transition-transform data-klar:duration-(--dur-slow) data-klar:ease-ut"
        />
      )}
    </TabsPrimitive.List>
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-sand-ink-deep transition-[color,background-color,scale] duration-(--dur-fast) group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        'group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent',
        'data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground',
        // Streken under fanen: står her uten JavaScript og før glidestreken er målt (se TabsList).
        'after:absolute after:bg-regina-pink after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100 group-data-glidestrek/tabs-list:after:hidden',
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        'flex-1 text-sm outline-none',
        'group-data-byttet/tabs:data-active:animate-in group-data-byttet/tabs:data-active:fade-in-0 group-data-byttet/tabs:data-active:slide-in-from-bottom-2 group-data-byttet/tabs:data-active:[--tw-animation-duration:var(--dur-slow)] group-data-byttet/tabs:data-active:ease-ut',
        className,
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
