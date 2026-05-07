import { CRQC_SCENARIOS } from './scenarios'
import { FORMULA_EXPONENT } from './config'

/**
 * Inputs required to compute a set of CRQC risk scores for one address or portfolio.
 */
interface RiskScoreInput {
  /**
   * The portion of the address balance (in BTC) whose public key is on-chain
   * and therefore vulnerable to a cryptographically-relevant quantum computer.
   * Pass `0` for addresses classified as SAFE_AT_REST or EMPTY.
   */
  exposedBtc: number
  /**
   * Total confirmed balance of the address or portfolio in BTC.
   * Used to compute the exposure ratio — set to `0` when balance is zero.
   */
  totalBtc: number
  /**
   * The current calendar year, used to calculate the number of years until
   * each CRQC scenario's midpoint arrival year.
   */
  currentYear: number
}

/**
 * Risk scores under each CRQC timeline scenario, in the range 0–100.
 * A higher score indicates greater urgency to migrate funds.
 */
export interface RiskScores {
  /** Score assuming quantum computers arrive no earlier than ~2042. */
  conservative: number
  /** Score assuming quantum computers arrive around 2033–2037. */
  base: number
  /** Score assuming quantum computers arrive as early as 2029–2032. */
  aggressive: number
}

/**
 * Computes CRQC risk scores for an address or portfolio across three timeline scenarios.
 *
 * **Formula** (per scenario):
 * ```
 * raw = (exposedBtc / totalBtc) × 100 × weight × (1 / yearsToMid)^FORMULA_EXPONENT
 * score = min(100, round(raw))
 * ```
 *
 * Key properties of the formula:
 * - **Exposure ratio** (`exposedBtc / totalBtc`): scales score by how much of
 *   the portfolio is at risk. An all-exposed portfolio scores higher than a
 *   partially exposed one with the same BTC amount.
 * - **Scenario weight**: the aggressive scenario (weight 1.0) is the worst-case
 *   ceiling; conservative (weight 0.6) discounts for longer lead times.
 * - **Time decay** (`(1/yearsToMid)^0.5`): a square-root curve so that risk
 *   climbs steeply as the CRQC window approaches rather than linearly.
 * - **Floor of 1 year**: `Math.max(1, ...)` prevents division by zero or
 *   negative values when the scenario midpoint has already passed.
 *
 * @param input - Exposure data and current year for score calculation.
 * @returns {@link RiskScores} for all three CRQC timeline scenarios.
 */
export function computeRiskScore({
  exposedBtc,
  totalBtc,
  currentYear,
}: RiskScoreInput): RiskScores {
  // Short-circuit: zero total or zero exposure means there is nothing at risk.
  if (totalBtc === 0 || exposedBtc === 0) {
    return { conservative: 0, base: 0, aggressive: 0 }
  }

  // Proportion of the portfolio whose public key is on-chain (0–1).
  const exposureRatio = exposedBtc / totalBtc

  const scores = CRQC_SCENARIOS.reduce<Record<string, number>>(
    (acc, scenario) => {
      // Clamp to at least 1 year so past-midpoint scenarios don't produce
      // division-by-zero or negative time values.
      const yearsToMid = Math.max(1, scenario.crqcMidYear - currentYear)
      const raw =
        exposureRatio *
        100 *
        scenario.weight *
        Math.pow(1 / yearsToMid, FORMULA_EXPONENT)
      return { ...acc, [scenario.id]: Math.min(100, Math.round(raw)) }
    },
    {}
  )

  return {
    conservative: scores['conservative'] ?? 0,
    base: scores['base'] ?? 0,
    aggressive: scores['aggressive'] ?? 0,
  }
}
