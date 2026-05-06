import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { fetchBtcPrice } from './price-client'

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'

const server = setupServer(
  http.get(`${COINGECKO_BASE}/simple/price`, () =>
    HttpResponse.json({ bitcoin: { usd: 68000 } })
  )
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

describe('fetchBtcPrice', () => {
  it('returns USD price on success', async () => {
    const price = await fetchBtcPrice(COINGECKO_BASE)
    expect(price).toBe(68000)
  })

  it('returns null on 500 error (graceful degradation)', async () => {
    server.use(
      http.get(`${COINGECKO_BASE}/simple/price`, () =>
        new HttpResponse(null, { status: 500 })
      )
    )
    const price = await fetchBtcPrice(COINGECKO_BASE)
    expect(price).toBeNull()
  })

  it('returns null on malformed JSON (graceful degradation)', async () => {
    server.use(
      http.get(`${COINGECKO_BASE}/simple/price`, () =>
        new HttpResponse('bad json', {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )
    const price = await fetchBtcPrice(COINGECKO_BASE)
    expect(price).toBeNull()
  })

  it('returns null on network failure (graceful degradation)', async () => {
    server.use(
      http.get(`${COINGECKO_BASE}/simple/price`, () => {
        throw new Error('network error')
      })
    )
    const price = await fetchBtcPrice(COINGECKO_BASE)
    expect(price).toBeNull()
  })
})
