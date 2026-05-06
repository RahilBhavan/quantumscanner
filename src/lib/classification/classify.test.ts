import { describe, it, expect } from 'vitest'
import { classifyAddress } from './classify'
import type { AddressFacts } from './types'

const base: AddressFacts = {
  address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  type: 'P2PKH',
  txCount: 0,
  hasOutgoingTx: false,
  balanceSat: 5000000000,
  firstSeen: '2009-01-03',
  lastSpend: null,
}

describe('classifyAddress', () => {
  it('P2PKH never-spent with balance → SAFE_AT_REST', () => {
    const result = classifyAddress({ ...base, txCount: 1, hasOutgoingTx: false })
    expect(result.classification).toBe('SAFE_AT_REST')
    expect(result.pubkeyExposed).toBe(false)
  })

  it('P2PKH never-spent zero balance → EMPTY', () => {
    const result = classifyAddress({
      ...base,
      txCount: 0,
      hasOutgoingTx: false,
      balanceSat: 0,
    })
    expect(result.classification).toBe('EMPTY')
    expect(result.pubkeyExposed).toBe(false)
  })

  it('P2PKH spent → EXPOSED', () => {
    const result = classifyAddress({ ...base, txCount: 5, hasOutgoingTx: true })
    expect(result.classification).toBe('EXPOSED')
    expect(result.pubkeyExposed).toBe(true)
  })

  it('P2WPKH spent → EXPOSED', () => {
    const result = classifyAddress({
      ...base,
      type: 'P2WPKH',
      txCount: 3,
      hasOutgoingTx: true,
    })
    expect(result.classification).toBe('EXPOSED')
    expect(result.pubkeyExposed).toBe(true)
  })

  it('P2WPKH never-spent with balance → SAFE_AT_REST', () => {
    const result = classifyAddress({
      ...base,
      type: 'P2WPKH',
      txCount: 1,
      hasOutgoingTx: false,
    })
    expect(result.classification).toBe('SAFE_AT_REST')
    expect(result.pubkeyExposed).toBe(false)
  })

  it('P2TR with balance → EXPOSED (x-only pubkey always exposed)', () => {
    const result = classifyAddress({
      ...base,
      type: 'P2TR',
      txCount: 0,
      hasOutgoingTx: false,
    })
    expect(result.classification).toBe('EXPOSED')
    expect(result.pubkeyExposed).toBe(true)
  })

  it('P2TR zero balance → EMPTY but still exposed', () => {
    const result = classifyAddress({
      ...base,
      type: 'P2TR',
      txCount: 0,
      hasOutgoingTx: false,
      balanceSat: 0,
    })
    expect(result.classification).toBe('EMPTY')
    expect(result.pubkeyExposed).toBe(true)
  })

  it('P2PK → EXPOSED (full pubkey in scriptPubKey)', () => {
    const result = classifyAddress({ ...base, type: 'P2PK' })
    expect(result.classification).toBe('EXPOSED')
    expect(result.pubkeyExposed).toBe(true)
  })

  it('UNKNOWN type → UNRESOLVABLE', () => {
    const result = classifyAddress({ ...base, type: 'UNKNOWN' })
    expect(result.classification).toBe('UNRESOLVABLE')
  })

  it('P2SH non-spent → SAFE_AT_REST with P2SH_AMBIGUOUS note', () => {
    const result = classifyAddress({
      ...base,
      type: 'P2SH',
      txCount: 1,
      hasOutgoingTx: false,
    })
    expect(result.classification).toBe('SAFE_AT_REST')
    expect(result.notes).toContain('P2SH_AMBIGUOUS')
  })

  it('P2SH spent → EXPOSED with P2SH_AMBIGUOUS note', () => {
    const result = classifyAddress({
      ...base,
      type: 'P2SH',
      txCount: 3,
      hasOutgoingTx: true,
    })
    expect(result.classification).toBe('EXPOSED')
    expect(result.notes).toContain('P2SH_AMBIGUOUS')
  })

  it('100+ transactions → HIGH_REUSE flag', () => {
    const result = classifyAddress({
      ...base,
      txCount: 101,
      hasOutgoingTx: false,
    })
    expect(result.flags).toContain('HIGH_REUSE')
  })

  it('99 transactions → no HIGH_REUSE flag', () => {
    const result = classifyAddress({
      ...base,
      txCount: 99,
      hasOutgoingTx: false,
    })
    expect(result.flags).not.toContain('HIGH_REUSE')
  })

  it('WSH spent → EXPOSED', () => {
    const result = classifyAddress({
      ...base,
      type: 'P2WSH',
      txCount: 2,
      hasOutgoingTx: true,
    })
    expect(result.classification).toBe('EXPOSED')
    expect(result.pubkeyExposed).toBe(true)
  })
})
