import Papa from 'papaparse'

/**
 * Maximum number of address rows accepted from a single CSV upload.
 * Rows beyond this limit are silently truncated and a warning is appended to
 * the `ParseResult.errors` array.  This cap protects the portfolio scan
 * endpoint from runaway upstream API usage.
 */
export const MAX_ROWS = 1000

/**
 * A single address row extracted from the uploaded CSV or plain-text file.
 */
export interface ParsedRow {
  /** The raw Bitcoin address string as it appeared in the file (untrimmed by this point). */
  address: string
  /** 1-based line number in the original file, used for error reporting. */
  lineNumber: number
  /**
   * `true` when this address has already appeared earlier in the same file.
   * Duplicate rows are preserved in the output (not dropped) so the UI can
   * display a warning badge per row rather than silently losing data.
   */
  isDuplicate: boolean
}

/**
 * The complete outcome of parsing a CSV or plain-text address file.
 */
export interface ParseResult {
  /**
   * Parsed and deduplicate-flagged rows, capped at {@link MAX_ROWS}.
   * Rows are in file order.
   */
  rows: ParsedRow[]
  /**
   * Human-readable warnings accumulated during parsing (e.g. truncation notice).
   * An empty array means the file was parsed without issues.
   */
  errors: string[]
}

/**
 * Regex that matches the three main Bitcoin address formats:
 * - P2PKH  (`1...`)  — 26-34 base58 characters
 * - P2SH   (`3...`)  — 26-34 base58 characters
 * - bech32 (`bc1...`) — up to 62 characters
 *
 * Used only to detect whether the first line of the file IS an address (and
 * therefore the file has no header row).  Full validation happens later in
 * the classification layer.
 *
 * @internal
 */
const BITCOIN_ADDRESS_RE = /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/

/**
 * Returns `true` when `value` resembles a Bitcoin address.
 * Intentionally permissive — false positives here just skip header detection;
 * invalid addresses are caught during validation.
 *
 * @param value - String to test (will be trimmed before matching).
 * @internal
 */
function looksLikeAddress(value: string): boolean {
  return BITCOIN_ADDRESS_RE.test(value.trim())
}

/**
 * Parses a newline-delimited plain-text file where each line is a bare Bitcoin
 * address with no header or additional columns.
 *
 * Strips the UTF-8 BOM (`﻿`) that Excel sometimes prepends when saving
 * CSV files, as well as leading/trailing whitespace from each line.
 *
 * @param text - Raw file contents as a string.
 * @returns Array of `ParsedRow` objects (not yet deduplicated or capped).
 * @internal
 */
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

/**
 * Parses a `File` object containing Bitcoin addresses in one of three formats:
 *
 * 1. **Plain text** — one address per line, no header.  Detected when the
 *    first non-empty line matches the Bitcoin address regex.
 * 2. **CSV with a recognised address column** — a header row containing one of
 *    `address`, `addr`, `btc_address`, or `bitcoin_address`; the matching
 *    column is extracted.
 * 3. **CSV with an arbitrary header** — the first column is used regardless of
 *    its name, as a best-effort fallback.
 *
 * In all cases the result is deduplication-flagged (not dropped) and capped at
 * {@link MAX_ROWS}.  The returned promise always resolves — it never rejects
 * unless the underlying `FileReader` itself fails (OS-level read error).
 *
 * @param file - The `File` object selected by the user (from an `<input>` or
 *               drag-and-drop event).
 * @returns Resolved `ParseResult` containing the extracted rows and any
 *          informational warnings.
 * @throws {Error} Only if `FileReader.onerror` fires, which indicates an
 *                 OS-level failure to read the file.
 */
const MAX_FILE_BYTES = 5 * 1024 * 1024

export function parseCsv(file: File): Promise<ParseResult> {
  if (file.size > MAX_FILE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1)
    return Promise.resolve({
      rows: [],
      errors: [`File too large (${mb} MB). Maximum allowed size is 5 MB.`],
    })
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const raw = (e.target?.result as string) ?? ''
      // Strip BOM and leading whitespace before any processing.
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
        // Normalise header names: strip BOM, trim whitespace, lowercase.
        // This makes column detection case-insensitive and BOM-safe.
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

/**
 * Applies row cap enforcement and duplicate detection to a raw row array,
 * returning a finalised `ParseResult`.
 *
 * Duplicate detection uses a `Set<string>` keyed on the address value.  The
 * first occurrence is marked `isDuplicate: false`; all subsequent occurrences
 * are marked `isDuplicate: true`.  Duplicates are retained in the output so
 * the UI can surface a warning per row rather than silently discarding data.
 *
 * @param rows   - Raw extracted rows before capping or deduplication.
 * @param errors - Errors already accumulated upstream (e.g. PapaParse errors).
 * @returns Final `ParseResult` ready for display and validation.
 * @internal
 */
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

/**
 * Scans the header keys of parsed CSV rows to find a well-known address column
 * name, enabling files exported from popular wallet and exchange tools to be
 * recognised automatically.
 *
 * Recognised column names (case-insensitive, already lowercased by PapaParse
 * `transformHeader`):
 * - `address`
 * - `addr`
 * - `btc_address`
 * - `bitcoin_address`
 *
 * Returns `null` when none of the recognised names are present, signalling
 * callers to fall back to using the first column.
 *
 * @param rows - Parsed CSV rows (must be non-empty for key detection).
 * @returns The matched column key, or `null` if no recognised name was found.
 * @internal
 */
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
