import { validate, getAddressInfo } from 'bitcoin-address-validation'
import type { AddressType } from './types'

export function detectAddressType(address: string): AddressType {
  if (!address) return 'UNKNOWN'

  try {
    if (!validate(address)) return 'UNKNOWN'

    const info = getAddressInfo(address)

    // Reject testnet addresses
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
        return 'UNKNOWN'
    }
  } catch {
    return 'UNKNOWN'
  }
}
