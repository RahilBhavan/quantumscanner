'use client'

interface SummaryBarProps {
  total: number
  exposed: number
  safe: number
  empty: number
  unresolvable: number
  exposedBtc: number
  totalBtc: number
}

interface StatBlockProps {
  label: string
  value: number | string
  ink?: string
  border?: string
}

function StatBlock({
  label,
  value,
  ink = 'text-ink-dark',
  border = 'border-tag-edge',
}: StatBlockProps) {
  return (
    <div className={`rounded-lg border-2 ${border} bg-manila p-4 text-center`}>
      <p className={`font-stamp text-3xl leading-none ${ink} tabular-nums`}>
        {value}
      </p>
      <p className="font-form text-ink-faint mt-1 text-xs tracking-wider uppercase">
        {label}
      </p>
    </div>
  )
}

export function SummaryBar({
  total,
  exposed,
  safe,
  empty,
  unresolvable,
  exposedBtc,
  totalBtc,
}: SummaryBarProps) {
  const exposurePct =
    totalBtc > 0 ? ((exposedBtc / totalBtc) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatBlock label="Total" value={total.toLocaleString()} />
        <StatBlock
          label="Exposed"
          value={exposed.toLocaleString()}
          ink="text-tag-exposed"
          border="border-tag-exposed/40"
        />
        <StatBlock
          label="Safe at Rest"
          value={safe.toLocaleString()}
          ink="text-tag-safe"
          border="border-tag-safe/40"
        />
        <StatBlock
          label="Empty"
          value={empty.toLocaleString()}
          ink="text-tag-empty"
          border="border-tag-empty/40"
        />
        <StatBlock
          label="Unresolvable"
          value={unresolvable.toLocaleString()}
          ink="text-tag-error"
          border="border-tag-error/40"
        />
      </div>

      {/* BTC exposure bar */}
      <div className="border-tag-edge bg-manila rounded-lg border-2 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-stamp text-ink-faint text-xs tracking-[0.2em]">
            BTC Exposure
          </span>
          <span className="font-form text-ink-mid text-xs tabular-nums">
            {exposedBtc.toFixed(4)} / {totalBtc.toFixed(4)} BTC ({exposurePct}%)
          </span>
        </div>
        <div className="border-tag-edge bg-parchment h-3 overflow-hidden rounded border">
          <div
            className="bg-tag-exposed h-full transition-all"
            style={{ width: `${exposurePct}%` }}
            aria-label={`${exposurePct}% of BTC exposed`}
          />
        </div>
      </div>
    </div>
  )
}
