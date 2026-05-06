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
import { TAG_COLORS } from '@/components/ui/BaggageTag'

interface ExposureChartProps {
  safe: number
  exposed: number
  empty: number
  unresolvable: number
}

export function ExposureChart({
  safe,
  exposed,
  empty,
  unresolvable,
}: ExposureChartProps) {
  const data = [{ name: 'Portfolio', safe, exposed, empty, unresolvable }]

  return (
    <div className="border-tag-edge bg-manila rounded-xl border-2 p-4">
      <h3 className="font-stamp text-ink-faint mb-4 text-sm tracking-[0.2em]">
        Address Classification Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
          <CartesianGrid
            strokeDasharray="4 4"
            horizontal={false}
            stroke="#B8A882"
          />
          <XAxis
            type="number"
            tick={{
              fontFamily: 'var(--font-courier-prime)',
              fontSize: 11,
              fill: '#9E8E75',
            }}
          />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip
            contentStyle={{
              background: '#EDE8DA',
              border: '1px solid #B8A882',
              fontFamily: 'var(--font-courier-prime)',
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{
              fontFamily: 'var(--font-courier-prime)',
              fontSize: 12,
              color: '#5C4F3A',
            }}
          />
          <Bar
            dataKey="exposed"
            name="Exposed"
            fill={TAG_COLORS.exposed}
            stackId="a"
          />
          <Bar
            dataKey="safe"
            name="Safe at Rest"
            fill={TAG_COLORS.safe}
            stackId="a"
          />
          <Bar
            dataKey="empty"
            name="Empty"
            fill={TAG_COLORS.empty}
            stackId="a"
          />
          <Bar
            dataKey="unresolvable"
            name="Unresolvable"
            fill={TAG_COLORS.error}
            stackId="a"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
