import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('env config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('parses defaults when optional vars are missing', async () => {
    const { env } = await import('./env')
    expect(env.MEMPOOL_API_URL).toBe('https://mempool.space/api')
    expect(env.BULK_CONCURRENCY).toBe(6)
    expect(env.NEXT_PUBLIC_LIVE_COUNTER_ENABLED).toBe(false)
  })

  it('overrides defaults with environment values', async () => {
    process.env.BULK_CONCURRENCY = '8'
    process.env.NEXT_PUBLIC_LIVE_COUNTER_ENABLED = 'true'
    const { env } = await import('./env')
    expect(env.BULK_CONCURRENCY).toBe(8)
    expect(env.NEXT_PUBLIC_LIVE_COUNTER_ENABLED).toBe(true)
  })

  it('coerces BULK_CONCURRENCY to a number', async () => {
    process.env.BULK_CONCURRENCY = '3'
    const { env } = await import('./env')
    expect(typeof env.BULK_CONCURRENCY).toBe('number')
  })
})
