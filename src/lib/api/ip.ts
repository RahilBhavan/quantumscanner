import type { NextRequest } from 'next/server'

// Rate limiting relies on X-Vercel-Forwarded-For, which is injected by Vercel's
// edge network and cannot be forged by clients in production deployments.
// In non-Vercel environments this header is client-controllable — do not deploy
// outside Vercel without adding a trusted-proxy allowlist.
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-vercel-forwarded-for') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1'
  )
}
