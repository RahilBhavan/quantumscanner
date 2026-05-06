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
      <div className="bg-manila border-2 border-tag-edge rounded-xl p-6 text-center shadow-tag">
        <p className="font-stamp text-6xl leading-none text-ink-dark tabular-nums">
          {counters.totalScanned.toLocaleString()}
        </p>
        <p className="font-form text-xs text-ink-faint mt-2 tracking-[0.15em] uppercase">
          Addresses scanned globally
        </p>
      </div>
      <div className="bg-tag-exposed-bg border-2 border-tag-exposed/40 rounded-xl p-6 text-center shadow-tag">
        <p className="font-stamp text-6xl leading-none text-tag-exposed tabular-nums">
          {exposurePct}%
        </p>
        <p className="font-form text-xs text-ink-faint mt-2 tracking-[0.15em] uppercase">
          Found quantum-exposed
        </p>
      </div>
    </div>
  )
}
