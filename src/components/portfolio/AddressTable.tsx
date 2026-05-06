'use client'

import { useState, useMemo } from 'react'
import { ArrowUpDown } from 'lucide-react'
import type { AddressResult } from '@/lib/api/resolve-address'

/** Column keys that can be used to sort the address table. */
type SortKey = 'address' | 'classification' | 'balanceBtc' | 'riskScore'

/** Sort direction for the currently active sort key. */
type SortDir = 'asc' | 'desc'

/**
 * Classification filter value. `'ALL'` disables filtering; the other values
 * are the possible `AddressResult['classification']` literals.
 */
type ClassFilter = 'ALL' | AddressResult['classification']

/** Props for {@link AddressTable}. */
interface AddressTableProps {
  /** The full array of scan results to display and sort. */
  results: AddressResult[]
}

/**
 * Maps each classification string to a human-readable label and the
 * Tailwind classes for its inline badge in the table.
 */
const CLASSIFICATION_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  EXPOSED: {
    label: 'Exposed',
    className: 'border-tag-exposed/50 bg-tag-exposed-bg text-tag-exposed',
  },
  SAFE_AT_REST: {
    label: 'Safe',
    className: 'border-tag-safe/50 bg-tag-safe-bg text-tag-safe',
  },
  EMPTY: {
    label: 'Empty',
    className: 'border-tag-empty/50 bg-tag-empty-bg text-tag-empty',
  },
  UNRESOLVABLE: {
    label: 'Unresolvable',
    className: 'border-tag-error/50 bg-tag-error-bg text-tag-error',
  },
}

/**
 * Sortable, filterable table listing all addresses from a completed portfolio scan.
 *
 * Provides:
 * - Filter stubs to narrow by classification (ALL / EXPOSED / SAFE_AT_REST /
 *   EMPTY / UNRESOLVABLE), with live counts on each button.
 * - Column-header sort buttons for address, classification, BTC balance, and
 *   base-scenario risk score. Clicking the active column toggles direction;
 *   clicking a new column resets direction to descending.
 * - Colour-coded classification badges aligned with the baggage-tag design system.
 * - Addresses are truncated to `first-16…last-8` characters to keep the layout
 *   stable across address types.
 *
 * Sorting and filtering are derived via `useMemo` to avoid re-sorting on every
 * render when only unrelated state changes.
 */
export function AddressTable({ results }: AddressTableProps) {
  // Default sort: highest base risk score first, so the most urgent addresses
  // appear at the top without any user interaction.
  const [sortKey, setSortKey] = useState<SortKey>('riskScore')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filter, setFilter] = useState<ClassFilter>('ALL')

  /**
   * Toggles sort direction when the same column header is clicked again;
   * switches to the new key with descending order when a different column
   * is clicked.
   */
  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  /**
   * Derives the filtered and sorted row array from `results`, `filter`,
   * `sortKey`, and `sortDir`. A spread copy (`[...base]`) is made before
   * sorting to preserve immutability — the original `results` prop is
   * never mutated.
   */
  const filtered = useMemo(() => {
    const base =
      filter === 'ALL'
        ? results
        : results.filter((r) => r.classification === filter)
    return [...base].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'address') cmp = a.address.localeCompare(b.address)
      else if (sortKey === 'classification')
        cmp = a.classification.localeCompare(b.classification)
      else if (sortKey === 'balanceBtc') cmp = a.balanceBtc - b.balanceBtc
      else if (sortKey === 'riskScore')
        cmp = a.riskScore.base - b.riskScore.base
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [results, sortKey, sortDir, filter])

  const filters: ClassFilter[] = [
    'ALL',
    'EXPOSED',
    'SAFE_AT_REST',
    'EMPTY',
    'UNRESOLVABLE',
  ]

  function downloadCsv() {
    const header =
      'address,type,classification,balanceBtc,pubkeyExposed,recommendedAction,riskScore.conservative,riskScore.base,riskScore.aggressive'
    const lines = results.map((r) =>
      [
        r.address,
        r.type,
        r.classification,
        r.balanceBtc,
        r.pubkeyExposed,
        r.recommendedAction,
        r.riskScore.conservative,
        r.riskScore.base,
        r.riskScore.aggressive,
      ].join(',')
    )
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'quantum-scan-results.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3">
      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`font-stamp rounded border-2 px-3 py-1.5 text-xs tracking-wider transition-colors ${
              filter === f
                ? 'bg-ink-dark text-parchment border-ink-dark'
                : 'bg-manila text-ink-faint border-tag-edge hover:text-ink-mid hover:border-ink-mid'
            }`}
          >
            {f === 'ALL' ? 'All' : (CLASSIFICATION_BADGE[f]?.label ?? f)}
            <span className="ml-1 opacity-60">
              (
              {f === 'ALL'
                ? results.length
                : results.filter((r) => r.classification === f).length}
              )
            </span>
          </button>
        ))}
        <button
          onClick={downloadCsv}
          className="font-stamp border-tag-edge text-ink-faint hover:text-ink-mid hover:border-ink-mid ml-auto rounded border-2 px-3 py-1.5 text-xs tracking-wider transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="border-tag-edge overflow-x-auto rounded-xl border-2">
        <table className="w-full text-sm">
          <thead className="bg-manila">
            <tr className="perforation-b">
              {(
                [
                  ['address', 'Address'],
                  ['classification', 'Status'],
                  ['balanceBtc', 'Balance (BTC)'],
                  ['riskScore', 'Risk Score'],
                ] as [SortKey, string][]
              ).map(([key, label]) => (
                <th key={key} className="px-4 py-2.5 text-left">
                  <button
                    onClick={() => toggleSort(key)}
                    className="font-stamp text-ink-faint hover:text-ink-dark flex items-center gap-1 text-xs tracking-wider transition-colors"
                  >
                    {label}
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const badge = CLASSIFICATION_BADGE[r.classification]
              return (
                <tr
                  key={r.address}
                  className="border-tag-edge/30 hover:bg-manila/60 border-t transition-colors"
                >
                  <td className="font-form text-ink-dark px-4 py-2.5 font-mono text-xs">
                    {r.address.slice(0, 16)}…{r.address.slice(-8)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`font-stamp inline-flex items-center rounded border-2 px-2 py-0.5 text-xs tracking-wider ${badge?.className ?? ''}`}
                    >
                      {badge?.label ?? r.classification}
                    </span>
                  </td>
                  <td className="font-form text-ink-mid px-4 py-2.5 text-xs tabular-nums">
                    {r.balanceBtc.toFixed(8)}
                  </td>
                  <td className="font-stamp text-ink-dark px-4 py-2.5 text-sm tabular-nums">
                    {r.riskScore.base}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="font-form text-ink-faint px-4 py-8 text-center text-xs"
                >
                  No addresses match the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
