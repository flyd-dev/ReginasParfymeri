'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

/** Feilside: en innfelt lys rosa boks med runde hjørner (R-32), som 404-siden. */
export default function Feil({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <div className="px-2 pt-4 md:px-4 md:pt-6">
      <div className="mx-auto max-w-screen-2xl rounded-3xl bg-regina-pink-50 px-6 py-20 text-center md:py-28">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl md:text-5xl">Noe gikk galt</h1>
          <p className="mt-5 text-lg text-sand-ink-deep">
            Vi fikk ikke hentet siden akkurat nå. Prøv igjen om litt – eller ring oss på 948 97 061.
          </p>
          <Button size="lg" className="mt-10" onClick={reset}>
            Prøv igjen
          </Button>
        </div>
      </div>
    </div>
  )
}
