/**
 * Raw address payload returned by the mempool.space REST API.
 * Only the fields consumed by this application are included; the full
 * upstream response contains additional metadata that is intentionally
 * ignored.
 */
export interface MempoolAddress {
  /** The Bitcoin address string (bech32, P2SH, or P2PKH). */
  address: string

  /**
   * On-chain confirmed statistics for this address.
   * Values are only updated once a transaction is mined into a block.
   */
  chain_stats: {
    /** Number of confirmed transactions involving this address. */
    tx_count: number
    /** Total satoshis received in confirmed outputs (all time). */
    funded_txo_sum: number
    /** Total satoshis spent from confirmed outputs (all time). */
    spent_txo_sum: number
  }

  /**
   * Unconfirmed mempool statistics for this address.
   * Values reflect transactions that have been broadcast but not yet mined.
   */
  mempool_stats: {
    /** Number of unconfirmed transactions involving this address. */
    tx_count: number
    /** Total satoshis received in unconfirmed outputs. */
    funded_txo_sum: number
    /** Total satoshis spent from unconfirmed outputs. */
    spent_txo_sum: number
  }
}

/**
 * A BTC/USD price snapshot fetched from an upstream price API.
 */
export interface PriceQuote {
  /** Current BTC price in US dollars. */
  usd: number
  /** Unix timestamp (ms) when this quote was fetched — used for cache TTL decisions. */
  fetchedAt: number
}

/**
 * Discriminated union wrapping the outcome of any data-fetch operation.
 *
 * On success the caller receives the typed payload plus the provider name that
 * served the data (useful for observability/logging).
 * On failure the caller receives a human-readable error string and, where
 * available, the upstream HTTP status code.
 *
 * @typeParam T - The shape of the successful data payload.
 *
 * @example
 * ```ts
 * const result: FetchResult<MempoolAddress> = await safeFetch(url)
 * if (!result.ok) {
 *   console.error(result.error, result.status)
 *   return
 * }
 * use(result.data) // narrowed to T
 * ```
 */
export type FetchResult<T> =
  | { ok: true; data: T; source: string }
  | { ok: false; error: string; status?: number }
