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
            className="font-stamp text-ink-faint mb-2 block text-xs tracking-[0.2em]"
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
            className="font-form border-tag-edge text-ink-dark placeholder:text-ink-faint focus:border-ink-mid w-full border-0 border-b-2 bg-transparent px-0 py-2 text-sm transition-colors focus:outline-none"
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
          className="font-stamp bg-ink-dark text-parchment hover:bg-ink-mid w-full rounded-lg py-2.5 text-sm tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state.status === 'loading' ? 'Scanning…' : 'Scan address'}
        </button>
      </form>

      <div aria-live="polite" aria-atomic="true">
        {state.status === 'success' && <ResultCard result={state.result} />}
        {state.status === 'error' && (
          <div
            role="alert"
            className="font-form border-stamp-red/40 bg-tag-exposed-bg text-tag-exposed rounded-lg border-2 p-4 text-sm"
          >
            {state.message}{' '}
            <button
              onClick={() => setState({ status: 'idle' })}
              className="font-stamp text-xs tracking-wider underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
