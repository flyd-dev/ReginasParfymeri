// Fyllet og pilen er bygget etter «Interactive Hover Button» (Dillion Verma, Magic UI, MIT) på 21st.dev – https://21st.dev/@dillionverma/components/interactive-hover-button. Egen kode; ingen kode er kopiert.
//
// Fra forbildet: en flate i kontrastfargen vokser og dekker knappen når pekeren kommer inn, og en pil glir mot
// høyre. Her er flaten et ::before-lag som skaleres fra venstre kant (bare transform) og forlater knappen mot høyre
// når pekeren går ut. Teksten byttes ikke ut, så hver tilstand bruker et kontrastpar fra tokens.test.ts:
// hvit på plum ↔ hvit på rosa (#C2106F), og plum på sand ↔ plum på sand-200 for outline. Trykk gir en liten
// skalering og fyller raskere (telefon), tastaturfokus fyller som peker. Ved redusert bevegelse skifter flaten
// uten overgang.
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'cn'
import { Slot } from 'radix-ui'

/** Flaten som fyller knappen ved peker, fokus og trykk. Fargen settes per variant (before:bg-…). */
const fyll =
  'relative isolate overflow-hidden before:absolute before:inset-0 before:-z-10 before:origin-right before:scale-x-0 before:transition-transform before:duration-(--dur-slow) before:ease-ut hover:before:origin-left hover:before:scale-x-100 focus-visible:before:origin-left focus-visible:before:scale-x-100 active:before:origin-left active:before:scale-x-100 active:before:duration-(--dur-fast) aria-expanded:before:scale-x-100'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,scale] duration-(--dur-fast) ease-out outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:transition-[translate] [&_svg]:duration-(--dur-slow) [&_svg]:ease-ut [&_svg:not([class*='size-'])]:size-4 hover:[&_.lucide-arrow-right]:translate-x-1 focus-visible:[&_.lucide-arrow-right]:translate-x-1 hover:[&_.lucide-arrow-up-right]:translate-x-0.5 hover:[&_.lucide-arrow-up-right]:-translate-y-0.5",
  {
    variants: {
      variant: {
        // Plum med hvit tekst; rosa (#C2106F) fyller ved peker.
        default: `${fyll} bg-primary text-primary-foreground before:bg-regina-pink-strong`,
        // Rosa med hvit tekst; plum fyller, og en tynn ren rosa kant holder formen på plum bakgrunn (footeren).
        rosa: `${fyll} bg-regina-pink-strong text-white before:bg-regina-plum hover:border-regina-pink`,
        // Plum tekst på sand; sand-200 fyller og kanten mørkner.
        outline: `${fyll} border-border bg-background before:bg-sand-200 hover:border-regina-plum hover:text-foreground aria-expanded:text-foreground dark:border-input dark:bg-input/30`,
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
        ghost:
          'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default:
          'h-11 gap-2 px-5 text-[0.9375rem] tracking-wide has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4',
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-3 text-sm has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-12 gap-2 px-6 text-base tracking-wide has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5',
        icon: 'size-11',
        'icon-xs':
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg',
        'icon-lg': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
