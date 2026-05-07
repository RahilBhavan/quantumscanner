'use client'

import { useState, useEffect } from 'react'
import { detectAddressType } from '@/lib/classification/detect-type'
import type { AddressResult } from '@/lib/api/resolve-address'
import { scanAddress } from '@/lib/client/api'
import { ResultCard } from './ResultCard'

type ScanState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: AddressResult }
  | { status: 'error'; message: string }

interface ScanFormProps {
  initialAddress?: string
}

export function ScanForm({ initialAddress }: ScanFormProps) {
  const [address, setAddress] = useState(initialAddress ?? '')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [state, setState] = useState<ScanState>({ status: 'idle' })

  function validate(value: string): string | null {
    if (!value.trim()) return 'Please enter a Bitcoin address.'
    if (detectAddressType(value.trim()) === 'UNKNOWN') {
      return 'This does not appear to be a valid mainnet Bitcoin address.'
    }
    return null
  }

  async function performScan(addr: string) {
    const err = validate(addr)
    if (err) {
      setValidationError(err)
      return
    }
    setValidationError(null)
    setState({ status: 'loading' })
    try {
      const result = await scanAddress(addr)
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAddress(e.target.value)
    if (validationError) setValidationError(validate(e.target.value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await performScan(address.trim())
  }

  function handleReset() {
    setAddress('')
    setValidationError(null)
    setState({ status: 'idle' })
  }

  // Auto-submit when a pre-filled address arrives via URL param.
  // Deferred to a microtask so synchronous setState calls inside performScan
  // don't fire within the effect body (avoids react-hooks/set-state-in-effect).
  useEffect(() => {
    const trimmed = initialAddress?.trim()
    if (!trimmed) return
    void Promise.resolve().then(() => performScan(trimmed))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        {state.status === 'success' && (
          <div className="space-y-4">
            <ResultCard
              result={state.result}
              onRetry={() => performScan(address.trim())}
            />
            <div className="text-center">
              <button
                onClick={handleReset}
                className="font-stamp border-tag-edge text-ink-mid hover:text-ink-dark rounded-lg border-2 border-dashed px-4 py-2 text-xs tracking-wider transition-colors"
              >
                Scan another address
              </button>
            </div>
          </div>
        )}
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
