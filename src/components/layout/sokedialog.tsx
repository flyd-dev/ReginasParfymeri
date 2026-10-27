'use client'

import { ArrowRight, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Hurtigsvar } from '@/app/api/sok/route'
import { Produktbilde } from '@/components/produkt/produktbilde'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { kategoriUrl, merkeUrl, produktUrl, sokUrl } from '@/lib/lenker'

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
  const svar = q.trim().length >= 2 ? sisteSvar : null
  const harTreff = svar && (svar.produkter.length || svar.merker.length || svar.kategorier.length)

  return (
    <CommandDialog
      open={apen}
      onOpenChange={setApen}
      title="Søk i nettbutikken"
      description="Søk etter produkter, merker og kategorier"
      className="top-[12vh] translate-y-0 sm:max-w-xl"
    >
      <Command shouldFilter={false} loop>
        <CommandInput value={q} onValueChange={setQ} placeholder="Søk etter duft, merke eller produkt" />
        <CommandList className="max-h-[60vh]">
          {q.trim().length < 2 ? (
            <p className="px-4 py-6 text-sm text-sand-ink-deep">
              Skriv minst to bokstaver, for eksempel «creed» eller «vanilje».
            </p>
          ) : (
            <CommandEmpty>{laster ? 'Søker …' : `Ingen treff på «${q.trim()}».`}</CommandEmpty>
          )}
          {svar && svar.produkter.length > 0 && (
            <CommandGroup heading="Produkter">
              {svar.produkter.map((p) => (
                <CommandItem
                  key={p.slug}
                  value={`produkt-${p.slug}`}
                  onSelect={() => ga(produktUrl(p.slug))}
                  className="gap-3"
                >
                  <Produktbilde src={p.bilde} alt="" sizes="48px" className="size-12 shrink-0" luft={false} />
                  <span className="min-w-0 flex-1">
                    {p.merke && (
                      <span className="block text-xs tracking-wide text-sand-ink-deep uppercase">
                        {p.merke}
                      </span>
                    )}
                    <span className="block truncate">{p.navn}</span>
                  </span>
                  <span className="shrink-0 text-sm">{p.utsolgt ? 'Utsolgt' : p.pris}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {svar && svar.merker.length > 0 && (
            <CommandGroup heading="Merker">
              {svar.merker.map((m) => (
                <CommandItem key={m.slug} value={`merke-${m.slug}`} onSelect={() => ga(merkeUrl(m.slug))}>
                  {m.navn}
                  <span className="ml-auto text-xs text-sand-ink-deep">{m.antall}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {svar && svar.kategorier.length > 0 && (
            <CommandGroup heading="Kategorier">
              {svar.kategorier.map((k) => (
                <CommandItem
                  key={k.sti.join('/')}
                  value={`kategori-${k.sti.join('/')}`}
                  onSelect={() => ga(kategoriUrl(k.sti))}
                >
                  {k.navn}
                  <span className="ml-auto text-xs text-sand-ink-deep">{k.antall}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {harTreff ? (
            <>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem value="alle-treff" onSelect={() => ga(sokUrl(q.trim()))}>
                  <Search aria-hidden />
                  Se alle {svar.totalt} treff for «{q.trim()}»
                  <ArrowRight className="ml-auto" aria-hidden />
                </CommandItem>
              </CommandGroup>
            </>
          ) : null}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
