'use client'

import { Progress } from '@/components/ui/progress'

interface ScanProgressBarProps {
  completed: number
  total: number
}

export function ScanProgressBar({ completed, total }: ScanProgressBarProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="space-y-2" aria-label={`Scanning ${completed} of ${total} addresses`}>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Scanning addresses…</span>
        <span>{completed} / {total}</span>
      </div>
      <Progress value={pct} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} />
      <p className="text-right text-xs text-muted-foreground">{pct}%</p>
    </div>
  )
}
