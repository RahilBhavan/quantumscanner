import type { ScanCounters } from '@/lib/kv/counters'

interface LiveCounterProps {
  counters: ScanCounters
}

export function LiveCounter({ counters }: LiveCounterProps) {
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
