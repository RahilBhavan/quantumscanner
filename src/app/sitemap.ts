import type { MetadataRoute } from 'next'
import { env } from '@/config/env'

/**
 * Sitemap generator — `/sitemap.xml`
 *
 * Returns the XML sitemap for the application, generated at build time by
 * Next.js using the `MetadataRoute.Sitemap` convention. The canonical base URL
 * is sourced from `env.NEXT_PUBLIC_CANONICAL_URL`.
 *
 * ### Included URLs
 * | Path | Change frequency | Priority |
 * |------|-----------------|----------|
 * | `/` | daily | 1.0 |
 * | `/scan` | weekly | 0.9 |
 * | `/portfolio` | weekly | 0.8 |
 * | `/methodology` | monthly | 0.7 |
 * | `/about` | monthly | 0.5 |
 *
 * API routes (`/api/*`) are excluded from the sitemap; they are disallowed for
 * crawlers via `robots.ts` as well.
 *
 * @returns A `MetadataRoute.Sitemap` array consumed by Next.js to produce the
 *   `/sitemap.xml` response.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.NEXT_PUBLIC_CANONICAL_URL

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${base}/scan`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${base}/portfolio`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${base}/methodology`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${base}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}
