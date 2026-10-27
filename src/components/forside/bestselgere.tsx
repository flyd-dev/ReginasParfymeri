'use client'

import type { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

/** Bestselgere per kategori i faner. Rekkefølgen er WooCommerces popularitet (total_sales). */
export function Bestselgerfaner({ faner }: { faner: { id: string; navn: string; innhold: ReactNode }[] }) {
  const forste = faner[0]?.id
  if (!forste) return null
  return (
    <Tabs defaultValue={forste}>
      <TabsList variant="line" className="mb-8 h-auto gap-6 bg-transparent p-0">
        {faner.map((f) => (
          <TabsTrigger key={f.id} value={f.id} className="h-11 flex-none px-0 text-base">
            {f.navn}
          </TabsTrigger>
        ))}
      </TabsList>
      {faner.map((f) => (
        <TabsContent key={f.id} value={f.id}>
          {f.innhold}
        </TabsContent>
      ))}
    </Tabs>
  )
}
