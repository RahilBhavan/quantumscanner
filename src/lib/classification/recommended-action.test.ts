import { describe, it, expect } from 'vitest'
import { getRecommendedAction } from './recommended-action'

describe('getRecommendedAction', () => {
  it('SAFE_AT_REST → MONITOR', () => {
    expect(getRecommendedAction('SAFE_AT_REST', 'P2PKH', 1000)).toBe('MONITOR')
    expect(getRecommendedAction('SAFE_AT_REST', 'P2WPKH', 500)).toBe('MONITOR')
  })

  it('EXPOSED with balance → MIGRATE_IMMEDIATELY', () => {
    expect(getRecommendedAction('EXPOSED', 'P2PKH', 1000)).toBe(
      'MIGRATE_IMMEDIATELY'
    )
    expect(getRecommendedAction('EXPOSED', 'P2TR', 100)).toBe(
      'MIGRATE_IMMEDIATELY'
    )
    expect(getRecommendedAction('EXPOSED', 'P2PK', 50)).toBe(
      'MIGRATE_IMMEDIATELY'
    )
  })

  it('EMPTY → NO_ACTION_NEEDED', () => {
    expect(getRecommendedAction('EMPTY', 'P2PKH', 0)).toBe('NO_ACTION_NEEDED')
    expect(getRecommendedAction('EMPTY', 'P2TR', 0)).toBe('NO_ACTION_NEEDED')
  })

  it('UNRESOLVABLE → MANUAL_REVIEW', () => {
    expect(getRecommendedAction('UNRESOLVABLE', 'UNKNOWN', 0)).toBe(
      'MANUAL_REVIEW'
    )
  })

  it('EXPOSED with zero balance → NO_ACTION_NEEDED', () => {
    expect(getRecommendedAction('EXPOSED', 'P2PKH', 0)).toBe('NO_ACTION_NEEDED')
  })
})
