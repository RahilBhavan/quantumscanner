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

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = checkRateLimit(ip, 'batch')
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
