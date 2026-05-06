import { NextRequest } from 'next/server'
import pLimit from 'p-limit'
import { detectAddressType } from '@/lib/classification/detect-type'
import { resolveAddress } from '@/lib/api/resolve-address'
import type { AddressResult } from '@/lib/api/resolve-address'
import { fetchBtcPrice } from '@/lib/data/price-client'
import { checkRateLimit, rateLimitHeaders } from '@/lib/api/rate-limit'
import { getClientIp } from '@/lib/api/ip'
import { failure } from '@/lib/api/envelope'
import { PortfolioStreamBodySchema } from '@/lib/api/schemas'
import { env } from '@/config/env'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/** Union of a successful address resolution and a per-address error record. */
type StreamResult = AddressResult | { address: string; error: string }

/**
 * Serialises a named SSE event and its JSON-encoded payload into the
 * `text/event-stream` wire format.
 *
 * @param event - The SSE event name (e.g. `"result"`, `"progress"`, `"summary"`).
 * @param data - Any JSON-serialisable value to send as the event data.
 * @returns A string in the format `event: <name>\ndata: <json>\n\n`.
 */
function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

/**
 * POST /api/v1/portfolio/stream
 *
 * Server-Sent Events (SSE) endpoint for incremental portfolio scanning. As
 * each Bitcoin address is resolved it is pushed to the client in real time,
 * enabling a live progress bar and streaming results dashboard without waiting
 * for the entire batch to complete.
 *
 * @param request - Incoming Next.js request. Expects a JSON body conforming to
 *   `PortfolioStreamBodySchema`: `{ addresses: string[] }` where `addresses`
 *   is a non-empty array of up to 1,000 mainnet Bitcoin address strings. The
 *   client IP is extracted from forwarding headers for rate-limit keying.
 *
 * ### Pre-stream error responses (JSON)
 *   - **400 Bad Request** `{ ok: false, code: 'INVALID_BODY' }` — body is not
 *     valid JSON or fails schema validation.
 *   - **429 Too Many Requests** `{ ok: false, code: 'RATE_LIMITED' }` — the
 *     caller has exceeded the `stream` rate-limit bucket.
 *
 * ### SSE event stream (`Content-Type: text/event-stream`)
 * Once the stream opens the following named events are emitted:
 *
 * | Event | Payload | When |
 * |-------|---------|------|
 * | `result` | `AddressResult \| { address, error }` | After each address resolves |
 * | `progress` | `{ completed: number, total: number }` | Every 10 results and on completion |
 * | `summary` | `{ totalAddresses, completedAddresses, totalBtc, exposedBtc, safeAtRestBtc }` | Once, after all results |
 *
 * Addresses that fail validation or upstream resolution are emitted as
 * `result` events with an `error` string field rather than crashing the stream.
 *
 * @remarks
 * Addresses are resolved concurrently up to `BULK_CONCURRENCY` (env var,
 * default 5). Invalid addresses are detected before any upstream I/O and
 * emitted as inline errors rather than killing the stream.
 *
 * Rate-limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`,
 * `X-RateLimit-Reset`) are present on all responses, including the streaming
 * `200` that opens the SSE connection.
 *
 * The response uses `Cache-Control: no-cache` and `Connection: keep-alive` so
 * that proxies and CDNs do not buffer the event stream.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = await checkRateLimit(ip, 'stream')
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
      const results: StreamResult[] = []

      await Promise.all(
        addresses.map((address) =>
          limit(async () => {
            const type = detectAddressType(address)
            let result: StreamResult

            if (type === 'UNKNOWN') {
              result = { address, error: 'Invalid address format.' }
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
        (r): r is AddressResult => 'balanceBtc' in r
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
