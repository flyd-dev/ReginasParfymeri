// Bygget etter «Command» (Origin UI, MIT) på 21st.dev – https://21st.dev/@originui/components/command. Egen kode; ingen kode er kopiert.
// Treffene kommer inn én etter én når de vises (liste-inn.ts, etter «Animated List» – Dillion Verma, Magic UI, MIT).
// Rader som står fra forrige søk, beholder plassen og blir stående i ro; bare nye treff glir inn.
'use client'

import { Command as Cmdk } from 'cmdk'
import { ArrowRight, ArrowUpRight, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { useEffect, useState } from 'react'
import type { Hurtigsvar } from '@/app/api/sok/route'
import { Produktbilde } from '@/components/produkt/produktbilde'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command'
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog'
import { antallTekst } from '@/lib/format'
import { kategoriUrl, merkeUrl, produktUrl, sokUrl } from '@/lib/lenker'
import { listeInn, plass } from './liste-inn'

/** Snarveier før kunden har skrevet noe – sider som alltid finnes. */
const SNARVEIER = [
  { navn: 'Nisjeduft', href: kategoriUrl(['duft', 'nisjeduft']) },
  { navn: 'Nyheter', href: '/nyheter/' },
  { navn: 'Merker A–Å', href: '/merker/' },
  { navn: 'Behandlinger', href: '/behandlinger/' },
  { navn: 'Kontakt', href: '/kontakt/' },
] as const

// Gruppeoverskrifter i små versaler, som kolonneoverskriftene i megamenyen.
const gruppe =
  'p-2 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:pt-2 **:[[cmdk-group-heading]]:pb-1.5 **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:tracking-[0.16em] **:[[cmdk-group-heading]]:text-sand-ink-deep **:[[cmdk-group-heading]]:uppercase'

// Valgt rad: sandflate og en tynn rosa strek til venstre som vokser fra midten (bare transform). Ikonet glir
// litt mot høyre på valgt rad. Hver rad kommer inn etter den forrige (listeInn, plass i style).
const rad = `relative gap-3 px-3 py-2.5 text-base transition-colors duration-(--dur-fast) before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:scale-y-0 before:bg-regina-pink-strong before:transition-transform before:duration-(--dur-base) before:ease-ut data-selected:bg-sand-100 data-selected:before:scale-y-100 [&>svg:first-child]:transition-transform [&>svg:first-child]:duration-(--dur-base) [&>svg:first-child]:ease-ut data-selected:[&>svg:first-child]:translate-x-0.5 ${listeInn}`

const ikon = 'size-4 text-sand-ink-deep'

const tast =
  'inline-flex h-6 min-w-6 items-center justify-center border border-sand-200 bg-paper px-1.5 font-sans text-xs font-medium text-regina-plum'

/** Hurtigsøk (kommandopalett): produkter, merker og kategorier. Åpnes med knappen, «/» eller Ctrl/Cmd+K (header-klient.tsx). */
export function Sokedialog({ apen, setApen }: { apen: boolean; setApen: (apen: boolean) => void }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [sisteSvar, setSvar] = useState<Hurtigsvar | null>(null)
  const [laster, setLaster] = useState(false)

  useEffect(() => {
    const tekst = q.trim()
    if (tekst.length < 2) return
    const avbryt = new AbortController()
    const tid = setTimeout(() => {
      setLaster(true)
      fetch(`/api/sok/?q=${encodeURIComponent(tekst)}`, { signal: avbryt.signal })
        .then((r) => r.json() as Promise<Hurtigsvar>)
        .then(setSvar)
        .catch(() => undefined)
        .finally(() => setLaster(false))
    }, 160)
    return () => {
      clearTimeout(tid)
      avbryt.abort()
    }
  }, [q])

  const ga = (url: string) => {
    setApen(false)
    router.push(url)
  }

  // Svar på et eldre, lengre søk vises ikke når feltet er tømt.
  const sok = q.trim()
  const svar = sok.length >= 2 ? sisteSvar : null
  const harTreff = svar && (svar.produkter.length || svar.merker.length || svar.kategorier.length)

  return (
    <Dialog open={apen} onOpenChange={setApen}>
      <DialogPortal>
        <DialogOverlay className="bg-regina-plum/40 duration-(--dur-fast) supports-backdrop-filter:backdrop-blur-none" />
        <DialogPrimitive.Content className="fixed inset-x-0 top-0 z-50 mx-auto flex max-h-[85dvh] w-full flex-col border-b border-sand-200 bg-paper text-regina-plum outline-none duration-(--dur-fast) ease-out data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-top-2 data-closed:animate-out data-closed:fade-out-0 sm:top-[12vh] sm:max-h-[76vh] sm:w-[calc(100%-2rem)] sm:max-w-2xl sm:border">
          <DialogTitle className="sr-only">Søk i nettbutikken</DialogTitle>
          <DialogDescription className="sr-only">Søk etter produkter, merker og kategorier</DialogDescription>
          <Command
            shouldFilter={false}
            loop
            className="min-h-0 flex-1 rounded-none! bg-transparent p-0 text-regina-plum"
          >
            <div className="flex items-center gap-3 border-b border-sand-200 pr-2 pl-5 sm:pr-5">
              <Search className="size-5 shrink-0 text-sand-ink" aria-hidden />
              <Cmdk.Input
                value={q}
                onValueChange={setQ}
                placeholder="Søk etter duft, merke eller produkt"
                className="h-15 min-w-0 flex-1 bg-transparent text-[1.0625rem] outline-none placeholder:text-sand-ink"
              />
              {laster && (
                <span className="shrink-0 text-sm text-sand-ink" aria-hidden>
                  Søker …
                </span>
              )}
              <DialogClose className="inline-flex h-11 shrink-0 items-center px-3 text-base font-medium sm:hidden">
                Lukk
              </DialogClose>
            </div>
            <CommandList className="max-h-none min-h-0 flex-1 overscroll-contain">
              {sok.length < 2 ? (
                <>
                  <p className="px-5 pt-4 pb-1 text-[0.9375rem] text-sand-ink">
                    Skriv minst to bokstaver, for eksempel «creed» eller «vanilje».
                  </p>
                  <CommandGroup heading="Snarveier" className={gruppe}>
                    {SNARVEIER.map((s, i) => (
                      <CommandItem
                        key={s.href}
                        value={`snarvei-${s.href}`}
                        onSelect={() => ga(s.href)}
                        className={rad}
                        style={plass(i + 1)}
                      >
                        <ArrowUpRight className={ikon} aria-hidden />
                        {s.navn}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              ) : (
                <CommandEmpty className="px-5 py-8 text-left text-[0.9375rem] text-sand-ink">
                  {laster ? (
                    'Søker …'
                  ) : (
                    <>
                      <span className="block text-regina-plum">Ingen treff på «{sok}».</span>
                      <span className="mt-1 block">Prøv et merkenavn eller et kortere ord.</span>
                    </>
                  )}
                </CommandEmpty>
              )}
              {svar && svar.merker.length > 0 && (
                <CommandGroup heading="Merker" className={gruppe}>
                  {svar.merker.map((m, i) => (
                    <CommandItem
                      key={m.slug}
                      value={`merke-${m.slug}`}
                      onSelect={() => ga(merkeUrl(m.slug))}
                      className={rad}
                      style={plass(i)}
                    >
                      <ArrowUpRight className={ikon} aria-hidden />
                      {m.navn}
                      <CommandShortcut className="text-sm tracking-normal text-sand-ink-deep">
                        {antallTekst(m.antall, 'produkt', 'produkter')}
                      </CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {svar && svar.kategorier.length > 0 && (
                <CommandGroup heading="Kategorier" className={gruppe}>
                  {svar.kategorier.map((k, i) => (
                    <CommandItem
                      key={k.sti.join('/')}
                      value={`kategori-${k.sti.join('/')}`}
                      onSelect={() => ga(kategoriUrl(k.sti))}
                      className={rad}
                      style={plass(svar.merker.length + i)}
                    >
                      <ArrowUpRight className={ikon} aria-hidden />
                      {k.navn}
                      <CommandShortcut className="text-sm tracking-normal text-sand-ink-deep">
                        {antallTekst(k.antall, 'produkt', 'produkter')}
                      </CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {svar && svar.produkter.length > 0 && (
                <CommandGroup heading="Produkter" className={gruppe}>
                  {svar.produkter.map((p, i) => (
                    <CommandItem
                      key={p.slug}
                      value={`produkt-${p.slug}`}
                      onSelect={() => ga(produktUrl(p.slug))}
                      className={`${rad} py-2`}
                      style={plass(svar.merker.length + svar.kategorier.length + i)}
                    >
                      <Produktbilde
                        src={p.bilde}
                        alt=""
                        sizes="48px"
                        className="size-12 shrink-0 border border-sand-200"
                        luft={false}
                      />
                      <span className="min-w-0 flex-1">
                        {p.merke && (
                          <span className="block text-xs tracking-[0.12em] text-sand-ink-deep uppercase">
                            {p.merke}
                          </span>
                        )}
                        <span className="block truncate">{p.navn}</span>
                      </span>
                      <CommandShortcut className="text-[0.9375rem] tracking-normal text-regina-plum">
                        {p.utsolgt ? 'Utsolgt' : p.pris}
                      </CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {/* Linjen er en kant, ikke role=separator: listeboksen tillater bare grupper og valg. */}
              {harTreff ? (
                <CommandGroup className="border-t border-sand-200 p-2">
                  <CommandItem
                    value="alle-treff"
                    onSelect={() => ga(sokUrl(sok))}
                    className={rad}
                    style={plass(svar.merker.length + svar.kategorier.length + svar.produkter.length)}
                  >
                    <Search className={ikon} aria-hidden />
                    Se alle {svar.totalt} treff for «{sok}»
                    <CommandShortcut className="tracking-normal text-regina-plum">
                      <ArrowRight className="size-4" aria-hidden />
                    </CommandShortcut>
                  </CommandItem>
                </CommandGroup>
              ) : null}
            </CommandList>
            {/* Hjelp for tastatur – bare for øyet; skjermlesere har listeboksen. */}
            <div
              className="hidden items-center gap-6 border-t border-sand-200 bg-sand-50 px-5 py-3 text-sm text-sand-ink sm:flex"
              aria-hidden
            >
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex gap-1">
                  <kbd className={tast}>↑</kbd>
                  <kbd className={tast}>↓</kbd>
                </span>
                for å bla
              </span>
              <span className="inline-flex items-center gap-2">
                <kbd className={tast}>↵</kbd>
                for å åpne
              </span>
              <span className="inline-flex items-center gap-2">
                <kbd className={tast}>esc</kbd>
                for å lukke
              </span>
            </div>
          </Command>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}
