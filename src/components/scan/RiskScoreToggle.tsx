'use client'

import { useState } from 'react'
import { toBand } from '@/lib/risk/band'

interface RiskScoreToggleProps {
  scores: { conservative: number; base: number; aggressive: number }
}

const BAND_COLORS: Record<string, string> = {
  LOW: 'text-tag-safe',
  MODERATE: 'text-tag-error',
  HIGH: 'text-tag-exposed',
  CRITICAL: 'text-stamp-red',
}

const TABS = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'base', label: 'Base' },
  { value: 'aggressive', label: 'Aggressive' },
] as const

type Tab = (typeof TABS)[number]['value']

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

export function RiskScoreToggle({ scores }: RiskScoreToggleProps) {
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
