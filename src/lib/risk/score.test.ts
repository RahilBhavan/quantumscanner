import { describe, it, expect } from 'vitest'
import { computeRiskScore } from './score'
import { toBand } from './band'

describe('computeRiskScore', () => {
  it('returns all zeros when totalBtc is zero', () => {
    const result = computeRiskScore({
      exposedBtc: 0,
      totalBtc: 0,
      currentYear: 2026,
    })
    expect(result.conservative).toBe(0)
    expect(result.base).toBe(0)
    expect(result.aggressive).toBe(0)
  })

  it('returns all zeros when exposedBtc is zero', () => {
    const result = computeRiskScore({
      exposedBtc: 0,
      totalBtc: 10,
      currentYear: 2026,
    })
    expect(result.conservative).toBe(0)
    expect(result.base).toBe(0)
    expect(result.aggressive).toBe(0)
  })

  it('aggressive > base > conservative when exposure > 0', () => {
    const result = computeRiskScore({
      exposedBtc: 5,
      totalBtc: 10,
      currentYear: 2026,
    })
    expect(result.aggressive).toBeGreaterThan(result.base)
    expect(result.base).toBeGreaterThan(result.conservative)
  })

  it('clamps score to 100 maximum', () => {
    // 100% exposure in a close year could exceed 100 without clamping
    const result = computeRiskScore({
      exposedBtc: 10,
      totalBtc: 10,
      currentYear: 2029,
    })
    expect(result.aggressive).toBeLessThanOrEqual(100)
    expect(result.base).toBeLessThanOrEqual(100)
    expect(result.conservative).toBeLessThanOrEqual(100)
  })

  it('scores are integers (rounded)', () => {
    const result = computeRiskScore({
      exposedBtc: 3,
      totalBtc: 7,
      currentYear: 2026,
    })
    expect(Number.isInteger(result.conservative)).toBe(true)
    expect(Number.isInteger(result.base)).toBe(true)
    expect(Number.isInteger(result.aggressive)).toBe(true)
  })

  it('scores are non-negative', () => {
    const result = computeRiskScore({
      exposedBtc: 1,
      totalBtc: 10,
      currentYear: 2026,
    })
    expect(result.conservative).toBeGreaterThanOrEqual(0)
    expect(result.base).toBeGreaterThanOrEqual(0)
    expect(result.aggressive).toBeGreaterThanOrEqual(0)
  })
})

describe('toBand', () => {
  it('0–24 → LOW', () => {
    expect(toBand(0)).toBe('LOW')
    expect(toBand(24)).toBe('LOW')
  })

  it('25–49 → MODERATE', () => {
    expect(toBand(25)).toBe('MODERATE')
    expect(toBand(49)).toBe('MODERATE')
  })

  it('50–74 → HIGH', () => {
    expect(toBand(50)).toBe('HIGH')
    expect(toBand(74)).toBe('HIGH')
  })

  it('75–100 → CRITICAL', () => {
    expect(toBand(75)).toBe('CRITICAL')
    expect(toBand(100)).toBe('CRITICAL')
  })
})
