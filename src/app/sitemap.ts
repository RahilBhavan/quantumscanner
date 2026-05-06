import type { MetadataRoute } from 'next'
import { env } from '@/config/env'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.NEXT_PUBLIC_CANONICAL_URL

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/scan`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/portfolio`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/methodology`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]
}
