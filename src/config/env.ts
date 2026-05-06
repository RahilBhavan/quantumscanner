import { z } from 'zod'

/**
 * Zod schema for all runtime environment variables consumed by the application.
 *
 * Variables are validated and coerced at module load time so that missing or
 * malformed configuration fails loudly at startup rather than silently at
 * request time. All variables have defaults suitable for local development.
 *
 * **Server-only variables** (no `NEXT_PUBLIC_` prefix):
 * - `MEMPOOL_API_URL`    — Primary Bitcoin block explorer (mempool.space).
 * - `ESPLORA_API_URL`    — Fallback block explorer (Blockstream Esplora).
 * - `COINGECKO_API_URL`  — CoinGecko REST API for live BTC/USD price data.
 * - `BULK_CONCURRENCY`   — Max simultaneous upstream fetches during portfolio
 *                          scans. Clamped to 1–20; higher values reduce latency
 *                          but risk upstream rate limits.
 *
 * **Client-exposed variables** (`NEXT_PUBLIC_` prefix, bundled into the client):
 * - `NEXT_PUBLIC_CANONICAL_URL` — The production URL of the site, used for
 *   Open Graph tags and sitemap generation.
 */
const envSchema = z.object({
  MEMPOOL_API_URL: z.string().url().default('https://mempool.space/api'),
  ESPLORA_API_URL: z.string().url().default('https://blockstream.info/api'),
  COINGECKO_API_URL: z
    .string()
    .url()
    .default('https://api.coingecko.com/api/v3'),
  BULK_CONCURRENCY: z.coerce.number().int().min(1).max(20).default(6),
  NEXT_PUBLIC_CANONICAL_URL: z.string().url().default('http://localhost:3000'),
})

// Parse eagerly at module load — throws a ZodError with a descriptive message
// listing every invalid variable if validation fails.
const _env = envSchema.parse(process.env)

// Warn in production when the canonical URL was not explicitly configured.
// A localhost URL in production breaks Open Graph previews and sitemap indexing.
if (
  process.env.NODE_ENV === 'production' &&
  _env.NEXT_PUBLIC_CANONICAL_URL === 'http://localhost:3000'
) {
  console.warn(
    '[config] NEXT_PUBLIC_CANONICAL_URL is not set — sitemap and OG metadata will point to localhost.'
  )
}

/**
 * Validated, frozen environment configuration object.
 *
 * Import this instead of reading `process.env` directly to benefit from type
 * safety, runtime validation, and coercion (e.g. `BULK_CONCURRENCY` is a
 * `number`, not a `string`).
 *
 * @example
 * ```ts
 * import { env } from '@/config/env'
 * const response = await fetch(env.MEMPOOL_API_URL + '/address/' + address)
 * ```
 */
export const env = Object.freeze(_env)
