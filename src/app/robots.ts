import type { MetadataRoute } from 'next'
import { env } from '@/config/env'

/**
 * Robots.txt generator — `/robots.txt`
 *
 * Returns the crawler directives for the application, generated at build time
 * by Next.js using the `MetadataRoute.Robots` convention.
 *
 * ### Rules
 * - All user agents are allowed to crawl `/` (all public pages).
 * - `/api/` is disallowed to prevent search engines from indexing or hitting
 *   the API endpoints directly.
 * - The sitemap URL (`/sitemap.xml`) is declared for search engine discovery.
 *
 * The canonical base URL for the sitemap is sourced from
 * `env.NEXT_PUBLIC_CANONICAL_URL`.
 *
 * @returns A `MetadataRoute.Robots` object consumed by Next.js to produce the
 *   `/robots.txt` response.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${env.NEXT_PUBLIC_CANONICAL_URL}/sitemap.xml`,
  }
}
