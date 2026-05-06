import type { NextRequest } from 'next/server'

/**
 * Extracts the originating client IP address from an incoming Next.js request.
 *
 * **Header priority:**
 * 1. `X-Vercel-Forwarded-For` — injected by Vercel's edge network; cannot be
 *    spoofed by clients in production Vercel deployments. Preferred when present.
 * 2. `X-Forwarded-For` — standard reverse-proxy header; the first (leftmost)
 *    entry is taken because that is the original client address in a correctly
 *    configured proxy chain. This header **can** be forged by clients in
 *    non-Vercel environments; do not rely on it for security-sensitive decisions
 *    without a trusted-proxy allowlist.
 * 3. `'127.0.0.1'` — fallback for local development and test environments
 *    where neither proxy header is present.
 *
 * @param request - The incoming Next.js server request.
 * @returns The best-effort client IP string. Never `null` or `undefined`.
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-vercel-forwarded-for') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1'
  )
}
