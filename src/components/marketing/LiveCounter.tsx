import type { ScanCounters } from '@/lib/kv/counters'

/** Props for {@link LiveCounter}. */
interface LiveCounterProps {
  /**
   * Aggregate scan counters fetched server-side from the KV store.
   * Passed in as a prop (rather than fetched client-side) so the numbers
   * are available on first paint without a client round-trip.
   */
  counters: ScanCounters
}

/**
 * Social-proof widget displayed on the marketing landing page.
 *
 * Shows two key global statistics side by side:
 * 1. Total number of Bitcoin addresses scanned across all users.
 * 2. Percentage of those addresses found to be quantum-exposed.
 *
 * The exposure percentage is derived from `counters` at render time rather
 * than stored pre-computed, guarding against division by zero when no scans
 * have been recorded yet. Both tiles use the vintage baggage-tag aesthetic to
 * stay visually consistent with the rest of the product.
 */
export function LiveCounter({ counters }: LiveCounterProps) {
  // Guard against division by zero when the counter store is freshly initialised
  // or the KV read returns zero for totalScanned.
  const exposurePct =
    counters.totalScanned > 0
      ? ((counters.exposedCount / counters.totalScanned) * 100).toFixed(1)
      : '0.0'

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="bg-manila border-tag-edge shadow-tag rounded-xl border-2 p-6 text-center">
        <p className="font-stamp text-ink-dark text-6xl leading-none tabular-nums">
          {counters.totalScanned.toLocaleString()}
        </p>
        <p className="font-form text-ink-faint mt-2 text-xs tracking-[0.15em] uppercase">
          Addresses scanned globally
        </p>
      </div>
      <div className="bg-tag-exposed-bg border-tag-exposed/40 shadow-tag rounded-xl border-2 p-6 text-center">
        <p className="font-stamp text-tag-exposed text-6xl leading-none tabular-nums">
          {exposurePct}%
        </p>
        <p className="font-form text-ink-faint mt-2 text-xs tracking-[0.15em] uppercase">
          Found quantum-exposed
        </p>
      </div>
    </div>
  )
}
