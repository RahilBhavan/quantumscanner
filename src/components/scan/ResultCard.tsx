'use client'

import type { AddressResult } from '@/lib/api/resolve-address'
import { SafeAtRestCard } from './SafeAtRestCard'
import { ExposedCard } from './ExposedCard'
import { EmptyCard } from './EmptyCard'
import { UnresolvableCard } from './UnresolvableCard'

interface Props {
  result: AddressResult
}

export function ResultCard({ result }: Props) {
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
          onRetry={() => window.location.reload()}
        />
      )
    default:
      return null
  }
}
