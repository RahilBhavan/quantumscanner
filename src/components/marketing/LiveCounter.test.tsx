import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderAsync } from '../../../test/render'
import { LiveCounter } from './LiveCounter'

describe('LiveCounter', () => {
  it('renders total scanned count', async () => {
    await renderAsync(
      <LiveCounter counters={{ totalScanned: 12345, exposedCount: 1234 }} />
    )
    expect(screen.getByText('12,345')).toBeDefined()
  })

  it('renders exposure percentage', async () => {
    await renderAsync(
      <LiveCounter counters={{ totalScanned: 1000, exposedCount: 250 }} />
    )
    expect(screen.getByText('25.0%')).toBeDefined()
  })

  it('shows 0.0% when no addresses scanned yet', async () => {
    await renderAsync(
      <LiveCounter counters={{ totalScanned: 0, exposedCount: 0 }} />
    )
    expect(screen.getByText('0.0%')).toBeDefined()
  })

  it('shows the correct labels', async () => {
    await renderAsync(
      <LiveCounter counters={{ totalScanned: 100, exposedCount: 10 }} />
    )
    expect(screen.getByText(/addresses scanned globally/i)).toBeDefined()
    expect(screen.getByText(/found quantum-exposed/i)).toBeDefined()
  })
})
