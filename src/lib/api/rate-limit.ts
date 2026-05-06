import { LRUCache } from 'lru-cache'

/**
 * In-process token bucket state for one IP address within a rate-limit window.
 * Used only by the in-memory fallback path; Vercel KV stores equivalent state
 * in Redis for cross-instance consistency.
 */
interface TokenBucket {
  /** Number of requests consumed in the current window. */
  count: number
  /** Unix epoch millisecond at which the window resets and count returns to zero. */
  resetAt: number
}

/** Rate-limit window duration in milliseconds (60 seconds). */
const WINDOW_MS = 60_000
/** Rate-limit window duration in seconds, used for Redis TTL commands. */
const WINDOW_S = 60

/**
 * Per-IP request limits within a 60-second sliding window, by endpoint type.
 *
 * - `single` — individual address scan endpoint; higher limit for interactive use.
 * - `batch`  — portfolio batch endpoint; lower limit due to bulk data cost.
 * - `stream` — streaming portfolio endpoint; lowest limit; each request fans out
 *              to many upstream API calls.
 */
export const LIMITS = {
  single: 60,
  batch: 10,
  stream: 5,
} as const

/** Union of the keys in {@link LIMITS}; used to select the correct cache/limit. */
type LimitType = keyof typeof LIMITS

/**
 * Result of a rate-limit check, used to populate response headers and decide
 * whether to proceed with or reject the request.
 */
type RateLimitResult = {
  /** Whether the request is within the limit and should be processed. */
  allowed: boolean
  /** Number of requests remaining in the current window. */
  remaining: number
  /** Unix epoch millisecond at which the window resets. */
  resetAt: number
  /** The total limit for this endpoint type (echoed for header convenience). */
  limit: number
}

/**
 * Creates a new LRU cache for token bucket state, capped at 10,000 IP entries
 * to bound memory usage on high-traffic instances. Least-recently-used entries
 * are evicted automatically when the cap is reached.
 */
function makeCache() {
  return new LRUCache<string, TokenBucket>({ max: 10_000 })
}

// Separate LRU caches per endpoint type so limits are tracked independently.
const singleCache = makeCache()
const batchCache = makeCache()
const streamCache = makeCache()

/**
 * Performs an in-process token-bucket rate-limit check for one IP address.
 *
 * On first request (or after window expiry) a new bucket is created.
 * Subsequent requests within the window increment the counter until the limit
 * is reached, at which point `allowed` becomes `false`.
 *
 * Note: this implementation is not atomic — concurrent requests in the same
 * process could race around the increment. In practice the impact is negligible
 * (at most one extra allowed request per race), and the KV path is preferred in
 * production where it matters.
 *
 * @param cache - The LRU cache instance for the relevant endpoint type.
 * @param ip    - The client IP address string used as the cache key.
 * @param limit - Maximum requests allowed per window for this endpoint type.
 * @returns Allowed status, remaining count, and window reset timestamp.
 */
function memoryCheck(
  cache: LRUCache<string, TokenBucket>,
  ip: string,
  limit: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const existing = cache.get(ip)

  // No existing bucket, or the window has expired — start a fresh window.
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + WINDOW_MS
    cache.set(ip, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  // Immutable update — store a new object rather than mutating `existing`.
  const updated = { count: existing.count + 1, resetAt: existing.resetAt }
  cache.set(ip, updated)
  return {
    allowed: true,
    remaining: limit - updated.count,
    resetAt: updated.resetAt,
  }
}

// Module-level singleton to avoid re-importing `@vercel/kv` on every request.
let kvModule: typeof import('@vercel/kv') | null = null
let kvAttempted = false

/**
 * Lazily imports the `@vercel/kv` module on the first call and caches the
 * result. Returns `null` in environments where the package is not installed
 * (e.g. local development without Vercel KV configured), triggering a fallback
 * to in-memory rate limiting.
 *
 * @returns The `@vercel/kv` module, or `null` if unavailable.
 */
async function getKv() {
  if (kvAttempted) return kvModule
  kvAttempted = true
  try {
    kvModule = await import('@vercel/kv')
    return kvModule
  } catch {
    return null
  }
}

/**
 * Checks and records a rate-limit hit for the given IP and endpoint type.
 *
 * **Storage strategy (KV-first with in-memory fallback):**
 * 1. Attempts to use Vercel KV (Redis) for atomic `INCR` + `EXPIRE` semantics.
 *    KV is strongly preferred in production because serverless functions run in
 *    multiple isolated instances — in-memory state does not persist across them.
 * 2. If KV is unavailable (local dev, import failure, or transient error),
 *    falls back to a per-process LRU cache. The fallback is intentionally
 *    lenient — it may allow slightly more requests than the configured limit
 *    during cold starts or across instances.
 *
 * @param ip   - Client IP address string (see {@link getClientIp}).
 * @param type - Endpoint category that determines which limit applies.
 * @returns A {@link RateLimitResult} with `allowed`, `remaining`, `resetAt`, and `limit`.
 */
export async function checkRateLimit(
  ip: string,
  type: LimitType
): Promise<RateLimitResult> {
  const limit = LIMITS[type]
  const client = await getKv()

  if (client) {
    try {
      const key = `rl:${type}:${ip}`
      // INCR is atomic in Redis — safe for concurrent serverless invocations.
      const count = await client.kv.incr(key)
      // Set TTL only on the first increment; subsequent increments must not
      // reset the expiry or the window would extend on every request.
      if (count === 1) {
        await client.kv.expire(key, WINDOW_S)
      }
      const ttlMs = await client.kv.pttl(key)
      const resetAt = Date.now() + Math.max(0, ttlMs)
      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetAt,
        limit,
      }
    } catch {
      // KV unavailable (network error, cold start, misconfiguration) —
      // fall through to in-memory so the request is not incorrectly blocked.
    }
  }

  const cache =
    type === 'single'
      ? singleCache
      : type === 'batch'
        ? batchCache
        : streamCache
  const result = memoryCheck(cache, ip, limit)
  return { ...result, limit }
}

/**
 * Builds the standard rate-limit response headers from a {@link RateLimitResult}.
 *
 * Follows the IETF draft for `RateLimit` headers:
 * - `X-RateLimit-Limit`     — total requests allowed per window
 * - `X-RateLimit-Remaining` — requests left in the current window
 * - `X-RateLimit-Reset`     — Unix timestamp (seconds) when the window resets
 * - `Retry-After`           — seconds until the window resets (only on rejection)
 *
 * @param result - The result from {@link checkRateLimit}.
 * @returns A plain object of header name → string value pairs.
 */
export function rateLimitHeaders(result: RateLimitResult) {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    ...(result.allowed
      ? {}
      : {
          'Retry-After': String(
            Math.ceil((result.resetAt - Date.now()) / 1000)
          ),
        }),
  }
}
