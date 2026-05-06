'use client'

import { AlertTriangle, Eye, CheckCircle, HelpCircle } from 'lucide-react'

/** Props for {@link RecommendedActionsSummary}. */
interface RecommendedActionsSummaryProps {
  /**
   * Count of addresses in each recommended-action bucket. A value of `0`
   * causes that action's card to be omitted from the rendered output so
   * only relevant actions are surfaced.
   */
  counts: {
    /** Addresses with exposed pubkeys and non-zero balance — highest urgency. */
    MIGRATE_IMMEDIATELY: number
    /** Addresses with exposed pubkeys but zero or low balance — watch for incoming funds. */
    MONITOR: number
    /** Addresses that are safe at rest — no quantum risk today. */
    NO_ACTION_NEEDED: number
    /** Addresses that are ambiguous (P2SH) or unresolvable — requires manual verification. */
    MANUAL_REVIEW: number
  }
}

/**
 * Static metadata for each recommended-action type: display label,
 * description, icon, and border colour. The `key` field must match
 * the `counts` prop keys so that each entry can look up its count.
 */
const ACTIONS = [
  {
    key: 'MIGRATE_IMMEDIATELY' as const,
    label: 'Migrate Immediately',
    description:
      'These addresses have exposed public keys and non-zero balance. Move funds now.',
    icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
    className: 'border-red-200 dark:border-red-900',
  },
  {
    key: 'MONITOR' as const,
    label: 'Monitor',
    description:
      'Pubkey is exposed, but balance is zero or address is low-value. Watch for incoming funds.',
    icon: <Eye className="h-5 w-5 text-amber-500" />,
    className: 'border-amber-200 dark:border-amber-900',
  },
  {
    key: 'NO_ACTION_NEEDED' as const,
    label: 'No Action Needed',
    description:
      'Safe at rest — pubkey is still hash-protected. No quantum risk today.',
    icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    className: 'border-emerald-200 dark:border-emerald-900',
  },
  {
    key: 'MANUAL_REVIEW' as const,
    label: 'Manual Review',
    description:
      'Address type is ambiguous (P2SH) or could not be resolved. Verify manually.',
    icon: <HelpCircle className="h-5 w-5 text-slate-400" />,
    className: '',
  },
]

/**
 * Action-grouped summary panel shown at the bottom of the portfolio dashboard.
 *
 * Groups scanned addresses into four prioritised buckets and renders a card
 * for each bucket that has at least one address. Cards with a count of zero
 * are suppressed entirely, keeping the panel focused on what actually needs
 * attention. Each card shows an icon, action label, address count, and a
 * brief description of why addresses land in that bucket and what to do about
 * them.
 */
export function RecommendedActionsSummary({
  counts,
}: RecommendedActionsSummaryProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ACTIONS.map((action) => {
        const count = counts[action.key]
        if (count === 0) return null
        return (
          <div
            key={action.key}
            className={`flex gap-3 rounded-lg border p-4 ${action.className}`}
          >
            <div className="mt-0.5 shrink-0">{action.icon}</div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold">{action.label}</span>
                <span className="text-2xl font-bold tabular-nums">{count}</span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {action.description}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
