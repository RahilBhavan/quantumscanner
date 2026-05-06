'use client'

import { useState, useMemo } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { AddressResult } from '@/lib/api/resolve-address'

type SortKey = 'address' | 'classification' | 'balanceBtc' | 'riskScore'
type SortDir = 'asc' | 'desc'
type ClassFilter = 'ALL' | AddressResult['classification']

interface AddressTableProps {
  results: AddressResult[]
}

const CLASSIFICATION_BADGE: Record<string, { label: string; className: string }> = {
  EXPOSED: { label: 'Exposed', className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400' },
  SAFE_AT_REST: { label: 'Safe', className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' },
  EMPTY: { label: 'Empty', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  UNRESOLVABLE: { label: 'Unresolvable', className: 'bg-amber-100 text-amber-700 border-amber-200' },
}

export function AddressTable({ results }: AddressTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('riskScore')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filter, setFilter] = useState<ClassFilter>('ALL')

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const filtered = useMemo(() => {
    const base = filter === 'ALL' ? results : results.filter(r => r.classification === filter)
    return [...base].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'address') cmp = a.address.localeCompare(b.address)
      else if (sortKey === 'classification') cmp = a.classification.localeCompare(b.classification)
      else if (sortKey === 'balanceBtc') cmp = a.balanceBtc - b.balanceBtc
      else if (sortKey === 'riskScore') cmp = a.riskScore.base - b.riskScore.base
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [results, sortKey, sortDir, filter])

  const filters: ClassFilter[] = ['ALL', 'EXPOSED', 'SAFE_AT_REST', 'EMPTY', 'UNRESOLVABLE']

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f === 'ALL' ? 'All' : CLASSIFICATION_BADGE[f]?.label ?? f}
            <span className="ml-1 text-xs opacity-70">
              ({f === 'ALL' ? results.length : results.filter(r => r.classification === f).length})
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {([
                ['address', 'Address'],
                ['classification', 'Status'],
                ['balanceBtc', 'Balance (BTC)'],
                ['riskScore', 'Risk Score (Base)'],
              ] as [SortKey, string][]).map(([key, label]) => (
                <th key={key} className="px-4 py-2 text-left">
                  <button
                    onClick={() => toggleSort(key)}
                    className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
                  >
                    {label}
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const badge = CLASSIFICATION_BADGE[r.classification]
              return (
                <tr key={r.address} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-2 font-mono text-xs">
                    {r.address.slice(0, 16)}…{r.address.slice(-8)}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${badge?.className ?? ''}`}>
                      {badge?.label ?? r.classification}
                    </span>
                  </td>
                  <td className="px-4 py-2 tabular-nums">{r.balanceBtc.toFixed(8)}</td>
                  <td className="px-4 py-2 tabular-nums font-medium">{r.riskScore.base}</td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
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
