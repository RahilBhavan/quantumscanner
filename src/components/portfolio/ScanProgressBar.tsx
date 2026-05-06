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
      <div className="flex items-center justify-between">
        <span className="font-stamp text-ink-faint text-xs tracking-[0.2em]">
          Processing Baggage
        </span>
        <span className="font-form text-ink-mid text-xs tabular-nums">
          {completed} / {total}
        </span>
      </div>

      {/* Conveyor belt track */}
      <div className="border-tag-edge bg-manila relative h-4 overflow-hidden rounded border-2">
        <div
          className="bg-ink-mid h-full transition-all duration-300"
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

      <p className="font-form text-ink-faint text-right text-xs tabular-nums">
        {pct}%
      </p>
    </div>
  )
}
