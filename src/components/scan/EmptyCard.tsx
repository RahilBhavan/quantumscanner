import { BaggageTag } from '@/components/ui/BaggageTag'
import type { AddressResult } from '@/lib/api/resolve-address'

/** Props for {@link EmptyCard}. */
interface Props {
  /** The resolved scan result for the address being displayed. */
  result: AddressResult
}

/**
 * Result card shown when an address is classified as EMPTY (zero UTXO balance).
 *
 * Because there are no funds at risk, this card is informational rather than
 * urgent. It still shows the address type and whether the public key has been
 * exposed on-chain, giving the user a complete picture should they receive
 * funds at this address in the future.
 */
export function EmptyCard({ result }: Props) {
  return (
    <BaggageTag variant="empty" destination="Empty" subLabel="No Funds at Risk">
      <div className="space-y-3">
        <p className="font-form text-ink-dark border-tag-edge/40 truncate border-b border-dashed pb-2 text-xs">
          {result.address}
        </p>
        <p className="font-form text-ink-mid text-xs leading-relaxed">
          This address has no UTXO balance. Classification is shown for
          completeness.
        </p>
        <p className="font-form text-ink-faint text-xs">
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
