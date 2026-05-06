import { BaggageTag } from '@/components/ui/BaggageTag'
import type { AddressResult } from '@/lib/api/resolve-address'

interface Props {
  result: AddressResult
}

export function EmptyCard({ result }: Props) {
  return (
    <BaggageTag variant="empty" destination="Empty" subLabel="No Funds at Risk">
      <div className="space-y-3">
        <p className="font-form text-xs text-ink-dark truncate border-b border-dashed border-tag-edge/40 pb-2">
          {result.address}
        </p>
        <p className="font-form text-xs text-ink-mid leading-relaxed">
          This address has no UTXO balance. Classification is shown for
          completeness.
        </p>
        <p className="font-form text-xs text-ink-faint">
          Address type: <strong className="text-ink-mid">{result.type}</strong>{' '}
          &middot;{' '}
          {result.pubkeyExposed
            ? 'Public key has been exposed on-chain.'
            : 'Public key has not been exposed.'}
        </p>
      </div>
    </BaggageTag>
  )
}
