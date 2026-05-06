import type {
  AddressFacts,
  ClassificationResult,
  Classification,
} from './types'

const HIGH_REUSE_THRESHOLD = 100

export function classifyAddress(facts: AddressFacts): ClassificationResult {
  const { type, txCount, hasOutgoingTx, balanceSat } = facts
  const flags: ClassificationResult['flags'] = []
  const notes: ClassificationResult['notes'] = []

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

  if (type === 'P2TR' || type === 'P2PK') {
    const classification: Classification =
      balanceSat === 0 ? 'EMPTY' : 'EXPOSED'
    return { classification, pubkeyExposed: true, flags, notes }
  }

  if (type === 'P2SH') {
    notes.push('P2SH_AMBIGUOUS')
  }

  const pubkeyExposed = hasOutgoingTx

  if (balanceSat === 0 && !hasOutgoingTx) {
    return { classification: 'EMPTY', pubkeyExposed: false, flags, notes }
  }

  if (pubkeyExposed) {
    return { classification: 'EXPOSED', pubkeyExposed: true, flags, notes }
  }

  return { classification: 'SAFE_AT_REST', pubkeyExposed: false, flags, notes }
}
