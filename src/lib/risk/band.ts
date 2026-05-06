import { RISK_BANDS, type RiskBand } from './config'

/**
 * Maps a 0–100 numeric risk score to a named {@link RiskBand} tier.
 *
 * Boundaries are defined in {@link RISK_BANDS} and evaluated with inclusive
 * upper bounds, so a score of exactly 24 is LOW, 25 is MODERATE, etc.
 * Any score above 74 falls into CRITICAL regardless of the upper value.
 *
 * @param score - Integer risk score in the range 0–100.
 * @returns The corresponding {@link RiskBand} label.
 */
export function toBand(score: number): RiskBand {
  if (score <= RISK_BANDS.LOW.max) return 'LOW'
  if (score <= RISK_BANDS.MODERATE.max) return 'MODERATE'
  if (score <= RISK_BANDS.HIGH.max) return 'HIGH'
  return 'CRITICAL'
}
