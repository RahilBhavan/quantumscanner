'use client'

import { Badge } from '@/components/ui/badge'
import type { ValidatedRow } from '@/lib/csv/validate'

interface CsvPreviewTableProps {
  rows: ValidatedRow[]
  totalCount: number
}

const PREVIEW_COUNT = 5

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
