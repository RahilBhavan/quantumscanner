import { z } from 'zod'
import { fetchWithTimeout } from './http'

/**
 * Zod schema for the CoinGecko `/simple/price` response subset.
 * Only the `bitcoin.usd` field is extracted; all other coins/currencies are
 * stripped automatically by Zod's default strip mode.
 *
 * @internal
 */
const PriceSchema = z.object({
  bitcoin: z.object({ usd: z.number() }),
})

/**
 * Fetches the current BTC/USD spot price from a CoinGecko-compatible price API.
 *
 * This function is intentionally failure-tolerant: any network error, non-2xx
 * response, or schema mismatch returns `null` rather than throwing.  Callers
 * treat a `null` result as "price unavailable" and fall back to displaying
 * BTC-denominated values only.  This prevents a price API outage from
 * cascading into a full scan failure.
 *
 * @param baseUrl - Base URL of the CoinGecko-compatible API
 *                  (e.g. `'https://api.coingecko.com/api/v3'`).  No trailing
 *                  slash.  Injected so tests can point to a local mock server.
 * @returns The BTC price in USD as a plain number, or `null` when the price
 *          cannot be determined.
 */
export async function fetchBtcPrice(baseUrl: string): Promise<number | null> {
  try {
    const response = await fetchWithTimeout(
      `${baseUrl}/simple/price?ids=bitcoin&vs_currencies=usd`
    )
    if (!response.ok) return null

    const raw = await response.json()
    const parsed = PriceSchema.safeParse(raw)
    if (!parsed.success) return null

    return parsed.data.bitcoin.usd
  } catch {
    // Swallow all errors — price is best-effort and must never block a scan.
    return null
  }
}
