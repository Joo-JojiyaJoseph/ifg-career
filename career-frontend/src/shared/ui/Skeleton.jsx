import PropTypes from 'prop-types'

export function Skeleton({ className = '' }) {
  return <div className={`relative overflow-hidden rounded-xl bg-brand-100 ${className}`} aria-hidden="true" />
}

Skeleton.propTypes = {
  className: PropTypes.string,
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center">
      <EmptyIllustration />
      <h2 className="font-display text-xl text-navy">{title}</h2>
      {description ? <p className="max-w-md text-muted">{description}</p> : null}
      {action}
    </div>
  )
}

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.node,
}

function EmptyIllustration() {
  return (
    <svg viewBox="0 0 120 80" className="h-16 w-24 text-brand-600" aria-hidden="true">
      <rect x="8" y="16" width="104" height="56" rx="12" fill="currentColor" opacity="0.12" />
      <circle cx="40" cy="40" r="10" fill="currentColor" />
      <rect x="56" y="32" width="40" height="6" rx="3" fill="currentColor" opacity="0.5" />
      <rect x="56" y="44" width="28" height="6" rx="3" fill="currentColor" opacity="0.3" />
    </svg>
  )
}
