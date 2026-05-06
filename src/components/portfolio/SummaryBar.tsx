'use client'

import { Shield, AlertTriangle, Archive, HelpCircle } from 'lucide-react'

interface SummaryBarProps {
  total: number
  exposed: number
  safe: number
  empty: number
  unresolvable: number
  exposedBtc: number
  totalBtc: number
}

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  className?: string
}

function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border p-4 ${className ?? ''}`}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export function SummaryBar({ total, exposed, safe, empty, unresolvable, exposedBtc, totalBtc }: SummaryBarProps) {
  const exposurePct = totalBtc > 0 ? ((exposedBtc / totalBtc) * 100).toFixed(1) : '0.0'

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard
        label="Total Addresses"
        value={total.toLocaleString()}
        icon={<Archive className="h-5 w-5 text-muted-foreground" />}
      />
      <StatCard
        label="Exposed"
        value={exposed.toLocaleString()}
        icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
        className="border-red-200 dark:border-red-900"
      />
      <StatCard
        label="Safe at Rest"
        value={safe.toLocaleString()}
        icon={<Shield className="h-5 w-5 text-emerald-500" />}
        className="border-emerald-200 dark:border-emerald-900"
      />
      <StatCard
        label="Empty"
        value={empty.toLocaleString()}
        icon={<Archive className="h-5 w-5 text-slate-400" />}
      />
      <StatCard
        label="Unresolvable"
        value={unresolvable.toLocaleString()}
        icon={<HelpCircle className="h-5 w-5 text-amber-500" />}
      />
      <div className="col-span-2 flex items-center gap-3 rounded-lg border p-4 sm:col-span-3 lg:col-span-5">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted-foreground">BTC Exposure</span>
            <span className="font-medium">{exposedBtc.toFixed(4)} / {totalBtc.toFixed(4)} BTC ({exposurePct}%)</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-red-500 transition-all"
              style={{ width: `${exposurePct}%` }}
              aria-label={`${exposurePct}% of BTC exposed`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
