'use client'

import type { AddressResult } from '@/lib/api/resolve-address'
import { SafeAtRestCard } from './SafeAtRestCard'
import { ExposedCard } from './ExposedCard'
import { EmptyCard } from './EmptyCard'
import { UnresolvableCard } from './UnresolvableCard'

/** Props for {@link ResultCard}. */
interface Props {
  /** The resolved scan result whose classification drives component selection. */
  result: AddressResult
  /** Called when the user requests a retry (e.g. after UNRESOLVABLE). */
  onRetry?: () => void
}

/**
 * Routing component that maps an {@link AddressResult} classification to the
 * appropriate specialised card component.
 *
 * Acts as a single dispatch point so that consumers (e.g. {@link ScanForm} and
 * the portfolio table) only need to pass an `AddressResult` without knowing
 * which card variant to render. Falls back to `null` for any unrecognised
 * classification to fail silently rather than crash.
 *
 * | Classification  | Rendered component       |
 * |-----------------|--------------------------|
 * | SAFE_AT_REST    | {@link SafeAtRestCard}   |
 * | EXPOSED         | {@link ExposedCard}      |
 * | EMPTY           | {@link EmptyCard}        |
 * | UNRESOLVABLE    | {@link UnresolvableCard} |
 */
export function ResultCard({ result, onRetry }: Props) {
  switch (result.classification) {
    case 'SAFE_AT_REST':
      return <SafeAtRestCard result={result} />
    case 'EXPOSED':
      return <ExposedCard result={result} />
    case 'EMPTY':
      return <EmptyCard result={result} />
    case 'UNRESOLVABLE':
      return (
        <UnresolvableCard
          address={result.address}
          onRetry={onRetry ?? (() => {})}
        />
      )
    default:
      return null
  }
}
