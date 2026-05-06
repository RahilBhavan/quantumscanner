import type { Classification, AddressType, RecommendedAction } from './types'

/**
 * Maps a classification result to the most appropriate user-facing action.
 *
 * The `EXPOSED` case is split on balance: an exposed address with funds still
 * present is an active risk requiring immediate migration, whereas an exposed
 * address that is already drained carries no residual financial risk.
 *
 * The `_type` parameter is reserved for future differentiation (e.g. treating
 * P2SH differently once redeem-script analysis is available) and is currently
 * unused.
 *
 * @param classification - The quantum-exposure classification of the address.
 * @param _type - The Bitcoin script type (reserved for future use).
 * @param balanceSat - Current confirmed balance in satoshis; determines urgency
 *   for exposed addresses.
 * @returns The {@link RecommendedAction} the user should take.
 */
export function getRecommendedAction(
  classification: Classification,
  _type: AddressType,
  balanceSat: number
): RecommendedAction {
  switch (classification) {
    case 'SAFE_AT_REST':
      // Key is not yet on-chain; watch for CRQC developments but no action now.
      return 'MONITOR'
    case 'EXPOSED':
      // If funds remain in an exposed address, a CRQC could steal them — act now.
      // If the address is already empty, the exposure is historical and harmless.
      return balanceSat > 0 ? 'MIGRATE_IMMEDIATELY' : 'NO_ACTION_NEEDED'
    case 'EMPTY':
      return 'NO_ACTION_NEEDED'
    case 'UNRESOLVABLE':
      return 'MANUAL_REVIEW'
  }
}
