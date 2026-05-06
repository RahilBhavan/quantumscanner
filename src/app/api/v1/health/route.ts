import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/v1/health
 *
 * Liveness check endpoint used by infrastructure monitors, load balancers,
 * and CI smoke tests to confirm the API is reachable and the Node.js runtime
 * is healthy.
 *
 * This endpoint performs no external I/O and always returns immediately. It
 * does **not** verify upstream connectivity (mempool.space, CoinGecko, etc.)
 * — use the address scan endpoint with a known address for a deeper readiness
 * check.
 *
 * @returns **200 OK** with the JSON body:
 * ```json
 * { "ok": true, "status": "healthy", "timestamp": "<ISO 8601 datetime>" }
 * ```
 * The `timestamp` field reflects the server-side wall-clock time at the
 * moment the request was handled, useful for detecting stale cached responses.
 *
 * @remarks No rate limiting is applied to this endpoint.
 */
export function GET() {
  return NextResponse.json({
    ok: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  })
}
