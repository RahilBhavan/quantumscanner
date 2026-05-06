import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderAsync } from '../../../test/render'
import { ScanProgressBar } from './ScanProgressBar'

describe('ScanProgressBar', () => {
  it('shows percentage when total > 0', async () => {
    await renderAsync(<ScanProgressBar completed={50} total={200} />)
    expect(screen.getByText('25%')).toBeDefined()
  })

  it('shows 0% when total is 0', async () => {
    await renderAsync(<ScanProgressBar completed={0} total={0} />)
    expect(screen.getByText('0%')).toBeDefined()
  })
})
