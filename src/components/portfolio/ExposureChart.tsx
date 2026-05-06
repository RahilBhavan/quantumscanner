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

/** Props for {@link ExposureChart}. */
interface ExposureChartProps {
  /** Count of addresses classified as SAFE_AT_REST. */
  safe: number
  /** Count of addresses classified as EXPOSED. */
  exposed: number
  /** Count of addresses classified as EMPTY. */
  empty: number
  /** Count of addresses that could not be resolved. */
  unresolvable: number
}

/**
 * Horizontal stacked bar chart visualising the breakdown of address
 * classifications across the scanned portfolio.
 *
 * Uses Recharts with a single "Portfolio" data point so the four
 * classification counts appear as stacked segments on one horizontal bar.
 * Fill colours are sourced from {@link TAG_COLORS} to stay consistent with
 * the baggage-tag design system. Typography inside the chart (ticks, tooltip,
 * legend) uses the project's Courier Prime font variable.
 */
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
