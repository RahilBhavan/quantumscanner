'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface ExposureChartProps {
  safe: number
  exposed: number
  empty: number
  unresolvable: number
}

export function ExposureChart({ safe, exposed, empty, unresolvable }: ExposureChartProps) {
  const data = [
    { name: 'Portfolio', safe, exposed, empty, unresolvable },
  ]

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Address Classification Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip />
          <Legend />
          <Bar dataKey="exposed" name="Exposed" fill="#ef4444" stackId="a" radius={[0, 0, 0, 0]} />
          <Bar dataKey="safe" name="Safe at Rest" fill="#10b981" stackId="a" />
          <Bar dataKey="empty" name="Empty" fill="#94a3b8" stackId="a" />
          <Bar dataKey="unresolvable" name="Unresolvable" fill="#f59e0b" stackId="a" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
