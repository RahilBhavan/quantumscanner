export interface MempoolAddress {
  address: string
  chain_stats: {
    tx_count: number
    funded_txo_sum: number
    spent_txo_sum: number
  }
  mempool_stats: {
    tx_count: number
    funded_txo_sum: number
    spent_txo_sum: number
  }
}

export interface PriceQuote {
  usd: number
  fetchedAt: number
}

export type FetchResult<T> =
  | { ok: true; data: T; source: string }
  | { ok: false; error: string; status?: number }
