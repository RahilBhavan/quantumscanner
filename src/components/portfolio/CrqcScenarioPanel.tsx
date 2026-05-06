'use client'

import { CRQC_SCENARIOS } from '@/lib/risk/scenarios'

/** Props for {@link CrqcScenarioPanel}. */
interface CrqcScenarioPanelProps {
  /**
   * Aggregate portfolio risk scores for each CRQC arrival timeline scenario.
   * Each value is an integer in the range 0–100.
   */
  scores: {
    conservative: number
    base: number
    aggressive: number
  }
}

/**
 * Maps a scenario `id` string to the corresponding key in the `scores` prop.
 * This indirection allows iterating over the {@link CRQC_SCENARIOS} metadata
 * array while safely indexing into the typed scores object.
 */
const SCENARIO_ID_TO_KEY = {
  conservative: 'conservative',
  base: 'base',
  aggressive: 'aggressive',
} as const

/**
 * Returns a Tailwind text-colour class scaled to the numeric risk score.
 * Thresholds: ≥75 → red (critical), ≥50 → orange (high),
 * ≥25 → amber (moderate), <25 → emerald (low).
 */
function riskColor(score: number): string {
  if (score >= 75) return 'text-red-600 dark:text-red-400'
  if (score >= 50) return 'text-orange-500'
  if (score >= 25) return 'text-amber-500'
  return 'text-emerald-600 dark:text-emerald-400'
}

/**
 * Returns a Tailwind border-colour class for the card background that matches
 * the same risk thresholds as {@link riskColor}.
 */
function riskBg(score: number): string {
  if (score >= 75) return 'border-red-200 dark:border-red-900'
  if (score >= 50) return 'border-orange-200 dark:border-orange-900'
  if (score >= 25) return 'border-amber-200 dark:border-amber-900'
  return 'border-emerald-200 dark:border-emerald-900'
}

/**
 * Side-by-side panel showing the portfolio's aggregate quantum risk score
 * under each of the three CRQC arrival timeline scenarios.
 *
 * Renders one card per scenario (Conservative / Base / Aggressive), each
 * displaying the scenario label, its estimated arrival window, the numeric
 * score, and colour-coded severity. This lets portfolio owners understand
 * how urgently they need to act depending on how quickly they expect a
 * Cryptographically Relevant Quantum Computer to become available.
 */
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
