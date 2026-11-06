import PropTypes from 'prop-types'

/** Visible total for the current filter set. */
export function ResultCount({ count, noun = 'results' }) {
  const label = count === 1 ? noun.replace(/s$/, '') : noun
  return (
    <p className="text-sm text-muted" aria-live="polite">
      {count ?? 0} {label}
    </p>
  )
}

ResultCount.propTypes = {
  count: PropTypes.number,
  noun: PropTypes.string,
}
