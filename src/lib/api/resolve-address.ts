import { detectAddressType } from '@/lib/classification/detect-type'
import { classifyAddress } from '@/lib/classification/classify'
import { getRecommendedAction } from '@/lib/classification/recommended-action'
import { fetchAddressWithFallback } from '@/lib/data/address-source'
import { computeRiskScore } from '@/lib/risk/score'
import { env } from '@/config/env'

export interface AddressResult {
  address: string
  type: string
  classification: string
  pubkeyExposed: boolean
  firstSeen: string | null
  lastSpend: string | null
  balanceBtc: number
  balanceUsd: number | null
  riskScore: {
    conservative: number
    base: number
    aggressive: number
  }
  recommendedAction: string
  dataSource: string
  flags: string[]
  notes: string[]
  methodologyUrl: string
}

const SATS_PER_BTC = 100_000_000

export async function resolveAddress(
  address: string,
  btcPriceUsd: number | null
): Promise<AddressResult> {
  const type = detectAddressType(address)

  const facts = await fetchAddressWithFallback(address, {
    mempoolBase: env.MEMPOOL_API_URL,
    esploraBase: env.ESPLORA_API_URL,
  })

  const factsWithType = { ...facts, type }
  const classification = classifyAddress(factsWithType)
  const balanceBtc = facts.balanceSat / SATS_PER_BTC
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
    methodologyUrl: `${env.NEXT_PUBLIC_CANONICAL_URL}/methodology`,
  }
}
