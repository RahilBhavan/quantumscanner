/**
 * Exponent applied to the reciprocal of years-to-CRQC-midpoint in the risk
 * scoring formula. A value of 0.5 (square root) produces a sub-linear decay
 * curve — risk drops quickly for scenarios far in the future but levels off
 * as the threat window narrows, reflecting increasing real-world urgency.
 */
export const FORMULA_EXPONENT = 0.5

/**
 * Inclusive score ranges that map a 0–100 risk score to a named severity tier.
 *
 * Thresholds are chosen so that:
 * - `LOW` (0–24) covers addresses with negligible near-term CRQC risk.
 * - `MODERATE` (25–49) signals that migration planning should begin.
 * - `HIGH` (50–74) indicates significant exposure requiring prompt action.
 * - `CRITICAL` (75–100) means imminent risk; funds should be moved immediately.
 */
export const RISK_BANDS = Object.freeze({
  LOW: { min: 0, max: 24 },
  MODERATE: { min: 25, max: 49 },
  HIGH: { min: 50, max: 74 },
  CRITICAL: { min: 75, max: 100 },
} as const)

/** Named severity tier derived from a computed risk score. */
export type RiskBand = keyof typeof RISK_BANDS
