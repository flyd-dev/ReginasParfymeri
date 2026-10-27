import type { MetadataRoute } from 'next'
import { KUN_I_BUTIKKEN } from '@/content/butikk'
import { alleKategorier } from '@/lib/katalog/sporring'
import { kategoriUrl, merkeUrl, produktUrl } from '@/lib/lenker'
import { nettstedUrl } from '@/lib/seo/nettsted'
import { hentKatalog } from '@/lib/woocommerce'

export const revalidate = 3600

const FASTE = [
  '/',
  '/merker/',
  '/butikk/',
  '/nyheter/',
  '/tilbud/',
  '/om-oss/',
  '/behandlinger/',
  '/kundeklubb/',
  '/kontakt/',
  '/frakt-levering/',
  '/angrerett-og-retur/',
  '/betingelser/',
  '/personvern/',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const k = await hentKatalog()
  const base = nettstedUrl()
  return [
    ...FASTE.map((sti) => ({ url: `${base}${sti}` })),
    ...alleKategorier(k).map((c) => ({ url: `${base}${kategoriUrl(c.sti)}` })),
    ...k.merker.map((m) => ({ url: `${base}${merkeUrl(m.slug)}` })),
    ...KUN_I_BUTIKKEN.filter((m) => !k.merker.some((x) => x.slug === m.slug)).map((m) => ({
      url: `${base}${merkeUrl(m.slug)}`,
    })),
    ...k.produkter.map((p) => ({
      url: `${base}${produktUrl(p.slug)}`,
      lastModified: p.opprettet ?? undefined,
      images: p.bilder.slice(0, 1).map((b) => b.src),
    })),
  ]
}
