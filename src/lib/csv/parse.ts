import Papa from 'papaparse'

export const MAX_ROWS = 1000

export interface ParsedRow {
  address: string
  lineNumber: number
  isDuplicate: boolean
}

export interface ParseResult {
  rows: ParsedRow[]
  errors: string[]
}

const BITCOIN_ADDRESS_RE = /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/

function looksLikeAddress(value: string): boolean {
  return BITCOIN_ADDRESS_RE.test(value.trim())
}

function parseNoHeader(text: string): ParsedRow[] {
  const lines = text
    .replace(/﻿/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  return lines.map((addr, i) => ({
    address: addr,
    lineNumber: i + 1,
    isDuplicate: false,
  }))
}

export function parseCsv(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const raw = (e.target?.result as string) ?? ''
      const text = raw.replace(/﻿/, '').trimStart()

      // Detect if first line looks like a Bitcoin address (= no header row)
      const firstLine = text.split(/\r?\n/)[0]?.trim() ?? ''
      if (looksLikeAddress(firstLine)) {
        const rawRows = parseNoHeader(text)
        resolve(buildResult(rawRows, []))
        return
      }

      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) =>
          h.replace(/^﻿/, '').trim().toLowerCase(),
        transform: (v: string) => v.trim(),
        complete: (results) => {
          const errors: string[] = []
          const rawRows = results.data

          const addressCol = detectAddressColumn(rawRows)
          const rows: ParsedRow[] = rawRows
            .map((row, i) => ({
              address: addressCol
                ? (row[addressCol] ?? '').trim()
                : (Object.values(row)[0]?.trim() ?? ''),
              lineNumber: i + 1,
              isDuplicate: false,
            }))
            .filter((r) => r.address.length > 0)

          resolve(buildResult(rows, errors))
        },
        error: (err: Error) => {
          resolve({ rows: [], errors: [err.message] })
        },
      })
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file, 'utf-8')
  })
}

function buildResult(rows: ParsedRow[], errors: string[]): ParseResult {
  const cappedErrors = [...errors]
  let capped = rows
  if (rows.length > MAX_ROWS) {
    cappedErrors.push(
      `Row count exceeded ${MAX_ROWS}. Only the first ${MAX_ROWS} rows were imported.`
    )
    capped = rows.slice(0, MAX_ROWS)
  }

  const seen = new Set<string>()
  const deduped: ParsedRow[] = capped.map((r) => {
    const isDuplicate = seen.has(r.address)
    seen.add(r.address)
    return { ...r, isDuplicate }
  })

  return { rows: deduped, errors: cappedErrors }
}

function detectAddressColumn(rows: Record<string, string>[]): string | null {
  if (rows.length === 0) return null
  const keys = Object.keys(rows[0])
  const match = keys.find(
    (k) =>
      k === 'address' ||
      k === 'addr' ||
      k === 'btc_address' ||
      k === 'bitcoin_address'
  )
  return match ?? null
}
