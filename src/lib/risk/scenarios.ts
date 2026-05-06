/**
 * A single CRQC (Cryptographically-Relevant Quantum Computer) timeline scenario
 * used to model when quantum computers capable of breaking ECDSA/Schnorr
 * secp256k1 signatures might become available.
 */
export interface CrqcScenario {
  /**
   * Machine-readable identifier that maps directly to the corresponding key
   * in {@link RiskScores} so scores can be correlated back to their scenario.
   */
  readonly id: 'conservative' | 'base' | 'aggressive'
  /** Human-readable scenario name displayed in the UI. */
  readonly label: string
  /** Human-readable year range string shown alongside the scenario label. */
  readonly windowLabel: string
  /**
   * The calendar year representing the midpoint of the threat window.
   * Used in the risk scoring formula as the anchor for time-decay calculations.
   */
  readonly crqcMidYear: number
  /**
   * Multiplicative weight applied to the raw score for this scenario (0–1).
   * The aggressive scenario has weight 1.0 (worst-case ceiling); conservative
   * scenarios are discounted to reflect lower probability of early CRQC arrival.
   */
  readonly weight: number
}

/**
 * The three canonical CRQC timeline scenarios used across the application.
 *
 * Scenarios are ordered from least to most urgent. The `aggressive` scenario
 * (earliest arrival, weight 1.0) produces the highest risk scores and is used
 * as the worst-case reference in portfolio summaries.
 *
 * Midpoint years and weights are based on published quantum-computing roadmaps
 * and academic estimates as of 2025–2026; they should be reviewed annually.
 */
export const CRQC_SCENARIOS: readonly CrqcScenario[] = Object.freeze([
  {
    id: 'conservative',
    label: 'Conservative',
    windowLabel: '2040+',
    crqcMidYear: 2042,
    weight: 0.6,
  },
  {
    id: 'base',
    label: 'Base',
    windowLabel: '2033–2037',
    crqcMidYear: 2035,
    weight: 0.85,
  },
  {
    id: 'aggressive',
    label: 'Aggressive',
    windowLabel: '2029–2032',
    crqcMidYear: 2030,
    weight: 1.0,
  },
])
