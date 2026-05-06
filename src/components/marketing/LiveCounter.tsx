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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-center">
      <div className="rounded-xl border bg-card p-6">
        <p className="text-4xl font-bold tabular-nums text-foreground">
          {counters.totalScanned.toLocaleString()}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Addresses scanned globally</p>
      </div>
      <div className="rounded-xl border bg-card p-6">
        <p className="text-4xl font-bold tabular-nums text-red-500">
          {exposurePct}%
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Found quantum-exposed</p>
      </div>
    </div>
  )
}
