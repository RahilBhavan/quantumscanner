import { CRQC_SCENARIOS } from './scenarios'
import { FORMULA_EXPONENT } from './config'

interface RiskScoreInput {
  exposedBtc: number
  totalBtc: number
  currentYear: number
}

export interface RiskScores {
  conservative: number
  base: number
  aggressive: number
}

export function computeRiskScore({
  exposedBtc,
  totalBtc,
  currentYear,
}: RiskScoreInput): RiskScores {
  if (totalBtc === 0 || exposedBtc === 0) {
    return { conservative: 0, base: 0, aggressive: 0 }
  }

  const exposureRatio = exposedBtc / totalBtc

  const scores = CRQC_SCENARIOS.reduce(
    (acc, scenario) => {
      const yearsToMid = Math.max(1, scenario.crqcMidYear - currentYear)
      const raw =
        exposureRatio *
        100 *
        scenario.weight *
        Math.pow(1 / yearsToMid, FORMULA_EXPONENT)
      acc[scenario.id] = Math.min(100, Math.round(raw))
      return acc
    },
    {} as Record<string, number>
  )

  return {
    conservative: scores.conservative,
    base: scores.base,
    aggressive: scores.aggressive,
  }
}
