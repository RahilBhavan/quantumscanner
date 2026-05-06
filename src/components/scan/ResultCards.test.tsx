import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderAsync } from '../../../test/render'
import { EmptyCard } from './EmptyCard'
import { ExposedCard } from './ExposedCard'
import { UnresolvableCard } from './UnresolvableCard'
import { ResultCard } from './ResultCard'
import { SafeAtRestCard } from './SafeAtRestCard'
import { HighReuseBadge } from './HighReuseBadge'

const BASE_RESULT = {
  address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  type: 'P2PKH',
  pubkeyExposed: false,
  firstSeen: '2009-01-03',
  lastSpend: null,
  balanceBtc: 50,
  balanceUsd: 3_400_000,
  riskScore: { conservative: 4, base: 11, aggressive: 28 },
  recommendedAction: 'MONITOR',
  dataSource: 'mempool.space',
  flags: [] as string[],
  notes: [] as string[],
  methodologyUrl: 'http://localhost/methodology',
}

describe('EmptyCard', () => {
  it('renders address and empty status', async () => {
    await renderAsync(
      <EmptyCard result={{ ...BASE_RESULT, classification: 'EMPTY' }} />
    )
    expect(screen.getByText(/empty/i)).toBeDefined()
    expect(screen.getByText(BASE_RESULT.address)).toBeDefined()
  })

  it('shows pubkey exposed message when key is exposed', async () => {
    await renderAsync(
      <EmptyCard
        result={{
          ...BASE_RESULT,
          classification: 'EMPTY',
          pubkeyExposed: true,
        }}
      />
    )
    expect(screen.getByText(/public key has been exposed/i)).toBeDefined()
  })

  it('shows not exposed message when key is not exposed', async () => {
    await renderAsync(
      <EmptyCard
        result={{
          ...BASE_RESULT,
          classification: 'EMPTY',
          pubkeyExposed: false,
        }}
      />
    )
    expect(screen.getByText(/public key has not been exposed/i)).toBeDefined()
  })
})

describe('ExposedCard', () => {
  it('renders balance and exposed heading', async () => {
    await renderAsync(
      <ExposedCard
        result={{
          ...BASE_RESULT,
          classification: 'EXPOSED',
          pubkeyExposed: true,
        }}
      />
    )
    expect(screen.getByText(/exposed/i)).toBeDefined()
    expect(screen.getByText(/50/)).toBeDefined()
  })

  it('renders P2TR-specific explanation for taproot addresses', async () => {
    await renderAsync(
      <ExposedCard
        result={{
          ...BASE_RESULT,
          classification: 'EXPOSED',
          type: 'P2TR',
          pubkeyExposed: true,
        }}
      />
    )
    expect(screen.getByText(/taproot/i)).toBeDefined()
  })

  it('renders HIGH_REUSE badge when flag present', async () => {
    await renderAsync(
      <ExposedCard
        result={{
          ...BASE_RESULT,
          classification: 'EXPOSED',
          pubkeyExposed: true,
          flags: ['HIGH_REUSE'],
        }}
      />
    )
    expect(screen.getByText(/high reuse/i)).toBeDefined()
  })

  it('shows last spend date when available', async () => {
    await renderAsync(
      <ExposedCard
        result={{
          ...BASE_RESULT,
          classification: 'EXPOSED',
          pubkeyExposed: true,
          lastSpend: '2023-01-15',
        }}
      />
    )
    expect(screen.getByText(/2023-01-15/)).toBeDefined()
  })

  it('shows USD value when available', async () => {
    await renderAsync(
      <ExposedCard
        result={{
          ...BASE_RESULT,
          classification: 'EXPOSED',
          pubkeyExposed: true,
        }}
      />
    )
    expect(screen.getByText(/3,400,000/)).toBeDefined()
  })

  it('omits USD value when null', async () => {
    await renderAsync(
      <ExposedCard
        result={{
          ...BASE_RESULT,
          classification: 'EXPOSED',
          pubkeyExposed: true,
          balanceUsd: null,
        }}
      />
    )
    expect(screen.queryByText(/\$/)).toBeNull()
  })
})

describe('UnresolvableCard', () => {
  it('renders address and unresolvable message', async () => {
    await renderAsync(
      <UnresolvableCard address="notanaddress" onRetry={() => {}} />
    )
    expect(screen.getByText(/notanaddress/)).toBeDefined()
  })
})

describe('HighReuseBadge', () => {
  it('renders high reuse warning text', async () => {
    await renderAsync(<HighReuseBadge />)
    expect(screen.getByText(/high reuse/i)).toBeDefined()
  })
})

describe('ResultCard dispatcher', () => {
  it('renders SafeAtRestCard for SAFE_AT_REST', async () => {
    await renderAsync(
      <ResultCard result={{ ...BASE_RESULT, classification: 'SAFE_AT_REST' }} />
    )
    expect(screen.getByText(/safe at rest/i)).toBeDefined()
  })

  it('renders ExposedCard for EXPOSED', async () => {
    await renderAsync(
      <ResultCard
        result={{
          ...BASE_RESULT,
          classification: 'EXPOSED',
          pubkeyExposed: true,
        }}
      />
    )
    expect(screen.getByText(/exposed/i)).toBeDefined()
  })

  it('renders EmptyCard for EMPTY', async () => {
    await renderAsync(
      <ResultCard result={{ ...BASE_RESULT, classification: 'EMPTY' }} />
    )
    expect(screen.getByText(/empty/i)).toBeDefined()
  })

  it('renders UnresolvableCard for UNRESOLVABLE', async () => {
    await renderAsync(
      <ResultCard result={{ ...BASE_RESULT, classification: 'UNRESOLVABLE' }} />
    )
    expect(screen.getByText(/unresolvable/i)).toBeDefined()
  })
})

describe('SafeAtRestCard', () => {
  it('renders safe status heading', async () => {
    await renderAsync(
      <SafeAtRestCard
        result={{ ...BASE_RESULT, classification: 'SAFE_AT_REST' }}
      />
    )
    expect(screen.getByText(/safe at rest/i)).toBeDefined()
  })
})
