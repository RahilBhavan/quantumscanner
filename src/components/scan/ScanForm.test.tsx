import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderAsync } from '../../../test/render'
import { ScanForm } from './ScanForm'

vi.mock('@/lib/client/api', () => ({
  scanAddress: vi.fn(),
}))

const VALID_ADDRESS = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'

import { scanAddress } from '@/lib/client/api'
const mockScan = vi.mocked(scanAddress)

const mockResult = {
  address: VALID_ADDRESS,
  type: 'P2PKH',
  classification: 'SAFE_AT_REST' as const,
  pubkeyExposed: false,
  firstSeen: '2009-01-03',
  lastSpend: null,
  balanceBtc: 50,
  balanceUsd: 3400000,
  riskScore: { conservative: 4, base: 11, aggressive: 28 },
  recommendedAction: 'MONITOR',
  dataSource: 'mempool.space',
  flags: [] as string[],
  notes: [] as string[],
  methodologyUrl: 'http://localhost:3000/methodology',
}

describe('ScanForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders address input and submit button', async () => {
    await renderAsync(<ScanForm />)
    expect(
      screen.getByRole('textbox', { name: /bitcoin address/i })
    ).toBeDefined()
    expect(screen.getByRole('button', { name: /scan address/i })).toBeDefined()
  })

  it('shows inline validation error for empty submission without network call', async () => {
    await renderAsync(<ScanForm />)
    await user.click(screen.getByRole('button', { name: /scan address/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeDefined())
    expect(mockScan).not.toHaveBeenCalled()
  })

  it('shows inline validation error for garbage address without network call', async () => {
    await renderAsync(<ScanForm />)
    await user.type(screen.getByRole('textbox'), 'notanaddress')
    await user.click(screen.getByRole('button', { name: /scan address/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeDefined())
    expect(mockScan).not.toHaveBeenCalled()
  })

  it('calls scanAddress with the trimmed address on valid submit', async () => {
    mockScan.mockResolvedValueOnce(mockResult)
    await renderAsync(<ScanForm />)
    await user.type(screen.getByRole('textbox'), VALID_ADDRESS)
    await user.click(screen.getByRole('button', { name: /scan address/i }))
    await waitFor(() => expect(mockScan).toHaveBeenCalledWith(VALID_ADDRESS))
  })

  it('renders SAFE_AT_REST result card after successful scan', async () => {
    mockScan.mockResolvedValueOnce(mockResult)
    await renderAsync(<ScanForm />)
    await user.type(screen.getByRole('textbox'), VALID_ADDRESS)
    await user.click(screen.getByRole('button', { name: /scan address/i }))
    await waitFor(() => expect(screen.getByText(/safe at rest/i)).toBeDefined())
  })

  it('renders error state when API call fails', async () => {
    mockScan.mockRejectedValueOnce(new Error('Upstream unavailable'))
    await renderAsync(<ScanForm />)
    await user.type(screen.getByRole('textbox'), VALID_ADDRESS)
    await user.click(screen.getByRole('button', { name: /scan address/i }))
    await waitFor(() =>
      expect(screen.getByText(/upstream unavailable/i)).toBeDefined()
    )
  })

  it('has aria-live region for async results', async () => {
    await renderAsync(<ScanForm />)
    const liveRegion = document.querySelector('[aria-live="polite"]')
    expect(liveRegion).not.toBeNull()
  })
})
