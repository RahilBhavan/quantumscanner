import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('readCounters — KV unavailable', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('@vercel/kv', () => { throw new Error('not installed') })
  })

  it('returns zeros when KV module cannot be imported', async () => {
    const { readCounters } = await import('./counters')
    const result = await readCounters()
    expect(result).toEqual({ totalScanned: 0, exposedCount: 0 })
  })
})

describe('readCounters — KV available', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('@vercel/kv', () => ({
      kv: {
        get: vi.fn()
          .mockResolvedValueOnce(500)   // total_btc_scanned
          .mockResolvedValueOnce(120),  // exposed_btc_scanned
        incrby: vi.fn().mockResolvedValue(1),
      },
    }))
  })

  it('returns counter values from KV', async () => {
    const { readCounters } = await import('./counters')
    const result = await readCounters()
    expect(result).toEqual({ totalScanned: 500, exposedCount: 120 })
  })
})

describe('incrementCounters — KV available', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('@vercel/kv', () => ({
      kv: {
        get: vi.fn(),
        incrby: vi.fn().mockResolvedValue(1),
      },
    }))
  })

  it('calls incrby for both counters', async () => {
    const kvMod = await import('@vercel/kv')
    const { incrementCounters } = await import('./counters')
    await incrementCounters({ scannedCount: 5, newExposed: 2 })
    expect(vi.mocked(kvMod.kv.incrby)).toHaveBeenCalledWith('total_btc_scanned', 5)
    expect(vi.mocked(kvMod.kv.incrby)).toHaveBeenCalledWith('exposed_btc_scanned', 2)
  })

  it('does not throw when KV is unavailable', async () => {
    vi.resetModules()
    vi.doMock('@vercel/kv', () => { throw new Error('not installed') })
    const { incrementCounters } = await import('./counters')
    await expect(incrementCounters({ scannedCount: 1, newExposed: 0 })).resolves.toBeUndefined()
  })
})
