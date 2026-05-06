/**
 * @module classification
 *
 * Core Bitcoin address classification pipeline.
 *
 * Typical call sequence:
 * 1. {@link detectAddressType} — validate and identify the script type
 * 2. {@link classifyAddress}   — determine quantum-exposure classification
 * 3. {@link getRecommendedAction} — derive the user-facing recommended action
 *
 * All public types are re-exported from {@link ./types} for consumers that
 * only need the type definitions without pulling in runtime logic.
 */
export * from './types'
export * from './detect-type'
export * from './classify'
export * from './recommended-action'
