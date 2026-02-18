'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { GradeThresholdSummary } from '@/types'

interface BoundaryChartProps {
  thresholds: GradeThresholdSummary[]
  userPct: number
}

const GRADE_COLORS: Record<string, string> = {
  'A*': '#C9A96E',
  'A':  '#B8C9A9',
  'B':  '#A9B8C9',
  'C':  '#C9B8A9',
  'D':  '#888888',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div
      className="rounded-sm p-3 text-xs"
      style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', fontFamily: 'var(--font-sans)' }}
    >
      <div className="mb-2" style={{ color: '#888' }}>{label}</div>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span style={{ color: '#A8A8A8' }}>{entry.name}:</span>
          <span style={{ color: '#F5F5F0' }}>{entry.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  )
}

export function BoundaryChart({ thresholds, userPct }: BoundaryChartProps) {
  // Build chart data — x-axis = year, y-axis = boundary percentage per grade
  const topGrades = thresholds.filter((t) => ['A*', 'A', 'B', 'C'].includes(t.grade))

  // Collect all years
  const years = Array.from(
    new Set(topGrades.flatMap((t) => t.year_data.map((d) => d.year)))
  ).sort()

  const chartData = years.map((year) => {
    const point: Record<string, number | string> = { year }
    for (const t of topGrades) {
      const yd = t.year_data.find((d) => d.year === year)
      if (yd) point[t.grade] = yd.pct
    }
    return point
  })

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
        No historical data available yet.
      </div>
    )
  }

  return (
    <div>
      <div className="text-xs uppercase tracking-widest mb-4" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
        Grade boundary trends (FM series)
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" />
          <XAxis
            dataKey="year"
            tick={{ fill: '#555', fontSize: 11, fontFamily: 'var(--font-sans)' }}
            axisLine={{ stroke: '#2A2A2A' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#555', fontSize: 11, fontFamily: 'var(--font-sans)' }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* User's score reference line */}
          {chartData.length > 0 && (
            <Line
              dataKey={() => userPct}
              stroke="rgba(201,169,110,0.3)"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              name="Your score"
            />
          )}

          {topGrades.map((t) => (
            <Line
              key={t.grade}
              type="monotone"
              dataKey={t.grade}
              stroke={GRADE_COLORS[t.grade] ?? '#555'}
              strokeWidth={1.5}
              dot={{ r: 3, fill: GRADE_COLORS[t.grade] ?? '#555', strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        {topGrades.map((t) => (
          <div key={t.grade} className="flex items-center gap-1.5 text-xs" style={{ fontFamily: 'var(--font-sans)' }}>
            <div className="w-3 h-0.5" style={{ background: GRADE_COLORS[t.grade] }} />
            <span style={{ color: '#888' }}>{t.grade}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs" style={{ fontFamily: 'var(--font-sans)' }}>
          <div className="w-3 h-0.5" style={{ background: 'rgba(201,169,110,0.4)', borderTop: '1px dashed rgba(201,169,110,0.4)' }} />
          <span style={{ color: '#555' }}>Your score</span>
        </div>
      </div>
    </div>
  )
}
