import { EmptySearchIllustration } from './illustrations/EmptySearch'
import PropTypes from 'prop-types'

export function Skeleton({ className = '' }) {
  return <div className={`relative overflow-hidden rounded-xl bg-brand-100 ${className}`} aria-hidden="true" />
}

Skeleton.propTypes = {
  className: PropTypes.string,
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-brand-100 bg-white/70 px-6 py-12 text-center backdrop-blur">
      <EmptySearchIllustration className="h-28 w-40" />
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

