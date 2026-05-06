'use client'

/** Props for {@link SummaryBar}. */
interface SummaryBarProps {
  /** Total number of addresses scanned in the portfolio. */
  total: number
  /** Count of addresses classified as EXPOSED. */
  exposed: number
  /** Count of addresses classified as SAFE_AT_REST. */
  safe: number
  /** Count of addresses classified as EMPTY (zero balance). */
  empty: number
  /** Count of addresses that could not be resolved. */
  unresolvable: number
  /** Aggregate BTC balance held across EXPOSED addresses. */
  exposedBtc: number
  /** Aggregate BTC balance held across all scanned addresses. */
  totalBtc: number
}

/** Props for the internal {@link StatBlock} display component. */
interface StatBlockProps {
  /** Short uppercase label rendered below the numeric value. */
  label: string
  /** Pre-formatted number or string to display at large size. */
  value: number | string
  /** Tailwind text-colour class for the value. Defaults to `text-ink-dark`. */
  ink?: string
  /** Tailwind border-colour class for the card border. Defaults to `border-tag-edge`. */
  border?: string
}

/**
 * Internal tile component for a single classification count.
 * Each tile renders a large numeric value with a colour-coded label
 * in the vintage baggage-tag style.
 */
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

/**
 * Dashboard summary strip displayed at the top of the portfolio results page.
 *
 * Shows five classification-count tiles (Total, Exposed, Safe at Rest, Empty,
 * Unresolvable) and a proportional BTC exposure bar indicating what fraction
 * of the portfolio's total balance sits in quantum-exposed addresses. Colour
 * coding matches the baggage-tag design system so the visual severity is
 * immediately apparent at a glance.
 */
export function SummaryBar({
  total,
  exposed,
  safe,
  empty,
  unresolvable,
  exposedBtc,
  totalBtc,
}: SummaryBarProps) {
  // Guard against division by zero when no addresses have a balance.
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
