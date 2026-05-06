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
    <div className="text-center py-2">
      <div className={`font-stamp text-5xl leading-none ${BAND_COLORS[band]}`}>
        {score}
      </div>
      <div className="font-form text-xs text-ink-faint mt-0.5">/ 100</div>
      <div className={`font-stamp text-sm mt-1 tracking-wider ${BAND_COLORS[band]}`}>
        {band}
      </div>
      <div className="font-form text-xs text-ink-faint mt-0.5">{label} scenario</div>
    </div>
  )
}

export function RiskScoreToggle({ scores }: RiskScoreToggleProps) {
  const [tab, setTab] = useState<Tab>('base')

  return (
    <div className="border-2 border-tag-edge rounded-lg overflow-hidden">
      {/* Tab selector — perforated ticket stubs */}
      <div className="grid grid-cols-3 perforation-b bg-manila">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`font-stamp text-xs tracking-wider py-2 transition-colors border-r last:border-r-0 border-tag-edge/40 ${
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
