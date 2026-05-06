import { NextRequest } from 'next/server'
import pLimit from 'p-limit'
import { detectAddressType } from '@/lib/classification/detect-type'
import { resolveAddress } from '@/lib/api/resolve-address'
import { fetchBtcPrice } from '@/lib/data/price-client'
import { checkRateLimit, rateLimitHeaders } from '@/lib/api/rate-limit'
import { getClientIp } from '@/lib/api/ip'
import { failure } from '@/lib/api/envelope'
import { PortfolioStreamBodySchema } from '@/lib/api/schemas'
import { env } from '@/config/env'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = checkRateLimit(ip, 'stream')
  const rlHeaders = rateLimitHeaders(rl)

  if (!rl.allowed) {
    return NextResponse.json(
      failure('RATE_LIMITED', 'Too many stream requests. Please slow down.'),
      { status: 429, headers: rlHeaders }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      failure('INVALID_BODY', 'Request body must be valid JSON.'),
      { status: 400, headers: rlHeaders }
    )
  }

  const parsed = PortfolioStreamBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      failure('INVALID_BODY', 'Invalid request body.', parsed.error.flatten()),
      { status: 400, headers: rlHeaders }
    )
  }

  const { addresses } = parsed.data

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const send = (event: string, data: unknown) =>
        controller.enqueue(enc.encode(sseEvent(event, data)))

      const btcPrice = await fetchBtcPrice(env.COINGECKO_API_URL)
      const limit = pLimit(env.BULK_CONCURRENCY)

      let completed = 0
      const total = addresses.length
      const results: unknown[] = []

      await Promise.all(
        addresses.map((address) =>
          limit(async () => {
            const type = detectAddressType(address)
            let result: unknown

            if (type === 'UNKNOWN') {
              result = {
                address,
                error: 'Invalid address format.',
              }
            } else {
              try {
                result = await resolveAddress(address, btcPrice)
              } catch {
                result = { address, error: 'Failed to fetch data.' }
              }
            }

            results.push(result)
            completed += 1

            send('result', result)

            if (completed % 10 === 0 || completed === total) {
              send('progress', { completed, total })
            }
          })
        )
      )

      const successful = results.filter(
        (r): r is { balanceBtc: number; pubkeyExposed: boolean } =>
          typeof r === 'object' && r !== null && 'balanceBtc' in r
      )

      const totalBtc = successful.reduce((sum, r) => sum + r.balanceBtc, 0)
      const exposedBtc = successful.reduce(
        (sum, r) => sum + (r.pubkeyExposed ? r.balanceBtc : 0),
        0
      )

      send('summary', {
        totalAddresses: total,
        completedAddresses: completed,
        totalBtc,
        exposedBtc,
        safeAtRestBtc: totalBtc - exposedBtc,
      })

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      ...rlHeaders,
    },
  })
}
