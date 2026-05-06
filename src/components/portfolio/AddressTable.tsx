'use client'

import { useState, useMemo } from 'react'
import { ArrowUpDown } from 'lucide-react'
import type { AddressResult } from '@/lib/api/resolve-address'

type SortKey = 'address' | 'classification' | 'balanceBtc' | 'riskScore'
type SortDir = 'asc' | 'desc'
type ClassFilter = 'ALL' | AddressResult['classification']

interface AddressTableProps {
  results: AddressResult[]
}

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

export function AddressTable({ results }: AddressTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('riskScore')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filter, setFilter] = useState<ClassFilter>('ALL')

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

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

  return (
    <div className="space-y-3">
      {/* Filter stubs */}
      <div className="flex flex-wrap gap-2">
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
