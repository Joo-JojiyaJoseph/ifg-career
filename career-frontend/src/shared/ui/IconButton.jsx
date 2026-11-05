import PropTypes from 'prop-types'

/**
 * Icon-only button with a 44px touch target.
 */
export function IconButton({ label, children, className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      aria-label={label}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-brand-700 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

IconButton.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
  type: PropTypes.string,
}
