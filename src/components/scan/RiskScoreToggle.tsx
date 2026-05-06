'use client'

import { useState } from 'react'
import { toBand } from '@/lib/risk/band'

/** Props for {@link RiskScoreToggle}. */
interface RiskScoreToggleProps {
  /**
   * Pre-computed risk scores for each CRQC timeline scenario.
   * Each value is an integer in the range 0–100.
   */
  scores: { conservative: number; base: number; aggressive: number }
}

/**
 * Maps a risk band label to its corresponding Tailwind text-colour class.
 * Colours escalate from green (LOW) through amber (MODERATE) and orange (HIGH)
 * to red (CRITICAL) to give an immediate visual severity signal.
 */
const BAND_COLORS: Record<string, string> = {
  LOW: 'text-tag-safe',
  MODERATE: 'text-tag-error',
  HIGH: 'text-tag-exposed',
  CRITICAL: 'text-stamp-red',
}

/**
 * Ordered tab definitions for the three CRQC timeline scenarios.
 * Declared `as const` so that the `value` union is inferred as a string
 * literal type rather than a plain `string`.
 */
const TABS = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'base', label: 'Base' },
  { value: 'aggressive', label: 'Aggressive' },
] as const

/** The set of valid tab identifiers, derived from the TABS constant. */
type Tab = (typeof TABS)[number]['value']

/**
 * Internal display component that renders a single numeric score, its
 * `/100` denominator, the derived band label (LOW / MODERATE / HIGH / CRITICAL),
 * and a human-readable scenario description.
 */
function ScoreDisplay({ score, label }: { score: number; label: string }) {
  const band = toBand(score)
  return (
    <div className="py-2 text-center">
      <div className={`font-stamp text-5xl leading-none ${BAND_COLORS[band]}`}>
        {score}
      </div>
      <div className="font-form text-ink-faint mt-0.5 text-xs">/ 100</div>
      <div
        className={`font-stamp mt-1 text-sm tracking-wider ${BAND_COLORS[band]}`}
      >
        {band}
      </div>
      <div className="font-form text-ink-faint mt-0.5 text-xs">
        {label} scenario
      </div>
    </div>
  )
}

/**
 * Interactive widget that lets users compare quantum risk scores across three
 * CRQC (Cryptographically Relevant Quantum Computer) arrival timeline scenarios:
 * Conservative (2040+), Base (2033–2037), and Aggressive (2029–2032).
 *
 * Renders as a tabbed card styled to resemble a perforated ticket stub. The
 * active tab defaults to "Base" — the most widely cited consensus timeline.
 * The score and band label update immediately on tab switch without any
 * network request, as all three scores are passed in as props.
 */
export function RiskScoreToggle({ scores }: RiskScoreToggleProps) {
  // Default to the base scenario, which represents the mainstream estimate
  // for when a CRQC capable of breaking ECDSA-256 might arrive.
  const [tab, setTab] = useState<Tab>('base')

  return (
    <div className="border-tag-edge overflow-hidden rounded-lg border-2">
      {/* Tab selector — perforated ticket stubs */}
      <div className="perforation-b bg-manila grid grid-cols-3">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`font-stamp border-tag-edge/40 border-r py-2 text-xs tracking-wider transition-colors last:border-r-0 ${
              tab === t.value
                ? 'bg-parchment text-ink-dark'
                : 'text-ink-faint hover:text-ink-mid'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-parchment py-2">
        {tab === 'conservative' && (
          <ScoreDisplay
            score={scores.conservative}
            label="Conservative (2040+)"
          />
        )}
        {tab === 'base' && (
          <ScoreDisplay score={scores.base} label="Base (2033–2037)" />
        )}
        {tab === 'aggressive' && (
          <ScoreDisplay
            score={scores.aggressive}
            label="Aggressive (2029–2032)"
          />
        )}
      </div>
    </div>
  )
}
