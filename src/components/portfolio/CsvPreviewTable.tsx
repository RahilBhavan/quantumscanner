'use client'

import { Badge } from '@/components/ui/badge'
import type { ValidatedRow } from '@/lib/csv/validate'

/** Props for {@link CsvPreviewTable}. */
interface CsvPreviewTableProps {
  /**
   * The full array of validated rows from the parsed CSV. Only the first
   * {@link PREVIEW_COUNT} rows are rendered; the remainder are summarised
   * in a footer row.
   */
  rows: ValidatedRow[]
  /**
   * The total number of addresses in the CSV file, used to calculate how
   * many rows are hidden from the preview.
   */
  totalCount: number
}

/**
 * Maximum number of CSV rows shown in the preview table.
 * Additional rows are collapsed into a "+N more" footer line.
 */
const PREVIEW_COUNT = 5

/**
 * Read-only preview table shown after a CSV is parsed but before scanning begins.
 *
 * Displays the first five rows with their line number, truncated address,
 * detected address type, and a validity/duplicate status badge. A footer line
 * summarises how many additional addresses were not shown. This gives the user
 * a chance to spot parsing errors or duplicates before committing to a full scan.
 */
export function CsvPreviewTable({ rows, totalCount }: CsvPreviewTableProps) {
  const preview = rows.slice(0, PREVIEW_COUNT)
  const remaining = totalCount - preview.length

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-muted-foreground px-4 py-2 text-left font-medium">
              #
            </th>
            <th className="text-muted-foreground px-4 py-2 text-left font-medium">
              Address
            </th>
            <th className="text-muted-foreground px-4 py-2 text-left font-medium">
              Type
            </th>
            <th className="text-muted-foreground px-4 py-2 text-left font-medium">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {preview.map((row) => (
            <tr key={row.lineNumber} className="border-t">
              <td className="text-muted-foreground px-4 py-2 tabular-nums">
                {row.lineNumber}
              </td>
              <td className="px-4 py-2 font-mono text-xs">
                {row.address.slice(0, 20)}…{row.address.slice(-6)}
              </td>
              <td className="px-4 py-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {row.type}
                </Badge>
              </td>
              <td className="px-4 py-2">
                {!row.isValid && (
                  <Badge variant="destructive" className="text-xs">
                    Invalid
                  </Badge>
                )}
                {row.isValid && row.isDuplicate && (
                  <Badge variant="secondary" className="text-xs">
                    Duplicate
                  </Badge>
                )}
                {row.isValid && !row.isDuplicate && (
                  <Badge variant="default" className="bg-emerald-600 text-xs">
                    Valid
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {remaining > 0 && (
        <div className="bg-muted/30 text-muted-foreground border-t px-4 py-2 text-sm">
          +{remaining.toLocaleString()} more addresses not shown
        </div>
      )}
    </div>
  )
}
