import { detectAddressType } from '@/lib/classification/detect-type'
import { classifyAddress } from '@/lib/classification/classify'
import { getRecommendedAction } from '@/lib/classification/recommended-action'
import { fetchAddressWithFallback } from '@/lib/data/address-source'
import { computeRiskScore } from '@/lib/risk/score'
import { env } from '@/config/env'
import type {
  AddressType,
  Classification,
  RecommendedAction,
  ClassificationFlag,
  ClassificationNote,
} from '@/lib/classification/types'

/**
 * Fully resolved analysis result for a single Bitcoin address, combining
 * on-chain data, quantum-exposure classification, and risk scoring into
 * one flat structure suitable for serialisation to API consumers and the UI.
 */
export interface AddressResult {
  /** The raw Bitcoin address string that was analysed. */
  address: string
  /** Detected Bitcoin script type (P2PKH, P2TR, etc.). */
  type: AddressType
  /** Quantum-exposure classification (SAFE_AT_REST, EXPOSED, EMPTY, UNRESOLVABLE). */
  classification: Classification
  /** Whether the public key for this address is observable on-chain. */
  pubkeyExposed: boolean
  /** ISO-8601 timestamp of the first transaction, or `null` if unused. */
  firstSeen: string | null
  /** ISO-8601 timestamp of the most recent spend, or `null` if never spent. */
  lastSpend: string | null
  /** Confirmed balance expressed in BTC (converted from satoshis). */
  balanceBtc: number
  /**
   * Confirmed balance in USD at the time of the request, or `null` when the
   * BTC/USD price feed was unavailable.
   */
  balanceUsd: number | null
  /**
   * Risk scores for the three CRQC timeline scenarios.
   * Each value is an integer in the range 0–100.
   */
  riskScore: {
    conservative: number
    base: number
    aggressive: number
  }
  /** Recommended user action derived from classification and balance. */
  recommendedAction: RecommendedAction
  /**
   * Identifier of the upstream API that provided the on-chain data
   * (e.g. `'mempool'` or `'esplora'`).
   */
  dataSource: string
  /** Warning flags such as HIGH_REUSE. */
  flags: ClassificationFlag[]
  /** Informational qualifiers such as P2SH_AMBIGUOUS. */
  notes: ClassificationNote[]
}

/** Satoshis per Bitcoin — used to convert the API's integer satoshi values to BTC. */
const SATS_PER_BTC = 100_000_000

/**
 * Orchestrates the full address analysis pipeline for a single Bitcoin address.
 *
 * Pipeline steps:
 * 1. Detect address script type ({@link detectAddressType}).
 * 2. Fetch on-chain facts via the configured block-explorer APIs with automatic
 *    failover ({@link fetchAddressWithFallback}).
 * 3. Classify quantum exposure ({@link classifyAddress}).
 * 4. Compute CRQC risk scores across three timeline scenarios ({@link computeRiskScore}).
 *    Only exposed balance is passed as `exposedBtc` — safe-at-rest addresses
 *    contribute zero to the risk score even when they hold funds.
 * 5. Determine the recommended user action ({@link getRecommendedAction}).
 * 6. Return a flat {@link AddressResult} with all analysis artifacts.
 *
 * @param address     - The Bitcoin address string to analyse.
 * @param btcPriceUsd - Current BTC/USD price for balance conversion; pass `null`
 *                      when the price feed is unavailable to set `balanceUsd` to `null`.
 * @returns A fully populated {@link AddressResult}.
 * @throws {Error} If the block-explorer fetch fails for both primary and fallback APIs.
 */
export async function resolveAddress(
  address: string,
  btcPriceUsd: number | null
): Promise<AddressResult> {
  const type = detectAddressType(address)

  const facts = await fetchAddressWithFallback(address, {
    mempoolBase: env.MEMPOOL_API_URL,
    esploraBase: env.ESPLORA_API_URL,
  })

  // Merge the detected type into the facts object; address-source APIs return
  // raw on-chain data without script-type awareness.
  const factsWithType = { ...facts, type }
  const classification = classifyAddress(factsWithType)
  const balanceBtc = facts.balanceSat / SATS_PER_BTC

  // Only count the balance as `exposedBtc` when the public key is actually
  // visible on-chain. A safe-at-rest address with a large balance contributes
  // zero to the risk score because no quantum attack vector currently exists.
  const riskScore = computeRiskScore({
    exposedBtc: classification.pubkeyExposed ? balanceBtc : 0,
    totalBtc: balanceBtc,
    currentYear: new Date().getFullYear(),
  })

  const recommendedAction = getRecommendedAction(
    classification.classification,
    type,
    facts.balanceSat
  )

  return {
    address,
    type,
    classification: classification.classification,
    pubkeyExposed: classification.pubkeyExposed,
    firstSeen: facts.firstSeen,
    lastSpend: facts.lastSpend,
    balanceBtc,
    balanceUsd:
      btcPriceUsd !== null ? Math.round(balanceBtc * btcPriceUsd) : null,
    riskScore,
    recommendedAction,
    dataSource: facts.source,
    flags: classification.flags,
    notes: classification.notes,
  }
}
