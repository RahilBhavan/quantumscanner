import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { fetchAddressFacts } from './mempool-client'
import { RateLimitError, UpstreamError, NotFoundError } from './errors'

const TEST_ADDRESS = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
const API_BASE = 'https://mempool.space/api'

const mockAddress = {
  address: TEST_ADDRESS,
  chain_stats: {
    tx_count: 3,
    funded_txo_sum: 5000000000,
    spent_txo_sum: 0,
  },
  mempool_stats: {
    tx_count: 0,
    funded_txo_sum: 0,
    spent_txo_sum: 0,
  },
}

const server = setupServer(
  http.get(`${API_BASE}/address/:address`, () => HttpResponse.json(mockAddress))
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('fetchAddressFacts', () => {
  it('returns address facts on success', async () => {
    const result = await fetchAddressFacts(TEST_ADDRESS, API_BASE)
    expect(result.address).toBe(TEST_ADDRESS)
    expect(result.txCount).toBe(3)
    expect(result.hasOutgoingTx).toBe(false)
    expect(result.balanceSat).toBe(5000000000)
  })

  it('detects outgoing tx when spent_txo_sum > 0', async () => {
    server.use(
      http.get(`${API_BASE}/address/:address`, () =>
        HttpResponse.json({
          ...mockAddress,
          chain_stats: {
            ...mockAddress.chain_stats,
            spent_txo_sum: 1000000,
          },
        })
      )
    )
    const result = await fetchAddressFacts(TEST_ADDRESS, API_BASE)
    expect(result.hasOutgoingTx).toBe(true)
  })

  it('throws NotFoundError on 404', async () => {
    server.use(
      http.get(
        `${API_BASE}/address/:address`,
        () => new HttpResponse(null, { status: 404 })
      )
    )
    await expect(fetchAddressFacts(TEST_ADDRESS, API_BASE)).rejects.toThrow(
      NotFoundError
    )
  })

  it('throws RateLimitError on 429', async () => {
    server.use(
      http.get(
        `${API_BASE}/address/:address`,
        () => new HttpResponse(null, { status: 429 })
      )
    )
    await expect(fetchAddressFacts(TEST_ADDRESS, API_BASE)).rejects.toThrow(
      RateLimitError
    )
  })

  it('throws UpstreamError on 500', async () => {
    server.use(
      http.get(
        `${API_BASE}/address/:address`,
        () => new HttpResponse(null, { status: 500 })
      )
    )
    await expect(fetchAddressFacts(TEST_ADDRESS, API_BASE)).rejects.toThrow(
      UpstreamError
    )
  })

  it('throws UpstreamError on malformed JSON', async () => {
    server.use(
      http.get(
        `${API_BASE}/address/:address`,
        () =>
          new HttpResponse('not json', {
            headers: { 'Content-Type': 'application/json' },
          })
      )
    )
    await expect(fetchAddressFacts(TEST_ADDRESS, API_BASE)).rejects.toThrow(
      UpstreamError
    )
  })
})
