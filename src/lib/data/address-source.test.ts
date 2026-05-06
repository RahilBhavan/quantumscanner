import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { fetchAddressWithFallback } from './address-source'
import { UpstreamError } from './errors'

const TEST_ADDRESS = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
const MEMPOOL_BASE = 'https://mempool.space/api'
const ESPLORA_BASE = 'https://blockstream.info/api'

const mockAddress = {
  address: TEST_ADDRESS,
  chain_stats: {
    tx_count: 1,
    funded_txo_sum: 5000000000,
    spent_txo_sum: 0,
  },
  mempool_stats: { tx_count: 0, funded_txo_sum: 0, spent_txo_sum: 0 },
}

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('fetchAddressWithFallback', () => {
  it('returns mempool result when primary succeeds', async () => {
    server.use(
      http.get(`${MEMPOOL_BASE}/address/:address`, () =>
        HttpResponse.json(mockAddress)
      )
    )
    const result = await fetchAddressWithFallback(TEST_ADDRESS, {
      mempoolBase: MEMPOOL_BASE,
      esploraBase: ESPLORA_BASE,
    })
    expect(result.address).toBe(TEST_ADDRESS)
    expect(result.source).toBe('mempool.space')
  })

  it('falls back to esplora when mempool returns 429', async () => {
    server.use(
      http.get(`${MEMPOOL_BASE}/address/:address`, () =>
        new HttpResponse(null, { status: 429 })
      ),
      http.get(`${ESPLORA_BASE}/address/:address`, () =>
        HttpResponse.json(mockAddress)
      )
    )
    const result = await fetchAddressWithFallback(TEST_ADDRESS, {
      mempoolBase: MEMPOOL_BASE,
      esploraBase: ESPLORA_BASE,
    })
    expect(result.source).toBe('blockstream.info')
  })

  it('falls back to esplora when mempool returns 500', async () => {
    server.use(
      http.get(`${MEMPOOL_BASE}/address/:address`, () =>
        new HttpResponse(null, { status: 500 })
      ),
      http.get(`${ESPLORA_BASE}/address/:address`, () =>
        HttpResponse.json(mockAddress)
      )
    )
    const result = await fetchAddressWithFallback(TEST_ADDRESS, {
      mempoolBase: MEMPOOL_BASE,
      esploraBase: ESPLORA_BASE,
    })
    expect(result.source).toBe('blockstream.info')
  })

  it('throws UpstreamError when both providers fail', async () => {
    server.use(
      http.get(`${MEMPOOL_BASE}/address/:address`, () =>
        new HttpResponse(null, { status: 500 })
      ),
      http.get(`${ESPLORA_BASE}/address/:address`, () =>
        new HttpResponse(null, { status: 500 })
      )
    )
    await expect(
      fetchAddressWithFallback(TEST_ADDRESS, {
        mempoolBase: MEMPOOL_BASE,
        esploraBase: ESPLORA_BASE,
      })
    ).rejects.toThrow(UpstreamError)
  })
})
