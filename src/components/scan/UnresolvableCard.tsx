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
        <p className="font-form text-ink-dark border-tag-edge/40 truncate border-b border-dashed pb-2 text-xs">
          {address}
        </p>
        <p className="font-form text-ink-mid text-xs leading-relaxed">
          This address format was not recognized, or blockchain data could not
          be fetched. Manual review is required.
        </p>
        <p className="font-form text-ink-faint text-xs leading-relaxed">
          If this persists, check directly on{' '}
          <span className="underline">mempool.space</span> or{' '}
          <span className="underline">blockstream.info</span>.
        </p>
        <button
          onClick={onRetry}
          className="font-stamp border-tag-edge text-ink-mid hover:bg-manila rounded border-2 px-3 py-1.5 text-xs tracking-wider transition-colors"
        >
          Try again
        </button>
      </div>
    </BaggageTag>
  )
}
