'use client'

import { Bell } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** «Gi meg beskjed når den er tilbake» for utsolgte varer. Sendes til WooCommerce via /api/varsle. */
export function VarsleSkjema({ produktId, variantId }: { produktId: number; variantId: number | null }) {
  const [status, setStatus] = useState<{ ok: boolean; tekst: string } | null>(null)
  const [sender, setSender] = useState(false)
  return (
    <form
      className="mt-4 border-t border-sand-200 pt-4"
      onSubmit={async (e) => {
        e.preventDefault()
        const epost = new FormData(e.currentTarget).get('epost')
        setSender(true)
        try {
          const svar = await fetch('/api/varsle/', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ produkt: produktId, variant: variantId, epost }),
          })
          const data = (await svar.json().catch(() => ({}))) as { feil?: string }
          setStatus(
            svar.ok
              ? { ok: true, tekst: 'Takk! Vi sender deg en e-post når varen er tilbake.' }
              : { ok: false, tekst: data.feil ?? 'Noe gikk galt. Prøv igjen, eller ring oss.' },
          )
        } finally {
          setSender(false)
        }
      }}
    >
      <p className="flex items-center gap-2 font-medium">
        <Bell className="size-4" aria-hidden />
        Gi meg beskjed når den er tilbake
      </p>
      <div className="mt-3 flex gap-2">
        <Label htmlFor={`epost-${produktId}`} className="sr-only">
          E-postadresse
        </Label>
        <Input
          id={`epost-${produktId}`}
          name="epost"
          type="email"
          required
          autoComplete="email"
          placeholder="Din e-postadresse"
          className="h-11 flex-1 bg-paper text-base"
        />
        <Button type="submit" variant="outline" className="bg-paper" disabled={sender}>
          Varsle meg
        </Button>
      </div>
      <p className="mt-2 text-xs text-sand-ink">Vi bruker e-postadressen bare til dette varselet.</p>
      {status && (
        <p role="status" className={`mt-2 text-sm ${status.ok ? 'text-status-ok' : 'text-status-feil'}`}>
          {status.tekst}
        </p>
      )}
    </form>
  )
}
