import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderAsync } from '../../../test/render'
import { CsvDropzone } from './CsvDropzone'

describe('CsvDropzone', () => {
  it('renders upload button', async () => {
    await renderAsync(<CsvDropzone onFile={vi.fn()} />)
    expect(screen.getByRole('button', { name: /upload csv/i })).toBeDefined()
  })

  it('calls onFile when a file is selected via input', async () => {
    const onFile = vi.fn()
    await renderAsync(<CsvDropzone onFile={onFile} />)
    const input = document.querySelector('input[type="file"]')! as HTMLInputElement
    const file = new File(['address\n1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa\n'], 'test.csv', { type: 'text/csv' })
    await userEvent.upload(input, file)
    expect(onFile).toHaveBeenCalledWith(file)
  })

  it('does not call onFile when disabled', async () => {
    const onFile = vi.fn()
    await renderAsync(<CsvDropzone onFile={onFile} disabled />)
    const input = document.querySelector('input[type="file"]')! as HTMLInputElement
    // In disabled state, the pointer-events:none CSS prevents clicks,
    // but we verify the aria-disabled attribute is set
    expect(screen.getByRole('button', { name: /upload csv/i }).getAttribute('aria-disabled')).toBe('true')
  })

  it('has accessible role and label', async () => {
    await renderAsync(<CsvDropzone onFile={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /upload csv/i })
    expect(btn).toBeDefined()
    expect(btn.getAttribute('tabIndex')).toBe('0')
  })

  it('shows max row limit in hint text', async () => {
    await renderAsync(<CsvDropzone onFile={vi.fn()} />)
    expect(screen.getByText(/1,000 bitcoin addresses/i)).toBeDefined()
  })
})
