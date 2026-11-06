import PropTypes from 'prop-types'

const variants = {
  primary: 'shine bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 text-white shadow-[0_8px_24px_-6px_rgba(25,118,210,0.55)] hover:shadow-[0_14px_30px_-8px_rgba(25,118,210,0.65)]',
  secondary: 'border border-brand-600/70 bg-white/80 text-brand-700 backdrop-blur hover:border-brand-600 hover:bg-white',
  orange: 'shine bg-gradient-to-r from-accent-orange to-[#F7A94A] text-white shadow-[0_10px_28px_-8px_rgba(243,146,35,0.7)] hover:brightness-105',
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
