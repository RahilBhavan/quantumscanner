import { z } from 'zod'
import { fetchWithTimeout } from './http'
import { RateLimitError, UpstreamError, NotFoundError } from './errors'
import type { AddressFacts } from '@/lib/classification/types'

/**
 * Zod schema that validates the subset of the mempool.space `/address/:addr`
 * response that this application actually uses.  Additional fields returned by
 * the API are stripped by Zod's default `strip` mode so they never leak into
 * domain objects.
 *
 * @internal
 */
const MempoolAddressSchema = z.object({
  address: z.string(),
  chain_stats: z.object({
    tx_count: z.number(),
    funded_txo_sum: z.number(),
    spent_txo_sum: z.number(),
  }),
  mempool_stats: z.object({
    tx_count: z.number(),
    funded_txo_sum: z.number(),
    spent_txo_sum: z.number(),
  }),
})

/**
 * `AddressFacts` enriched with a `source` tag identifying which data provider
 * served the response.  Downstream code uses this for observability and to
 * display a provenance label in the UI.
 */
export interface FetchedAddressFacts extends AddressFacts {
  /**
   * Human-readable provider name (e.g. `'mempool.space'` or
   * `'blockstream.info'`) indicating where these facts came from.
   */
  source: string
}

/**
 * Fetches on-chain facts for a single Bitcoin address from a mempool.space
 * (or compatible Esplora) REST API instance.
 *
 * **Response mapping:**
 * - `txCount`        ← `chain_stats.tx_count`
 * - `hasOutgoingTx`  ← `chain_stats.spent_txo_sum > 0`
 * - `balanceSat`     ← `funded_txo_sum − spent_txo_sum` (confirmed only)
 * - `type`           is set to `'UNKNOWN'` here and resolved later by the
 *                    classification layer, which has access to the raw address
 *                    string format.
 * - `firstSeen` / `lastSpend` are not provided by this endpoint and remain
 *                    `null`; future data sources may populate them.
 *
 * @param address - The Bitcoin address to query (P2PKH, P2SH, or bech32).
 * @param baseUrl - Base URL of the mempool.space-compatible API
 *                  (e.g. `'https://mempool.space/api'`).  No trailing slash.
 * @param source  - Provider label to attach to the returned facts object.
 *                  Defaults to `'mempool.space'`.
 * @returns Resolved `FetchedAddressFacts` on success.
 * @throws {NotFoundError}  When the upstream returns HTTP 404, meaning the
 *                          address has no on-chain history in the index.
 * @throws {RateLimitError} When the upstream returns HTTP 429.
 * @throws {UpstreamError}  On network errors, non-2xx responses other than
 *                          404/429, malformed JSON, or Zod schema mismatches.
 */
export async function fetchAddressFacts(
  address: string,
  baseUrl: string,
  source = 'mempool.space'
): Promise<FetchedAddressFacts> {
  let response: Response
  try {
    response = await fetchWithTimeout(
      `${baseUrl}/address/${encodeURIComponent(address)}`
    )
  } catch (err) {
    throw new UpstreamError(`Network error fetching ${address}: ${err}`)
  }

  if (response.status === 404) throw new NotFoundError(address)
  if (response.status === 429) throw new RateLimitError()
  if (!response.ok) {
    throw new UpstreamError(
      `Upstream ${response.status} for ${address}`,
      response.status
    )
  }

  let raw: unknown
  try {
    raw = await response.json()
  } catch {
    throw new UpstreamError(`Malformed JSON from upstream for ${address}`)
  }

  // Validate the response shape before touching any fields; this guards against
  // API version changes and malicious/unexpected payloads.
  const parsed = MempoolAddressSchema.safeParse(raw)
  if (!parsed.success) {
    throw new UpstreamError(`Invalid response shape for ${address}`)
  }

  const { chain_stats } = parsed.data
  // Balance = total received − total spent (confirmed only).
  // Mempool (unconfirmed) outputs are intentionally excluded to avoid reporting
  // unconfirmed funds that may never settle.
  const balanceSat = chain_stats.funded_txo_sum - chain_stats.spent_txo_sum

  return {
    address,
    type: 'UNKNOWN',
    txCount: chain_stats.tx_count,
    hasOutgoingTx: chain_stats.spent_txo_sum > 0,
    balanceSat,
    firstSeen: null,
    lastSpend: null,
    source,
  }
}
