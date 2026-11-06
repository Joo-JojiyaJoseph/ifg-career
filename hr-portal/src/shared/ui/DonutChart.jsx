import PropTypes from 'prop-types'
import { m } from 'framer-motion'
import { usePrefersReducedMotion } from './motionPresets'

const palette = { blue: '#1E88E5', teal: '#22C3A6', violet: '#9C6ADE', amber: '#F59E0B', cyan: '#29B6F6', slate: '#CBD5E1', green: '#16A34A', sky: '#0EA5E9' }

/**
 * Donut with the largest share in the middle and a legend. Segments sweep in once. Plain SVG.
 */
export function DonutChart({ items, centreLabel }) {
  const reduced = usePrefersReducedMotion()
  const total = items.reduce((sum, item) => sum + item.value, 0)
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const top = [...items].sort((a, b) => b.value - a.value)[0]
  let offset = 0

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label={items.map((item) => `${item.label} ${item.percent}%`).join(', ')}>
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#EEF5FD" strokeWidth="12" />
          {total > 0 ? items.map((item, index) => {
            const length = (item.value / total) * circumference
            const segment = (
              <m.circle
                key={item.label}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={palette[item.color] ?? item.color}
                strokeWidth="12"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                initial={reduced ? false : { opacity: 0, strokeDasharray: `0 ${circumference}` }}
                animate={{ opacity: 1, strokeDasharray: `${length} ${circumference - length}` }}
                transition={{ duration: 0.8, delay: index * 0.12, ease: 'easeOut' }}
              />
            )
            offset += length
            return segment
          }) : null}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-2xl font-semibold text-navy">{total ? `${top?.percent ?? 0}%` : '—'}</span>
          <span className="max-w-[6rem] text-xs text-muted">{total ? top?.label : centreLabel}</span>
        </div>
      </div>
      <ul className="flex w-full flex-col gap-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-text">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: palette[item.color] ?? item.color }} aria-hidden="true" />
              {item.label}
            </span>
            <span className="font-semibold tabular-nums text-navy">{item.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

DonutChart.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string.isRequired, value: PropTypes.number.isRequired, percent: PropTypes.number, color: PropTypes.string })).isRequired,
  centreLabel: PropTypes.string,
}
