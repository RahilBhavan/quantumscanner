import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderAsync } from '../../../test/render'
import { PortfolioClient } from '../../app/portfolio/PortfolioClient'

vi.mock('@/lib/client/portfolio-stream', () => ({
  streamPortfolioScan: vi.fn(),
}))

vi.mock('@/lib/csv/parse', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/csv/parse')>('@/lib/csv/parse')
  return { ...actual, parseCsv: vi.fn() }
})

vi.mock('@/lib/csv/validate', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/csv/validate')>(
      '@/lib/csv/validate'
    )
  return { ...actual, validateCsvRows: vi.fn() }
})

import { streamPortfolioScan } from '@/lib/client/portfolio-stream'
import { parseCsv } from '@/lib/csv/parse'
import { validateCsvRows } from '@/lib/csv/validate'

const mockStream = vi.mocked(streamPortfolioScan)
const mockParse = vi.mocked(parseCsv)
const mockValidate = vi.mocked(validateCsvRows)

const VALID_ROW = {
  address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  lineNumber: 1,
  isDuplicate: false,
  isValid: true,
  type: 'P2PKH' as const,
}

const MOCK_RESULT = {
  address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  type: 'P2PKH',
  classification: 'SAFE_AT_REST' as const,
  pubkeyExposed: false,
  firstSeen: '2009-01-03',
  lastSpend: null,
  balanceBtc: 50,
  balanceUsd: 3_400_000,
  riskScore: { conservative: 4, base: 11, aggressive: 28 },
  recommendedAction: 'MONITOR',
  dataSource: 'mempool.space',
  flags: [],
  notes: [],
  methodologyUrl: 'http://localhost/methodology',
}

function makeFile(name = 'portfolio.csv') {
  return new File(['address\n1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa\n'], name, {
    type: 'text/csv',
  })
}

describe('PortfolioClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockParse.mockResolvedValue({
      rows: [{ address: VALID_ROW.address, lineNumber: 1, isDuplicate: false }],
      errors: [],
    })
    mockValidate.mockReturnValue([VALID_ROW])
    mockStream.mockReturnValue(() => {})
  })

  it('shows dropzone initially', async () => {
    await renderAsync(<PortfolioClient />)
    expect(screen.getByRole('button', { name: /upload csv/i })).toBeDefined()
  })

  it('shows preview after file upload', async () => {
    await renderAsync(<PortfolioClient />)
    const file = makeFile()
    const input = document.querySelector(
      'input[type="file"]'
    )! as HTMLInputElement
    await userEvent.upload(input, file)
    await waitFor(() =>
      expect(screen.getByText(/portfolio\.csv/i)).toBeDefined()
    )
    expect(
      screen.getByRole('button', { name: /scan 1 address/i })
    ).toBeDefined()
  })

  it('shows parse errors when CSV has issues', async () => {
    mockParse.mockResolvedValue({
      rows: [],
      errors: ['Row count exceeded 1000.'],
    })
    mockValidate.mockReturnValue([])
    await renderAsync(<PortfolioClient />)
    const input = document.querySelector(
      'input[type="file"]'
    )! as HTMLInputElement
    await userEvent.upload(input, makeFile())
    await waitFor(() =>
      expect(screen.getByText(/Row count exceeded/i)).toBeDefined()
    )
  })

  it('starts scan and shows progress bar', async () => {
    await renderAsync(<PortfolioClient />)
    const input = document.querySelector(
      'input[type="file"]'
    )! as HTMLInputElement
    await userEvent.upload(input, makeFile())
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /scan 1 address/i })
      ).toBeDefined()
    )
    await userEvent.click(
      screen.getByRole('button', { name: /scan 1 address/i })
    )
    await waitFor(() => expect(screen.getByRole('progressbar')).toBeDefined())
  })

  it('shows results dashboard after scan completes', async () => {
    mockStream.mockImplementation(({ onEvent, onDone }) => {
      onEvent({ type: 'result', data: MOCK_RESULT })
      onDone()
      return () => {}
    })
    await renderAsync(<PortfolioClient />)
    const input = document.querySelector(
      'input[type="file"]'
    )! as HTMLInputElement
    await userEvent.upload(input, makeFile())
    await waitFor(() => screen.getByRole('button', { name: /scan 1 address/i }))
    await userEvent.click(
      screen.getByRole('button', { name: /scan 1 address/i })
    )
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /start over/i })).toBeDefined()
    )
  })

  it('resets to upload phase on "Start over"', async () => {
    mockStream.mockImplementation(({ onDone }) => {
      onDone()
      return () => {}
    })
    await renderAsync(<PortfolioClient />)
    const input = document.querySelector(
      'input[type="file"]'
    )! as HTMLInputElement
    await userEvent.upload(input, makeFile())
    await waitFor(() => screen.getByRole('button', { name: /scan 1 address/i }))
    await userEvent.click(
      screen.getByRole('button', { name: /scan 1 address/i })
    )
    await waitFor(() => screen.getByRole('button', { name: /start over/i }))
    await userEvent.click(screen.getByRole('button', { name: /start over/i }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /upload csv/i })).toBeDefined()
    )
  })
})
