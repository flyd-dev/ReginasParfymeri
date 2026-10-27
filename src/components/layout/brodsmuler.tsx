import Link from 'next/link'
import { Fragment } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export interface Smule {
  navn: string
  href?: string
}

export function Brodsmuler({ smuler }: { smuler: Smule[] }) {
  return (
    <Breadcrumb>
      <BreadcrumbList className="text-sm text-sand-ink">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Forside</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {smuler.map((s, i) => (
          <Fragment key={`${s.navn}-${i}`}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {s.href && i < smuler.length - 1 ? (
                <BreadcrumbLink asChild>
                  <Link href={s.href}>{s.navn}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="text-regina-plum">{s.navn}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
