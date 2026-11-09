import PropTypes from 'prop-types'
import { useInFilterPanel } from './filterPanelContext'

/** Wraps filter controls: a grid on the page, a single column inside a FilterPanel. */
export function FilterBar({ children, className = '' }) {
  const inPanel = useInFilterPanel()
  return <div className={`grid grid-cols-1 gap-4 ${inPanel ? '' : 'sm:grid-cols-2 xl:grid-cols-4'} ${className}`}>{children}</div>
}

FilterBar.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
}
