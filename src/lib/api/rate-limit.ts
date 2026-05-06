import { LRUCache } from 'lru-cache'

interface TokenBucket {
  count: number
  resetAt: number
}

const WINDOW_MS = 60_000

function makeCache() {
  return new LRUCache<string, TokenBucket>({ max: 10_000 })
}

const singleCache = makeCache()
const batchCache = makeCache()
const streamCache = makeCache()

const LIMITS = {
  single: 60,
  batch: 10,
  stream: 5,
} as const

type LimitType = keyof typeof LIMITS

function check(
  cache: LRUCache<string, TokenBucket>,
  ip: string,
  limit: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const existing = cache.get(ip)

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + WINDOW_MS
    cache.set(ip, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  cache.set(ip, existing)
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  }
}

export function checkRateLimit(
  ip: string,
  type: LimitType
): { allowed: boolean; remaining: number; resetAt: number; limit: number } {
  const cache =
    type === 'single'
      ? singleCache
      : type === 'batch'
        ? batchCache
        : streamCache
  const limit = LIMITS[type]
  const result = check(cache, ip, limit)
  return { ...result, limit }
}

export function rateLimitHeaders(result: ReturnType<typeof checkRateLimit>) {
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
