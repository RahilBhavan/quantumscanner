import type {
  AddressFacts,
  ClassificationResult,
  Classification,
} from './types'

/**
 * Number of confirmed transactions above which an address is flagged as
 * HIGH_REUSE. Repeated address use increases the statistical surface area
 * for key-exposure attacks and signals poor wallet hygiene.
 */
const HIGH_REUSE_THRESHOLD = 100

/**
 * Classifies a Bitcoin address's quantum-exposure status from its on-chain facts.
 *
 * Classification logic by address type:
 *
 * - **UNKNOWN** → `UNRESOLVABLE` immediately; no further analysis is possible.
 * - **P2TR / P2PK** → always `pubkeyExposed = true` because the x-only public
 *   key (Taproot) or raw public key (P2PK) is embedded in the scriptPubKey and
 *   visible to anyone reading the blockchain, regardless of spend history.
 * - **P2SH** → key exposure cannot be determined without the redeem script, so
 *   a `P2SH_AMBIGUOUS` note is added and spend-based heuristics are applied.
 * - **P2PKH / P2WPKH / P2WSH** → public key is revealed only when the address
 *   spends (scriptSig or witness), so `hasOutgoingTx` drives exposure.
 *
 * The `EMPTY` classification takes precedence over `SAFE_AT_REST` when there is
 * no balance and no spend history — there is nothing at risk in that state.
 *
 * @param facts - Enriched on-chain data for the address being evaluated.
 * @returns A {@link ClassificationResult} with classification, exposure flag,
 *   warning flags, and informational notes.
 */
export function classifyAddress(facts: AddressFacts): ClassificationResult {
  const { type, txCount, hasOutgoingTx, balanceSat } = facts
  const flags: ClassificationResult['flags'] = []
  const notes: ClassificationResult['notes'] = []

  // Flag high-reuse addresses before any early-return so the flag is always
  // present in the result regardless of the classification branch taken.
  if (txCount > HIGH_REUSE_THRESHOLD) {
    flags.push('HIGH_REUSE')
  }

  if (type === 'UNKNOWN') {
    return {
      classification: 'UNRESOLVABLE',
      pubkeyExposed: false,
      flags,
      notes,
    }
  }

  // P2TR and P2PK encode the public key directly in the output script —
  // the key is always on-chain from the moment the address first receives funds.
  if (type === 'P2TR' || type === 'P2PK') {
    const classification: Classification =
      balanceSat === 0 ? 'EMPTY' : 'EXPOSED'
    return { classification, pubkeyExposed: true, flags, notes }
  }

  // P2SH wraps an opaque redeem script; without inspecting spent inputs we
  // cannot know the script type (could be multisig, wrapped SegWit, etc.).
  if (type === 'P2SH') {
    notes.push('P2SH_AMBIGUOUS')
  }

  // For hash-based types (P2PKH, P2WPKH, P2WSH, P2SH), key exposure happens
  // only when the address signs and broadcasts a spending transaction.
  const pubkeyExposed = hasOutgoingTx

  // An address that has never sent and holds no balance is genuinely empty —
  // it may have only received dust or be a freshly derived unused address.
  if (balanceSat === 0 && !hasOutgoingTx) {
    return { classification: 'EMPTY', pubkeyExposed: false, flags, notes }
  }

  if (pubkeyExposed) {
    return { classification: 'EXPOSED', pubkeyExposed: true, flags, notes }
  }

  return { classification: 'SAFE_AT_REST', pubkeyExposed: false, flags, notes }
}
