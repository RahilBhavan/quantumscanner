import { RISK_BANDS, type RiskBand } from './config'

export function toBand(score: number): RiskBand {
  if (score <= RISK_BANDS.LOW.max) return 'LOW'
  if (score <= RISK_BANDS.MODERATE.max) return 'MODERATE'
  if (score <= RISK_BANDS.HIGH.max) return 'HIGH'
  return 'CRITICAL'
}
