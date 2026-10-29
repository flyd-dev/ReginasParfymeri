// Varslene er bygget etter «Sync Status Toast» (ShadcnSpace, MIT) på 21st.dev – https://21st.dev/@shadcnspace/components/sonner-05. Egen kode; ingen kode er kopiert.
// Handlekurvens varsler tegnes i src/components/kurv/kurvmeldinger.tsx; her er rammen og standardvarslene.

'use client'

import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon, XIcon } from 'lucide-react'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      // nb-NO: sonner sier «Notifications alt+T» og «Close toast» som standard.
      customAriaLabel="Varsler (Alt+T)"
      duration={7000}
      icons={{
        success: <CircleCheckIcon className="size-5 text-status-ok" />,
        info: <InfoIcon className="size-5" />,
        warning: <TriangleAlertIcon className="size-5 text-status-varsel" />,
        error: <OctagonXIcon className="size-5 text-status-feil" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
        close: <XIcon className="size-3.5" />,
      }}
      style={
        {
          '--normal-bg': 'var(--paper)',
          '--normal-text': 'var(--regina-plum)',
          '--normal-border': 'var(--sand-200)',
          '--border-radius': 'var(--radius)',
          '--width': '24rem',
        } as React.CSSProperties
      }
      toastOptions={{
        closeButtonAriaLabel: 'Lukk varsel',
        classNames: {
          // Sonners egen CSS ligger utenfor Tailwind-lagene, derfor «!»: ingen skygge, 16 px tekst og bare
          // transform/opacity på 250 ms (tokens), slik som resten av flaten.
          toast:
            'cn-toast font-sans rounded-2xl! shadow-none! text-base! gap-3! [transition-property:transform,opacity]! duration-(--dur-slow)! ease-out! min-[601px]:w-(--width)',
          title: 'font-medium! leading-snug!',
          description: 'text-sand-ink! leading-snug!',
          actionButton: 'h-9! rounded-full! px-3! text-base! font-medium! bg-regina-plum! text-white!',
          cancelButton: 'h-9! rounded-full! px-3! text-base! bg-sand-100! text-regina-plum!',
          closeButton: 'border-sand-200! bg-paper! text-regina-plum!',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
