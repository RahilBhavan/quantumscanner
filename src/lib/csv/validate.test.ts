import { describe, it, expect } from 'vitest'
import { validateCsvRows } from './validate'
import type { ParsedRow } from './parse'

function row(address: string, lineNumber = 1, isDuplicate = false): ParsedRow {
  return { address, lineNumber, isDuplicate }
}

describe('validateCsvRows', () => {
  it('marks valid Bitcoin addresses as valid', () => {
    const rows = [
      row('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'),
      row('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy'),
      row('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'),
    ]
    const result = validateCsvRows(rows)
    expect(result.every(r => r.isValid)).toBe(true)
  })

  it('marks obviously invalid addresses as invalid', () => {
    const rows = [row('notanaddress'), row(''), row('1invalidchecksum')]
    const result = validateCsvRows(rows)
    expect(result.every(r => !r.isValid)).toBe(true)
  })

  it('includes the detected address type for valid addresses', () => {
    const rows = [
      row('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'),
      row('bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297'),
    ]
    const result = validateCsvRows(rows)
    expect(result[0].type).toBe('P2PKH')
    expect(result[1].type).toBe('P2TR')
  })

  it('preserves isDuplicate flag from parsed row', () => {
    const rows = [
      row('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1, false),
      row('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 2, true),
    ]
    const result = validateCsvRows(rows)
    expect(result[0].isDuplicate).toBe(false)
    expect(result[1].isDuplicate).toBe(true)
  })

  it('returns UNKNOWN type for invalid addresses', () => {
    const rows = [row('garbage')]
    const result = validateCsvRows(rows)
    expect(result[0].type).toBe('UNKNOWN')
    expect(result[0].isValid).toBe(false)
  })
})
