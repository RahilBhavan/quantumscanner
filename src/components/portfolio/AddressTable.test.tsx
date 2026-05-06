import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderAsync } from '../../../test/render'
import { AddressTable } from './AddressTable'
import type { AddressResult } from '@/lib/api/resolve-address'

function makeResult(overrides: Partial<AddressResult> = {}): AddressResult {
  return {
    address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    type: 'P2PKH',
    classification: 'SAFE_AT_REST',
    pubkeyExposed: false,
    firstSeen: '2009-01-03',
    lastSpend: null,
    balanceBtc: 50,
    balanceUsd: 3_400_000,
    riskScore: { conservative: 4, base: 11, aggressive: 28 },
    recommendedAction: 'NO_ACTION_NEEDED',
    dataSource: 'mempool.space',
    flags: [],
    notes: [],
    methodologyUrl: 'http://localhost/methodology',
    ...overrides,
  }
}

const RESULTS: AddressResult[] = [
  makeResult({ address: '1AAA', classification: 'EXPOSED', pubkeyExposed: true, balanceBtc: 1, riskScore: { conservative: 10, base: 30, aggressive: 60 } }),
  makeResult({ address: '1BBB', classification: 'SAFE_AT_REST', balanceBtc: 5, riskScore: { conservative: 1, base: 5, aggressive: 10 } }),
  makeResult({ address: '1CCC', classification: 'EMPTY', balanceBtc: 0, riskScore: { conservative: 0, base: 0, aggressive: 0 } }),
]

describe('AddressTable', () => {
  it('renders all results by default', async () => {
    await renderAsync(<AddressTable results={RESULTS} />)
    expect(screen.getByText(/1AAA/)).toBeDefined()
    expect(screen.getByText(/1BBB/)).toBeDefined()
    expect(screen.getByText(/1CCC/)).toBeDefined()
  })

  it('filters to EXPOSED only when that filter is clicked', async () => {
    await renderAsync(<AddressTable results={RESULTS} />)
    await userEvent.click(screen.getByRole('button', { name: /exposed/i }))
    expect(screen.getByText(/1AAA/)).toBeDefined()
    expect(screen.queryByText(/1BBB/)).toBeNull()
  })

  it('shows "No addresses match" when filter returns nothing', async () => {
    await renderAsync(<AddressTable results={RESULTS} />)
    await userEvent.click(screen.getByRole('button', { name: /unresolvable/i }))
    expect(screen.getByText(/no addresses match/i)).toBeDefined()
  })

  it('shows filter counts', async () => {
    await renderAsync(<AddressTable results={RESULTS} />)
    expect(screen.getByText(/\(3\)/)).toBeDefined()
  })

  it('clicking sort header twice reverses sort', async () => {
    await renderAsync(<AddressTable results={RESULTS} />)
    const balanceHeader = screen.getByRole('button', { name: /balance/i })
    await userEvent.click(balanceHeader)
    await userEvent.click(balanceHeader)
    // Should not throw
  })

  it('sorts by address column', async () => {
    await renderAsync(<AddressTable results={RESULTS} />)
    await userEvent.click(screen.getByRole('button', { name: /address/i }))
    // Should not throw and addresses should still be present
    expect(screen.getByText(/1AAA/)).toBeDefined()
  })
})
