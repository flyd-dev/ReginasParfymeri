// Linjeikoner tegnet for Regina: 24-rutenett, 1,5 px strek, runde ender. Alltid dekorative
// (aria-hidden) – knappen eller lenken rundt har den tilgjengelige teksten.

import type { SVGProps } from 'react'

const STIER = {
  sok: (
    <>
      <circle cx="10.5" cy="10.5" r="6.25" />
      <path d="m15.25 15.25 4.5 4.5" />
    </>
  ),
  kurv: (
    <>
      <path d="M5.2 8.25h13.6l-1 11.2a1.4 1.4 0 0 1-1.4 1.3H7.6a1.4 1.4 0 0 1-1.4-1.3z" />
      <path d="M8.75 10.5V7a3.25 3.25 0 0 1 6.5 0v3.5" />
    </>
  ),
  meny: <path d="M4 7.5h16M4 12h16M4 16.5h10" />,
  lukk: <path d="m6 6 12 12M18 6 6 18" />,
  pil: <path d="M4.5 12h14.5M13.5 6.5 19 12l-5.5 5.5" />,
  pilVenstre: <path d="M19.5 12H5M10.5 6.5 5 12l5.5 5.5" />,
  ned: <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />,
  hoyre: <path d="m9.5 6.5 5.5 5.5-5.5 5.5" />,
  venstre: <path d="m14.5 6.5-5.5 5.5 5.5 5.5" />,
  pluss: <path d="M12 5.5v13M5.5 12h13" />,
  minus: <path d="M5.5 12h13" />,
  sjekk: <path d="m5.5 12.5 4.25 4.25L18.5 7.5" />,
  sted: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.25" />
    </>
  ),
  telefon: (
    <path d="M8.2 4.5 6 4.6a1.6 1.6 0 0 0-1.5 1.8c.8 7 6.1 12.3 13.1 13.1a1.6 1.6 0 0 0 1.8-1.5l.1-2.2a1 1 0 0 0-.7-1l-3-1a1 1 0 0 0-1.1.3l-1.2 1.4a11 11 0 0 1-4.8-4.8L10.1 9.4a1 1 0 0 0 .3-1.1l-1-3a1 1 0 0 0-1.2-.8z" />
  ),
  post: (
    <>
      <rect x="3.75" y="6" width="16.5" height="12" rx="1.5" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </>
  ),
  pakke: (
    <>
      <path d="M4 7.75 12 4l8 3.75v8.5L12 20l-8-3.75z" />
      <path d="m4 7.75 8 3.75 8-3.75M12 11.5V20" />
    </>
  ),
  butikk: (
    <>
      <path d="M4.5 9.5V20h15V9.5" />
      <path d="M3.5 9.5 5.5 4h13l2 5.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5c0 1.4-1.1 2.5-2.5 2.5h-2c-1.4 0-2.5-1.1-2.5-2.5 0 1.4-1.1 2.5-2.5 2.5S3.5 10.9 3.5 9.5z" />
      <path d="M10 20v-4.5h4V20" />
    </>
  ),
  retur: (
    <>
      <path d="M8.5 7.5 5 11l3.5 3.5" />
      <path d="M5.5 11H15a4 4 0 0 1 0 8h-3" />
    </>
  ),
  filter: <path d="M4.5 7h9M17.5 7h2M4.5 12h3M11.5 12h8M4.5 17h11M19.5 17h0" />,
  kalender: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="1.5" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </>
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.75" />
      <circle cx="16.9" cy="7.1" r=".6" fill="currentColor" />
    </>
  ),
  facebook: (
    <path d="M14.5 8.5h2V5h-2.6C11.6 5 10.5 6.5 10.5 8.7V11H8v3.3h2.5V20h3.3v-5.7h2.5l.5-3.3h-3V9.2c0-.5.3-.7.7-.7z" />
  ),
  bilde: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="1.5" />
      <path d="m4.5 16 4.5-4.5 3.5 3.5 2.5-2.5 4.5 4.5" />
      <circle cx="15.5" cy="9" r="1.25" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 11v5.5M12 7.75v.5" />
    </>
  ),
  utenfor: (
    <path d="M13.5 5.5H18.5V10.5M18.5 5.5 11 13M10 6.5H6.5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V14" />
  ),
} as const

export type Ikonnavn = keyof typeof STIER

export function Ikon({
  navn,
  storrelse = 20,
  ...rest
}: { navn: Ikonnavn; storrelse?: number } & Omit<SVGProps<SVGSVGElement>, 'children'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={storrelse}
      height={storrelse}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {STIER[navn]}
    </svg>
  )
}
