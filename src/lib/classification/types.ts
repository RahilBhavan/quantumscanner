export type AddressType =
  | 'P2PKH'
  | 'P2SH'
  | 'P2WPKH'
  | 'P2WSH'
  | 'P2TR'
  | 'P2PK'
  | 'UNKNOWN'

export type Classification =
  | 'SAFE_AT_REST'
  | 'EXPOSED'
  | 'EMPTY'
  | 'UNRESOLVABLE'

export type RecommendedAction =
  | 'MONITOR'
  | 'MIGRATE_IMMEDIATELY'
  | 'NO_ACTION_NEEDED'
  | 'MANUAL_REVIEW'

export interface AddressFacts {
  address: string
  type: AddressType
  txCount: number
  hasOutgoingTx: boolean
  balanceSat: number
  firstSeen: string | null
  lastSpend: string | null
}

export interface ClassificationResult {
  classification: Classification
  pubkeyExposed: boolean
  flags: ClassificationFlag[]
  notes: ClassificationNote[]
}

export type ClassificationFlag = 'HIGH_REUSE'
export type ClassificationNote = 'P2SH_AMBIGUOUS'
