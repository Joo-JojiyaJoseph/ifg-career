import PropTypes from 'prop-types'

/** Wraps a row of filter controls. */
export function FilterBar({ children, className = '' }) {
  return <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 ${className}`}>{children}</div>
}

FilterBar.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
}
