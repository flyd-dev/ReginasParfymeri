'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Feil({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center md:py-32">
      <h1 className="text-4xl md:text-5xl">Noe gikk galt</h1>
      <p className="mt-5 text-lg text-sand-ink">
        Vi fikk ikke hentet siden akkurat nå. Prøv igjen om litt – eller ring oss på 948 97 061.
      </p>
      <Button size="lg" className="mt-10" onClick={reset}>
        Prøv igjen
      </Button>
    </div>
  )
}
