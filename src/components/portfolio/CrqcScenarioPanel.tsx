'use client'

import { CRQC_SCENARIOS } from '@/lib/risk/scenarios'

interface CrqcScenarioPanelProps {
  scores: {
    conservative: number
    base: number
    aggressive: number
  }
}

const SCENARIO_ID_TO_KEY = {
  conservative: 'conservative',
  base: 'base',
  aggressive: 'aggressive',
} as const

function riskColor(score: number): string {
  if (score >= 75) return 'text-red-600 dark:text-red-400'
  if (score >= 50) return 'text-orange-500'
  if (score >= 25) return 'text-amber-500'
  return 'text-emerald-600 dark:text-emerald-400'
}

function riskBg(score: number): string {
  if (score >= 75) return 'border-red-200 dark:border-red-900'
  if (score >= 50) return 'border-orange-200 dark:border-orange-900'
  if (score >= 25) return 'border-amber-200 dark:border-amber-900'
  return 'border-emerald-200 dark:border-emerald-900'
}

export function CrqcScenarioPanel({ scores }: CrqcScenarioPanelProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {CRQC_SCENARIOS.map((scenario) => {
        const score = scores[scenario.id as keyof typeof scores]
        return (
          <div
            key={scenario.id}
            className={`rounded-lg border p-4 ${riskBg(score)}`}
          >
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {scenario.label}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {scenario.windowLabel}
            </p>
            <p
              className={`mt-3 text-4xl font-bold tabular-nums ${riskColor(score)}`}
            >
              {score}
            </p>
            <p className="text-muted-foreground text-xs">/ 100 risk score</p>
          </div>
        )
      })}
    </div>
  )
}
