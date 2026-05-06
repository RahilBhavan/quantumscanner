'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
        message: error instanceof Error ? error.message : 'An unexpected error occurred.',
      })
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3" noValidate>
        <div className="flex-1">
          <Input
            type="text"
            value={address}
            onChange={handleChange}
            placeholder="Enter a Bitcoin address (e.g. 1A1zP1…)"
            aria-label="Bitcoin address"
            aria-invalid={!!validationError}
            aria-describedby={validationError ? 'address-error' : undefined}
            className="font-mono"
            autoComplete="off"
            spellCheck={false}
          />
          {validationError && (
            <p id="address-error" role="alert" className="mt-1 text-sm text-destructive">
              {validationError}
            </p>
          )}
        </div>
        <Button type="submit" disabled={state.status === 'loading'}>
          {state.status === 'loading' ? 'Scanning…' : 'Scan address'}
        </Button>
      </form>

      <div aria-live="polite" aria-atomic="true">
        {state.status === 'success' && <ResultCard result={state.result} />}
        {state.status === 'error' && (
          <div role="alert" className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
            {state.message}{' '}
            <button
              onClick={() => setState({ status: 'idle' })}
              className="underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
