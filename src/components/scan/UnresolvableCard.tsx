'use client'

import { BaggageTag } from '@/components/ui/BaggageTag'

interface Props {
  address: string
  onRetry: () => void
}

export function UnresolvableCard({ address, onRetry }: Props) {
  return (
    <BaggageTag variant="error" destination="Error" subLabel="Unresolvable">
      <div className="space-y-3">
        <p className="font-form text-xs text-ink-dark truncate border-b border-dashed border-tag-edge/40 pb-2">
          {address}
        </p>
        <p className="font-form text-xs text-ink-mid leading-relaxed">
          This address format was not recognized, or blockchain data could not
          be fetched. Manual review is required.
        </p>
        <p className="font-form text-xs text-ink-faint leading-relaxed">
          If this persists, check directly on{' '}
          <span className="underline">mempool.space</span> or{' '}
          <span className="underline">blockstream.info</span>.
        </p>
        <button
          onClick={onRetry}
          className="font-stamp text-xs tracking-wider border-2 border-tag-edge text-ink-mid px-3 py-1.5 rounded hover:bg-manila transition-colors"
        >
          Try again
        </button>
      </div>
    </BaggageTag>
  )
}
