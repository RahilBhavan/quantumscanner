'use client'

import { AlertTriangle, Eye, CheckCircle, HelpCircle } from 'lucide-react'

interface RecommendedActionsSummaryProps {
  counts: {
    MIGRATE_IMMEDIATELY: number
    MONITOR: number
    NO_ACTION_NEEDED: number
    MANUAL_REVIEW: number
  }
}

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
