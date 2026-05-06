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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params
  const ip = getClientIp(request)
  const rl = checkRateLimit(ip, 'single')
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
      failure('INVALID_ADDRESS', `"${address}" is not a valid mainnet Bitcoin address.`),
      { status: 400, headers }
    )
  }

  try {
    const btcPrice = await fetchBtcPrice(env.COINGECKO_API_URL)
    const result = await resolveAddress(address, btcPrice)
    return NextResponse.json(success(result), { headers })
  } catch (err) {
    if (err instanceof NotFoundError) {
      return NextResponse.json(
        failure('NOT_FOUND', err.message),
        { status: 404, headers }
      )
    }
    if (err instanceof UpstreamError) {
      return NextResponse.json(
        failure('UPSTREAM_ERROR', 'Blockchain data temporarily unavailable. Please try again.'),
        { status: 502, headers }
      )
    }
    return NextResponse.json(
      failure('INTERNAL_ERROR', 'An unexpected error occurred.'),
      { status: 500, headers }
    )
  }
}
