/**
 * Inline badge indicating that the scanned address has appeared in 100 or
 * more transactions. High address reuse increases on-chain metadata exposure
 * and makes UTXO-graph analysis easier for adversaries, independent of
 * quantum risk. Rendered alongside the balance in {@link SafeAtRestCard} and
 * {@link ExposedCard} when the HIGH_REUSE flag is present on the result.
 */
export function HighReuseBadge() {
  return (
    <span className="font-stamp border-tag-error/60 text-tag-error rounded border-2 px-1.5 py-0.5 text-xs tracking-wider whitespace-nowrap">
      High reuse — 100+ transactions
    </span>
  )
}
