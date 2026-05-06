import { NextRequest, NextResponse } from 'next/server'
import { detectAddressType } from '@/lib/classification/detect-type'
import { resolveAddress } from '@/lib/api/resolve-address'
import { fetchBtcPrice } from '@/lib/data/price-client'
import { checkRateLimit, rateLimitHeaders } from '@/lib/api/rate-limit'
import { getClientIp } from '@/lib/api/ip'
import { success, failure } from '@/lib/api/envelope'
import { NotFoundError, UpstreamError } from '@/lib/data/errors'
import { env } from '@/config/env'

export const runtime = 'nodejs'

/**
 * GET /api/v1/address/[address]
 *
 * Resolves a single mainnet Bitcoin address and returns its quantum exposure
 * classification, on-chain balance, transaction history metadata, and BTC/USD
 * value — all wrapped in the standard API envelope.
 *
 * @param request - The incoming Next.js request. The client IP is extracted
 *   from the `x-forwarded-for` or `x-real-ip` headers for rate-limit keying.
 * @param params.address - The Bitcoin address to scan, passed as a dynamic
 *   path segment (e.g. `1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf`).
 *
 * @returns
 *   - **200 OK** `{ ok: true, data: AddressResult }` — successful scan result
 *     containing `classification`, `balanceBtc`, `balanceUsd`, `txCount`,
 *     `pubkeyExposed`, `recommendedAction`, and optional `riskFlags`.
 *   - **400 Bad Request** `{ ok: false, code: 'INVALID_ADDRESS' }` — the
 *     address does not match any recognised mainnet Bitcoin format (P2PKH,
 *     P2SH, P2WPKH, P2WSH, P2TR).
 *   - **404 Not Found** `{ ok: false, code: 'NOT_FOUND' }` — the address is
 *     syntactically valid but was not found on the blockchain (e.g. never used).
 *   - **429 Too Many Requests** `{ ok: false, code: 'RATE_LIMITED' }` — the
 *     caller has exceeded the `single` rate-limit bucket. Rate-limit state is
 *     reflected in the `X-RateLimit-*` response headers.
 *   - **502 Bad Gateway** `{ ok: false, code: 'UPSTREAM_ERROR' }` — mempool.space
 *     and the Blockstream Esplora fallback both returned errors.
 *   - **500 Internal Server Error** `{ ok: false, code: 'INTERNAL_ERROR' }` —
 *     an unexpected error occurred server-side.
 *
 * @remarks
 * Rate limiting uses the `single` bucket (one request per address per sliding
 * window). Rate-limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`,
 * `X-RateLimit-Reset`) are included on every response, including 429s.
 *
 * The BTC/USD price is fetched from CoinGecko and memoised in-process for
 * 60 seconds, so it is shared across concurrent requests within the same
 * serverless invocation lifetime.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params
  const ip = getClientIp(request)
  const rl = await checkRateLimit(ip, 'single')
  const headers = rateLimitHeaders(rl)

  if (!rl.allowed) {
    return NextResponse.json(
      failure('RATE_LIMITED', 'Too many requests. Please slow down.'),
      { status: 429, headers }
    )
  }

  const type = detectAddressType(address)
  if (type === 'UNKNOWN') {
    return NextResponse.json(
      failure(
        'INVALID_ADDRESS',
        `"${address}" is not a valid mainnet Bitcoin address.`
      ),
      { status: 400, headers }
    )
  }

  try {
    const btcPrice = await fetchBtcPrice(env.COINGECKO_API_URL)
    const result = await resolveAddress(address, btcPrice)
    return NextResponse.json(success(result), { headers })
  } catch (err) {
    if (err instanceof NotFoundError) {
      return NextResponse.json(failure('NOT_FOUND', err.message), {
        status: 404,
        headers,
      })
    }
    if (err instanceof UpstreamError) {
      return NextResponse.json(
        failure(
          'UPSTREAM_ERROR',
          'Blockchain data temporarily unavailable. Please try again.'
        ),
        { status: 502, headers }
      )
    }
    return NextResponse.json(
      failure('INTERNAL_ERROR', 'An unexpected error occurred.'),
      { status: 500, headers }
    )
  }
}
