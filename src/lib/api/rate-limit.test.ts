import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkRateLimit } from './rate-limit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('allows first request', async () => {
    const { checkRateLimit: fresh } = await import('./rate-limit')
    const result = await fresh(`test-${Math.random()}`, 'single')
    expect(result.allowed).toBe(true)
  })

  it('returns correct limit for each type', async () => {
    const { checkRateLimit: fresh } = await import('./rate-limit')
    const single = await fresh(`s-${Math.random()}`, 'single')
    const batch = await fresh(`b-${Math.random()}`, 'batch')
    const stream = await fresh(`st-${Math.random()}`, 'stream')
    expect(single.limit).toBe(60)
    expect(batch.limit).toBe(10)
    expect(stream.limit).toBe(5)
  })

  it('decrements remaining after each call', async () => {
    const { checkRateLimit: fresh } = await import('./rate-limit')
    const uniqueIp = `dec-${Math.random()}`
    const first = await fresh(uniqueIp, 'batch')
    const second = await fresh(uniqueIp, 'batch')
    expect(second.remaining).toBeLessThan(first.remaining)
  })

  it('blocks after limit is exceeded', async () => {
    const { checkRateLimit: fresh } = await import('./rate-limit')
    const uniqueIp = `block-${Math.random()}`
    for (let i = 0; i < 5; i++) await fresh(uniqueIp, 'stream')
    const blocked = await fresh(uniqueIp, 'stream')
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
  })
})
