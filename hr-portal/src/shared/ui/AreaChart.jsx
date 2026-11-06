import PropTypes from 'prop-types'
import { Area, AreaChart as Chart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

/**
 * Smooth gradient area chart with a navy tooltip pill. Lazy-load this file: it pulls in Recharts.
 */
export default function AreaChart({ data, series, height = 260 }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data} margin={{ top: 16, right: 12, bottom: 0, left: -12 }}>
          <defs>
            {series.map((item) => (
              <linearGradient key={item.key} id={`area-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={item.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={item.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="4 4" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} minTickGap={24} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} width={44} />
          <Tooltip content={<Pill series={series} />} cursor={{ stroke: '#1E88E5', strokeDasharray: '4 4' }} />
          {series.map((item) => (
            <Area
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.label}
              stroke={item.color}
              strokeWidth={2.5}
              fill={`url(#area-${item.key})`}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 3, stroke: '#fff', fill: item.color }}
              animationDuration={900}
            />
          ))}
        </Chart>
      </ResponsiveContainer>
    </div>
  )
}

function Pill({ active, payload, label, series }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl bg-navy px-3 py-2 text-xs text-white shadow-card">
      <p className="font-semibold">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey}>
          {series.length > 1 ? `${item.name}: ` : ''}{Number(item.value).toLocaleString('en-IN')} applications
        </p>
      ))}
    </div>
  )
}

AreaChart.propTypes = {
  data: PropTypes.array.isRequired,
  series: PropTypes.arrayOf(PropTypes.shape({ key: PropTypes.string.isRequired, label: PropTypes.string, color: PropTypes.string.isRequired })).isRequired,
  height: PropTypes.number,
}
Pill.propTypes = { active: PropTypes.bool, payload: PropTypes.array, label: PropTypes.string, series: PropTypes.array }
