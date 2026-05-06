import { test, expect } from '@playwright/test'

const GENESIS = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
const GARBAGE = 'notavalidaddress'

test.describe('Public API', () => {
  test('GET /api/v1/health returns ok', async ({ request }) => {
    const res = await request.get('/api/v1/health')
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  test('GET /api/v1/address/:address returns valid schema for P2PKH', async ({ request }) => {
    const res = await request.get(`/api/v1/address/${GENESIS}`, { timeout: 15_000 })
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(body).toMatchObject({
      address: GENESIS,
      type: 'P2PKH',
      classification: expect.stringMatching(/SAFE_AT_REST|EXPOSED|EMPTY/),
      pubkeyExposed: expect.any(Boolean),
      riskScore: {
        conservative: expect.any(Number),
        base: expect.any(Number),
        aggressive: expect.any(Number),
      },
      recommendedAction: expect.any(String),
    })
  })

  test('GET /api/v1/address/:address returns 400 for invalid address', async ({ request }) => {
    const res = await request.get(`/api/v1/address/${GARBAGE}`)
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.error).toBeDefined()
  })

  test('X-RateLimit-* headers present on single address response', async ({ request }) => {
    const res = await request.get(`/api/v1/address/${GENESIS}`, { timeout: 15_000 })
    expect(res.headers()['x-ratelimit-limit']).toBeDefined()
    expect(res.headers()['x-ratelimit-remaining']).toBeDefined()
  })

  test('POST /api/v1/portfolio returns 400 for more than 100 addresses', async ({ request }) => {
    const addresses = Array.from({ length: 101 }, () => GENESIS)
    const res = await request.post('/api/v1/portfolio', {
      data: { addresses },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.ok).toBe(false)
  })

  test('POST /api/v1/portfolio returns 400 for empty body', async ({ request }) => {
    const res = await request.post('/api/v1/portfolio', {
      data: {},
    })
    expect(res.status()).toBe(400)
  })
})
