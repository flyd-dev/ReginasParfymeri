import type { MetadataRoute } from 'next'
import { nettstedUrl, skalIndekseres } from '@/lib/seo/nettsted'

/** Stengt for søkemotorer til lansering (INDEKSERING=pa), så staging ikke konkurrerer med dagens butikk. */
export default function robots(): MetadataRoute.Robots {
  if (!skalIndekseres()) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/handlekurv/', '/kasse/', '/sok/'] },
    sitemap: `${nettstedUrl()}/sitemap.xml`,
  }
}
