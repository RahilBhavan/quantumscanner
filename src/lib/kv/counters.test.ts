import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @vercel/kv to simulate it being unavailable
vi.mock('@vercel/kv', () => { throw new Error('not installed') })

describe('readCounters', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns zeros when KV is unavailable', async () => {
    const { readCounters } = await import('./counters')
    const result = await readCounters()
    expect(result).toEqual({ totalScanned: 0, exposedCount: 0 })
  })
})

describe('incrementCounters', () => {
  it('does not throw when KV is unavailable', async () => {
    const { incrementCounters } = await import('./counters')
    await expect(incrementCounters({ scannedCount: 1, newExposed: 0 })).resolves.toBeUndefined()
  })
})
