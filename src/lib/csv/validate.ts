import { detectAddressType } from '@/lib/classification/detect-type'
import type { ParsedRow } from './parse'
import type { AddressType } from '@/lib/classification/types'

/**
 * A `ParsedRow` augmented with the results of Bitcoin address type detection
 * and overall validity assessment.
 */
export interface ValidatedRow extends ParsedRow {
  /**
   * The detected Bitcoin address type (`'P2PKH'`, `'P2SH'`, `'P2WPKH'`, etc.).
   * Set to `'UNKNOWN'` when the address string does not match any recognised
   * format, which also causes `isValid` to be `false`.
   */
  type: AddressType

  /**
   * `true` when `type` is a recognised Bitcoin address format (i.e. not
   * `'UNKNOWN'`).  Rows with `isValid: false` are displayed with an error
   * indicator in the CSV preview table and are skipped during the portfolio
   * scan to avoid unnecessary upstream API calls for invalid addresses.
   */
  isValid: boolean
}

/**
 * Validates an array of parsed CSV rows by running address type detection on
 * each entry and annotating the result.
 *
 * This function is a pure transformation — it never throws and does not mutate
 * the input rows.  Invalid addresses are flagged rather than removed so the UI
 * can display them in context and let the user decide whether to proceed.
 *
 * @param rows - Rows produced by {@link parseCsv}, potentially containing
 *               duplicate or malformed addresses.
 * @returns A new array of `ValidatedRow` objects in the same order as the
 *          input, each extended with `type` and `isValid` fields.
 */
export function validateCsvRows(rows: ParsedRow[]): ValidatedRow[] {
  return rows.map((row) => {
    const type = detectAddressType(row.address)
    return {
      ...row,
      type,
      // Any address that resolves to a concrete type is considered valid.
      // 'UNKNOWN' means the string failed all format checks.
      isValid: type !== 'UNKNOWN',
    }
  })
}
