import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkRateLimit } from './rate-limit'

describe('checkRateLimit', () => {
  const ip = '1.2.3.4'

  beforeEach(() => {
    vi.resetModules()
  })

  it('allows first request', async () => {
    const { checkRateLimit: fresh } = await import('./rate-limit')
    const result = fresh(`test-${Math.random()}`, 'single')
    expect(result.allowed).toBe(true)
  })

  it('returns correct limit for each type', async () => {
    const { checkRateLimit: fresh } = await import('./rate-limit')
    const single = fresh(`s-${Math.random()}`, 'single')
    const batch = fresh(`b-${Math.random()}`, 'batch')
    const stream = fresh(`st-${Math.random()}`, 'stream')
    expect(single.limit).toBe(60)
    expect(batch.limit).toBe(10)
    expect(stream.limit).toBe(5)
  })

  it('decrements remaining after each call', async () => {
    const { checkRateLimit: fresh } = await import('./rate-limit')
    const uniqueIp = `dec-${Math.random()}`
    const first = fresh(uniqueIp, 'batch')
    const second = fresh(uniqueIp, 'batch')
    expect(second.remaining).toBeLessThan(first.remaining)
  })

  it('blocks after limit is exceeded', async () => {
    const { checkRateLimit: fresh } = await import('./rate-limit')
    const uniqueIp = `block-${Math.random()}`
    // Exhaust stream limit (5)
    for (let i = 0; i < 5; i++) fresh(uniqueIp, 'stream')
    const blocked = fresh(uniqueIp, 'stream')
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
  })
})
