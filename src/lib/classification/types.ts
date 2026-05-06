/**
 * Bitcoin script type of an address, derived from its encoding and prefix.
 *
 * - `P2PKH`  — Pay-to-Public-Key-Hash (legacy, Base58 `1…`)
 * - `P2SH`   — Pay-to-Script-Hash (Base58 `3…`); script content is opaque on-chain
 * - `P2WPKH` — Pay-to-Witness-Public-Key-Hash (native SegWit `bc1q…`, 20-byte program)
 * - `P2WSH`  — Pay-to-Witness-Script-Hash (native SegWit `bc1q…`, 32-byte program)
 * - `P2TR`   — Pay-to-Taproot (Bech32m `bc1p…`); x-only pubkey always on-chain
 * - `P2PK`   — Pay-to-Public-Key (legacy coinbase outputs); raw pubkey always on-chain
 * - `UNKNOWN` — Address failed validation or is a testnet address
 */
export type AddressType =
  | 'P2PKH'
  | 'P2SH'
  | 'P2WPKH'
  | 'P2WSH'
  | 'P2TR'
  | 'P2PK'
  | 'UNKNOWN'

/**
 * Quantum-exposure classification of a Bitcoin address.
 *
 * - `SAFE_AT_REST`  — Balance present but public key has never been revealed on-chain
 * - `EXPOSED`       — Public key is on-chain (spent output or inherently revealing type),
 *                     making the address theoretically vulnerable to a CRQC attack
 * - `EMPTY`         — Zero balance; no funds at risk regardless of key exposure
 * - `UNRESOLVABLE`  — Address type could not be determined (invalid, testnet, or unsupported)
 */
export type Classification =
  | 'SAFE_AT_REST'
  | 'EXPOSED'
  | 'EMPTY'
  | 'UNRESOLVABLE'

/**
 * Recommended user action derived from classification and balance.
 *
 * - `MONITOR`            — Address is safe for now; watch for CRQC developments
 * - `MIGRATE_IMMEDIATELY` — Exposed public key with non-zero balance; move funds urgently
 * - `NO_ACTION_NEEDED`   — Empty balance or key exposure carries no financial risk
 * - `MANUAL_REVIEW`      — Cannot classify automatically; human inspection required
 */
export type RecommendedAction =
  | 'MONITOR'
  | 'MIGRATE_IMMEDIATELY'
  | 'NO_ACTION_NEEDED'
  | 'MANUAL_REVIEW'

/**
 * Raw on-chain and balance facts for a single Bitcoin address,
 * gathered from a block-explorer API before classification.
 */
export interface AddressFacts {
  /** The Bitcoin address string being analyzed. */
  address: string
  /** Script type inferred from the address encoding. */
  type: AddressType
  /** Total number of confirmed transactions involving this address. */
  txCount: number
  /**
   * Whether at least one outgoing (spending) transaction has been broadcast.
   * For P2PKH / P2WPKH addresses this is the canonical indicator that the
   * public key has appeared in a scriptSig or witness.
   */
  hasOutgoingTx: boolean
  /** Confirmed balance in satoshis (1 BTC = 100,000,000 sat). */
  balanceSat: number
  /** ISO-8601 timestamp of the first transaction seen, or `null` if never used. */
  firstSeen: string | null
  /** ISO-8601 timestamp of the most recent spend, or `null` if no outgoing tx. */
  lastSpend: string | null
}

/**
 * Output of the classification engine for a single address.
 */
export interface ClassificationResult {
  /** High-level quantum-exposure category. */
  classification: Classification
  /**
   * Whether the address's public key is currently observable on-chain.
   * `true` for P2TR/P2PK (always) and for hash-based types that have spent outputs.
   */
  pubkeyExposed: boolean
  /** Behavioral warning flags that may affect risk interpretation. */
  flags: ClassificationFlag[]
  /** Informational notes that qualify the classification result. */
  notes: ClassificationNote[]
}

/**
 * Warning flags attached to a classification result.
 *
 * - `HIGH_REUSE` — Address has more than 100 confirmed transactions,
 *   indicating repeated use which amplifies key-exposure risk.
 */
export type ClassificationFlag = 'HIGH_REUSE'

/**
 * Informational qualifiers attached to a classification result.
 *
 * - `P2SH_AMBIGUOUS` — P2SH addresses can wrap many script types (multisig,
 *   SegWit-wrapped, timelocks, etc.); key-exposure cannot be determined
 *   without inspecting the redeem script, so results are best-effort.
 */
export type ClassificationNote = 'P2SH_AMBIGUOUS'
