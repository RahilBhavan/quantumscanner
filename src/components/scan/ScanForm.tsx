'use client'

import { useState } from 'react'
import { detectAddressType } from '@/lib/classification/detect-type'
import type { AddressResult } from '@/lib/api/resolve-address'
import { scanAddress } from '@/lib/client/api'
import { ResultCard } from './ResultCard'

/**
 * Discriminated union representing the lifecycle of a single address scan.
 * The component renders different UI for each status, with the result or
 * error message carried directly on the relevant variant.
 */
type ScanState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: AddressResult }
  | { status: 'error'; message: string }

/**
 * Primary interaction surface for the single-address scanner.
 *
 * Renders a text input for a Bitcoin address, validates the format client-side
 * before submission, calls the scan API, and displays the result via
 * {@link ResultCard}. Validation runs eagerly on each keystroke after the
 * first failed attempt so the user gets immediate feedback as they correct
 * their input.
 */
export function ScanForm() {
  const [address, setAddress] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [state, setState] = useState<ScanState>({ status: 'idle' })

  /**
   * Returns a human-readable error string when `value` fails validation,
   * or `null` when the value is acceptable. Rejects empty strings and any
   * address that cannot be identified as a known mainnet type.
   */
  function validate(value: string): string | null {
    if (!value.trim()) return 'Please enter a Bitcoin address.'
    if (detectAddressType(value.trim()) === 'UNKNOWN') {
      return 'This does not appear to be a valid mainnet Bitcoin address.'
    }
    return null
  }

  /**
   * Keeps `address` state in sync with the input and, once the user has
   * already triggered a validation error, re-validates on every keystroke
   * so the error clears as soon as the value becomes valid.
   */
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAddress(e.target.value)
    if (validationError) setValidationError(validate(e.target.value))
  }

  /**
   * Handles form submission: validates the trimmed address, sets loading
   * state, calls the scan API, and transitions to either the success or
   * error state. The form's `noValidate` attribute delegates all validation
   * to this handler rather than the browser.
   */
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
