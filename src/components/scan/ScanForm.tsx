'use client'

import { useState } from 'react'
import { detectAddressType } from '@/lib/classification/detect-type'
import type { AddressResult } from '@/lib/api/resolve-address'
import { scanAddress } from '@/lib/client/api'
import { ResultCard } from './ResultCard'

type ScanState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: AddressResult }
  | { status: 'error'; message: string }

export function ScanForm() {
  const [address, setAddress] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [state, setState] = useState<ScanState>({ status: 'idle' })

  function validate(value: string): string | null {
    if (!value.trim()) return 'Please enter a Bitcoin address.'
    if (detectAddressType(value.trim()) === 'UNKNOWN') {
      return 'This does not appear to be a valid mainnet Bitcoin address.'
    }
    return null
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAddress(e.target.value)
    if (validationError) setValidationError(validate(e.target.value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = address.trim()
    const err = validate(trimmed)
    if (err) {
      setValidationError(err)
      return
    }
    setValidationError(null)
    setState({ status: 'loading' })
    try {
      const result = await scanAddress(trimmed)
      setState({ status: 'success', result })
    } catch (error) {
      setState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred.',
      })
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label
            htmlFor="address-input"
            className="font-stamp text-xs tracking-[0.2em] text-ink-faint block mb-2"
          >
            Destination Address:
          </label>
          <input
            id="address-input"
            type="text"
            value={address}
            onChange={handleChange}
            placeholder="e.g. 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
            aria-label="Bitcoin address"
            aria-invalid={!!validationError}
            aria-describedby={validationError ? 'address-error' : undefined}
            autoComplete="off"
            spellCheck={false}
            className="font-form w-full bg-transparent border-0 border-b-2 border-tag-edge text-ink-dark text-sm py-2 px-0 placeholder:text-ink-faint focus:outline-none focus:border-ink-mid transition-colors"
          />
          {validationError && (
            <p
              id="address-error"
              role="alert"
              className="font-form text-stamp-red mt-1.5 text-xs"
            >
              {validationError}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={state.status === 'loading'}
          className="font-stamp tracking-wider w-full bg-ink-dark text-parchment py-2.5 rounded-lg text-sm hover:bg-ink-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state.status === 'loading' ? 'Scanning…' : 'Scan address'}
        </button>
      </form>

      <div aria-live="polite" aria-atomic="true">
        {state.status === 'success' && <ResultCard result={state.result} />}
        {state.status === 'error' && (
          <div
            role="alert"
            className="font-form border-2 border-stamp-red/40 bg-tag-exposed-bg text-tag-exposed rounded-lg p-4 text-sm"
          >
            {state.message}{' '}
            <button
              onClick={() => setState({ status: 'idle' })}
              className="underline font-stamp text-xs tracking-wider"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
