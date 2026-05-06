import { describe, it, expect } from 'vitest'
import { parseCsv, MAX_ROWS } from './parse'

function makeFile(content: string, name = 'addresses.csv'): File {
  return new File([content], name, { type: 'text/csv' })
}

describe('parseCsv', () => {
  it('parses a clean single-column CSV with header', async () => {
    const csv =
      'address\n1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa\n3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy\n'
    const result = await parseCsv(makeFile(csv))
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0].address).toBe('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
    expect(result.rows[1].address).toBe('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')
    expect(result.errors).toHaveLength(0)
  })

  it('parses a CSV without a header (bare addresses)', async () => {
    const csv =
      '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa\n3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy\n'
    const result = await parseCsv(makeFile(csv))
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0].address).toBe('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
  })

  it('strips BOM from the beginning of the file', async () => {
    const bom = '﻿'
    const csv = `${bom}address\n1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa\n`
    const result = await parseCsv(makeFile(csv))
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].address).toBe('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
  })

  it('handles CRLF line endings', async () => {
    const csv =
      'address\r\n1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa\r\n3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy\r\n'
    const result = await parseCsv(makeFile(csv))
    expect(result.rows).toHaveLength(2)
  })

  it('flags duplicate addresses without removing them', async () => {
    const addr = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
    const csv = `address\n${addr}\n${addr}\n3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy\n`
    const result = await parseCsv(makeFile(csv))
    expect(result.rows).toHaveLength(3)
    expect(result.rows[0].isDuplicate).toBe(false)
    expect(result.rows[1].isDuplicate).toBe(true)
    expect(result.rows[2].isDuplicate).toBe(false)
  })

  it('includes correct line numbers (1-based, excluding header)', async () => {
    const csv =
      'address\n1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa\n3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy\n'
    const result = await parseCsv(makeFile(csv))
    expect(result.rows[0].lineNumber).toBe(1)
    expect(result.rows[1].lineNumber).toBe(2)
  })

  it('skips empty rows', async () => {
    const csv =
      'address\n1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa\n\n3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy\n'
    const result = await parseCsv(makeFile(csv))
    expect(result.rows).toHaveLength(2)
  })

  it('caps at MAX_ROWS and reports overflow error', async () => {
    const rows = Array.from({ length: MAX_ROWS + 5 }, (_, i) => `addr${i}`)
    const csv = `address\n${rows.join('\n')}\n`
    const result = await parseCsv(makeFile(csv))
    expect(result.rows).toHaveLength(MAX_ROWS)
    expect(result.errors.some((e) => e.includes('exceeded'))).toBe(true)
  })

  it('extracts address from multi-column CSV using "address" column header', async () => {
    const csv =
      'label,address,notes\nGenesis,1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa,first block\n'
    const result = await parseCsv(makeFile(csv))
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].address).toBe('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
  })

  it('trims whitespace from addresses', async () => {
    const csv = 'address\n  1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa  \n'
    const result = await parseCsv(makeFile(csv))
    expect(result.rows[0].address).toBe('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
  })

  it('extracts address from CSV using "addr" column header', async () => {
    const csv = 'label,addr\nGenesis,1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa\n'
    const result = await parseCsv(makeFile(csv))
    expect(result.rows[0].address).toBe('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
  })

  it('extracts address from CSV using "btc_address" column header', async () => {
    const csv =
      'btc_address,label\n1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa,Genesis\n'
    const result = await parseCsv(makeFile(csv))
    expect(result.rows[0].address).toBe('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
  })

  it('falls back to first column when no recognized address column name found', async () => {
    const csv =
      'wallet,notes\n1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa,my cold wallet\n'
    const result = await parseCsv(makeFile(csv))
    expect(result.rows[0].address).toBe('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
  })

  it('extracts address from CSV using "bitcoin_address" column header', async () => {
    const csv = 'bitcoin_address\n1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa\n'
    const result = await parseCsv(makeFile(csv))
    expect(result.rows[0].address).toBe('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
  })

  it('returns zero rows for header-only CSV', async () => {
    const csv = 'address\n'
    const result = await parseCsv(makeFile(csv))
    expect(result.rows).toHaveLength(0)
    expect(result.errors).toHaveLength(0)
  })
})
