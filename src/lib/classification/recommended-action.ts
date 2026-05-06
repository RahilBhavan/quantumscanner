import type {
  Classification,
  AddressType,
  RecommendedAction,
} from './types'

export function getRecommendedAction(
  classification: Classification,
  _type: AddressType,
  balanceSat: number
): RecommendedAction {
  switch (classification) {
    case 'SAFE_AT_REST':
      return 'MONITOR'
    case 'EXPOSED':
      return balanceSat > 0 ? 'MIGRATE_IMMEDIATELY' : 'NO_ACTION_NEEDED'
    case 'EMPTY':
      return 'NO_ACTION_NEEDED'
    case 'UNRESOLVABLE':
      return 'MANUAL_REVIEW'
  }
}
