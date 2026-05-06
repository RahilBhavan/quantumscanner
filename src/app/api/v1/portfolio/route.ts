import { NextRequest, NextResponse } from 'next/server'
import pLimit from 'p-limit'
import { detectAddressType } from '@/lib/classification/detect-type'
import { resolveAddress } from '@/lib/api/resolve-address'
import { fetchBtcPrice } from '@/lib/data/price-client'
import { checkRateLimit, rateLimitHeaders } from '@/lib/api/rate-limit'
import { getClientIp } from '@/lib/api/ip'
import { success, failure } from '@/lib/api/envelope'
import { PortfolioBodySchema } from '@/lib/api/schemas'
import { env } from '@/config/env'

export const runtime = 'nodejs'

/**
 * POST /api/v1/portfolio
 *
 * Batch scan endpoint that resolves up to 1,000 Bitcoin addresses in a single
 * request and returns aggregate portfolio exposure metrics alongside
 * per-address results. The entire result set is returned once every address
 * has been resolved. For incremental streaming results use
 * `POST /api/v1/portfolio/stream`.
 *
 * @param request - Incoming Next.js request. Expects a JSON body conforming to
 *   `PortfolioBodySchema`: `{ addresses: string[] }` where `addresses` is a
 *   non-empty array of up to 1,000 mainnet Bitcoin address strings. The client
 *   IP is extracted from forwarding headers for rate-limit keying.
 *
 * @returns
 *   - **200 OK**
 *     ```json
 *     {
 *       "ok": true,
 *       "data": {
 *         "summary": {
 *           "totalAddresses": number,
 *           "totalBtc": number,
 *           "safeAtRestBtc": number,
 *           "exposedBtc": number
 *         },
 *         "addresses": Array<AddressResult | { address: string; error: string }>
 *       }
 *     }
 *     ```
 *     Individual address failures are represented as inline error objects
 *     rather than failing the whole request.
 *   - **400 Bad Request** `{ ok: false, code: 'INVALID_BODY' }` — request body
 *     is not valid JSON or fails schema validation.
 *   - **400 Bad Request** `{ ok: false, code: 'INVALID_ADDRESSES' }` — one or
 *     more addresses are not recognised mainnet Bitcoin addresses. The
 *     `detail.invalid` field lists the offending values.
 *   - **429 Too Many Requests** `{ ok: false, code: 'RATE_LIMITED' }` — the
 *     caller has exceeded the `batch` rate-limit bucket.
 *
 * @remarks
 * Addresses are resolved concurrently up to `BULK_CONCURRENCY` (env var,
 * default 5) using `p-limit` to avoid saturating upstream APIs. All addresses
 * are format-validated before any network I/O; a single invalid address fails
 * the request immediately without consuming upstream quota.
 *
 * Rate-limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`,
 * `X-RateLimit-Reset`) are present on every response.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = await checkRateLimit(ip, 'batch')
  const headers = rateLimitHeaders(rl)

  if (!rl.allowed) {
    return NextResponse.json(
      failure('RATE_LIMITED', 'Too many batch requests. Please slow down.'),
      { status: 429, headers }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      failure('INVALID_BODY', 'Request body must be valid JSON.'),
      { status: 400, headers }
    )
  }

  const parsed = PortfolioBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      failure('INVALID_BODY', 'Invalid request body.', parsed.error.flatten()),
      { status: 400, headers }
    )
  }

  const { addresses } = parsed.data
  const invalidAddresses = addresses.filter(
    (a) => detectAddressType(a) === 'UNKNOWN'
  )

  if (invalidAddresses.length > 0) {
    return NextResponse.json(
      failure('INVALID_ADDRESSES', 'One or more addresses are invalid.', {
        invalid: invalidAddresses,
      }),
      { status: 400, headers }
    )
  }

  const btcPrice = await fetchBtcPrice(env.COINGECKO_API_URL)
  const limit = pLimit(env.BULK_CONCURRENCY)

  const results = await Promise.all(
    addresses.map((address) =>
      limit(async () => {
        try {
          return await resolveAddress(address, btcPrice)
        } catch {
          return { address, error: 'Failed to fetch data for this address.' }
        }
      })
    )
  )

  const successful = results.filter((r) => !('error' in r))
  const totalBtc = successful.reduce(
    (sum, r) => sum + ('balanceBtc' in r ? r.balanceBtc : 0),
    0
  )
  const exposedBtc = successful.reduce(
    (sum, r) =>
      sum +
      ('pubkeyExposed' in r && r.pubkeyExposed && 'balanceBtc' in r
        ? r.balanceBtc
        : 0),
    0
  )
  const safeAtRestBtc = totalBtc - exposedBtc

  return NextResponse.json(
    success({
      summary: {
        totalAddresses: addresses.length,
        totalBtc,
        safeAtRestBtc,
        exposedBtc,
      },
      addresses: results,
    }),
    { headers }
  )
}
