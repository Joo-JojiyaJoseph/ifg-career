import PropTypes from 'prop-types'

const variants = {
  primary: 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-card hover:shadow-card-hover',
  secondary: 'border border-brand-600 bg-white text-brand-700 hover:bg-brand-50',
  orange: 'bg-accent-orange text-white hover:brightness-95',
  ghost: 'bg-transparent text-brand-700 hover:bg-brand-100',
  danger: 'bg-danger text-white hover:brightness-95',
}

const sizes = {
  sm: 'min-h-11 px-3 text-sm',
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-12 px-6 text-base',
}

/**
 * Shared button. Touch target is at least 44px.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.97] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <Spinner /> : Icon ? <Icon className="h-5 w-5" aria-hidden="true" /> : null}
      {children}
      {IconRight && !loading ? <IconRight className="h-5 w-5" aria-hidden="true" /> : null}
    </button>
  )
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'orange', 'ghost', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  type: PropTypes.string,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  icon: PropTypes.elementType,
  iconRight: PropTypes.elementType,
  className: PropTypes.string,
  children: PropTypes.node,
}
