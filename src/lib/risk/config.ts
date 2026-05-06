export const FORMULA_EXPONENT = 0.5

export const RISK_BANDS = Object.freeze({
  LOW: { min: 0, max: 24 },
  MODERATE: { min: 25, max: 49 },
  HIGH: { min: 50, max: 74 },
  CRITICAL: { min: 75, max: 100 },
} as const)

export type RiskBand = keyof typeof RISK_BANDS
