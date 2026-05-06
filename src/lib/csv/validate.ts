import { detectAddressType } from '@/lib/classification/detect-type'
import type { ParsedRow } from './parse'
import type { AddressType } from '@/lib/classification/types'

export interface ValidatedRow extends ParsedRow {
  type: AddressType
  isValid: boolean
}

export function validateCsvRows(rows: ParsedRow[]): ValidatedRow[] {
  return rows.map(row => {
    const type = detectAddressType(row.address)
    return {
      ...row,
      type,
      isValid: type !== 'UNKNOWN',
    }
  })
}
