import { validate, getAddressInfo } from 'bitcoin-address-validation'
import type { AddressType } from './types'

/**
 * Detects the Bitcoin script type of a mainnet address string.
 *
 * Uses the `bitcoin-address-validation` library for checksum and format
 * validation before inspecting the address metadata. Testnet addresses are
 * intentionally rejected — this tool is mainnet-only.
 *
 * @param address - The raw Bitcoin address string to inspect.
 * @returns The detected {@link AddressType}, or `'UNKNOWN'` when the address
 *   is empty, invalid, a testnet address, or an unrecognised script type.
 */
export function detectAddressType(address: string): AddressType {
  if (!address) return 'UNKNOWN'

  try {
    if (!validate(address)) return 'UNKNOWN'

    const info = getAddressInfo(address)

    // Reject testnet addresses — rate-limiting and risk models are mainnet-only.
    if (info.network !== 'mainnet') return 'UNKNOWN'

    switch (info.type) {
      case 'p2pkh':
        return 'P2PKH'
      case 'p2sh':
        return 'P2SH'
      case 'p2wpkh':
        return 'P2WPKH'
      case 'p2wsh':
        return 'P2WSH'
      case 'p2tr':
        return 'P2TR'
      default:
        // Future script types (e.g. P2PK from raw scriptPubKey) are not
        // addressable via standard encoding and fall through as UNKNOWN.
        return 'UNKNOWN'
    }
  } catch {
    // Any exception from the library (malformed input, encoding errors, etc.)
    // is treated as an unresolvable address rather than propagated to callers.
    return 'UNKNOWN'
  }
}
