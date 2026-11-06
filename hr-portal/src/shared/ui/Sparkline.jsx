import { useId } from 'react'
import PropTypes from 'prop-types'
import { m } from 'framer-motion'
import { usePrefersReducedMotion } from './motionPresets'

/**
 * Tiny gradient area chart drawn with plain SVG (no chart library). The line draws in once.
 */
export function Sparkline({ values = [], color = '#1E88E5', width = 120, height = 44, label }) {
  const id = useId()
  const reduced = usePrefersReducedMotion()
  const max = Math.max(1, ...values)
  const step = values.length > 1 ? width / (values.length - 1) : width
  const points = values.map((value, index) => [index * step, height - 4 - (value / max) * (height - 8)])

  if (points.length < 2) return null

  const line = points.reduce((path, [x, y], index) => {
    if (index === 0) return `M${x},${y}`
    const [px, py] = points[index - 1]
    const cx = (px + x) / 2
    return `${path} C${cx},${py} ${cx},${y} ${x},${y}`
  }, '')
  const area = `${line} L${width},${height} L0,${height} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${id})`} />
      <m.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.25"
        strokeLinecap="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </svg>
  )
}

Sparkline.propTypes = {
  values: PropTypes.arrayOf(PropTypes.number),
  color: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  label: PropTypes.string,
}
