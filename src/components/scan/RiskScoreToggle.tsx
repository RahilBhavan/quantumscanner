'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toBand } from '@/lib/risk/band'

interface RiskScoreToggleProps {
  scores: { conservative: number; base: number; aggressive: number }
}

const BAND_COLORS: Record<string, string> = {
  LOW: 'text-green-600',
  MODERATE: 'text-amber-500',
  HIGH: 'text-orange-500',
  CRITICAL: 'text-red-600',
}

function ScoreDisplay({ score, label }: { score: number; label: string }) {
  const band = toBand(score)
  return (
    <div className="text-center">
      <div className={`text-4xl font-bold ${BAND_COLORS[band]}`}>{score}</div>
      <div className="text-sm text-muted-foreground">/ 100</div>
      <div className={`mt-1 text-sm font-medium ${BAND_COLORS[band]}`}>{band}</div>
      <div className="text-xs text-muted-foreground">{label} scenario</div>
    </div>
  )
}

export function RiskScoreToggle({ scores }: RiskScoreToggleProps) {
  const [tab, setTab] = useState('base')

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="conservative">Conservative</TabsTrigger>
        <TabsTrigger value="base">Base</TabsTrigger>
        <TabsTrigger value="aggressive">Aggressive</TabsTrigger>
      </TabsList>
      <TabsContent value="conservative" className="pt-4">
        <ScoreDisplay score={scores.conservative} label="Conservative (2040+)" />
      </TabsContent>
      <TabsContent value="base" className="pt-4">
        <ScoreDisplay score={scores.base} label="Base (2033–2037)" />
      </TabsContent>
      <TabsContent value="aggressive" className="pt-4">
        <ScoreDisplay score={scores.aggressive} label="Aggressive (2029–2032)" />
      </TabsContent>
    </Tabs>
  )
}
