import PropTypes from 'prop-types'

/**
 * Horizontal completeness bar. Width is set with a CSS variable.
 */
export function ProgressBar({ value = 0, label = 'Profile completeness' }) {
  const percent = Math.max(0, Math.min(100, Math.round(Number(value) || 0)))

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-text">{label}</span>
        <span className="text-muted">{percent}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-brand-100"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="h-full w-[var(--progress)] rounded-full bg-brand-600" style={{ '--progress': `${percent}%` }} />
      </div>
    </div>
  )
}

ProgressBar.propTypes = {
  value: PropTypes.number,
  label: PropTypes.string,
}
