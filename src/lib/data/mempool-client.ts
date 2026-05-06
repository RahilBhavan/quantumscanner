import { z } from 'zod'
import { fetchWithTimeout } from './http'
import { RateLimitError, UpstreamError, NotFoundError } from './errors'
import type { AddressFacts } from '@/lib/classification/types'

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

export interface FetchedAddressFacts extends AddressFacts {
  source: string
}

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

  const parsed = MempoolAddressSchema.safeParse(raw)
  if (!parsed.success) {
    throw new UpstreamError(`Invalid response shape for ${address}`)
  }

  const { chain_stats } = parsed.data
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
