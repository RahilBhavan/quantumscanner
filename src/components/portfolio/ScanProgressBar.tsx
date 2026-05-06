'use client'

interface ScanProgressBarProps {
  completed: number
  total: number
}

export function ScanProgressBar({ completed, total }: ScanProgressBarProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div
      className="space-y-2"
      aria-label={`Scanning ${completed} of ${total} addresses`}
    >
      <div className="flex justify-between items-center">
        <span className="font-stamp text-xs tracking-[0.2em] text-ink-faint">
          Processing Baggage
        </span>
        <span className="font-form text-xs text-ink-mid tabular-nums">
          {completed} / {total}
        </span>
      </div>

      {/* Conveyor belt track */}
      <div className="relative h-4 rounded border-2 border-tag-edge bg-manila overflow-hidden">
        <div
          className="h-full bg-ink-mid transition-all duration-300"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/* Chevron pattern overlay */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'repeating-linear-gradient(60deg, transparent, transparent 6px, rgba(245,240,232,0.8) 6px, rgba(245,240,232,0.8) 9px)',
            }}
          />
        </div>
      </div>

      <p className="font-form text-right text-xs text-ink-faint tabular-nums">
        {pct}%
      </p>
    </div>
  )
}
