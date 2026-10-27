'use client'

import './overganger.css'
import type { MouseEvent, ReactNode } from 'react'
import { MORFKLASSE } from './morfnavn'

/**
 * Delt element mellom produktkortet og produktsiden (View Transitions, se
 * node_modules/next/dist/docs/01-app/02-guides/view-transitions.md): bildet i kortet glir over i det store bildet i
 * galleriet, mens resten av siden toner over. Uten støtte for View Transitions navigerer siden som vanlig.
 *
 * Navnet må være unikt på siden, men samme vare kan stå i flere rader (forsiden). Derfor får bare bildet i kortet
 * kunden nettopp trykket på navnet – ett om gangen for hele siden – og det settes rett på elementet i stedet for med
 * en <ViewTransition> rundt hvert kort. Da starter ikke vanlige navigasjoner (filtre, sortering) en overgang som
 * venter på bilder. Galleriet har en <ViewTransition> med samme navn (galleri.tsx). CSS-en står i overganger.css.
 */
let navngitt: HTMLElement | null = null

function navngi(el: HTMLElement, navn: string) {
  if (navngitt && navngitt !== el) {
    navngitt.style.removeProperty('view-transition-name')
    navngitt.style.removeProperty('view-transition-class')
  }
  el.style.setProperty('view-transition-name', navn)
  el.style.setProperty('view-transition-class', MORFKLASSE)
  navngitt = el
}

/**
 * Rammen rundt et produktkort. Et vanlig venstreklikk på lenken i kortet gir bildet ([data-morf]) navnet sitt før
 * Next.js starter navigasjonen, så nettleseren finner det når den tar bildet av den gamle siden.
 */
export function Morfkort({ className, children }: { className?: string; children: ReactNode }) {
  const velg = (e: MouseEvent<HTMLElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if (!(e.target instanceof Element) || !e.target.closest('a[href]')) return
    const bilde = e.currentTarget.querySelector<HTMLElement>('[data-morf]')
    const navn = bilde?.dataset.morf
    if (bilde && navn) navngi(bilde, navn)
  }
  return (
    <article className={className} onClickCapture={velg}>
      {children}
    </article>
  )
}
