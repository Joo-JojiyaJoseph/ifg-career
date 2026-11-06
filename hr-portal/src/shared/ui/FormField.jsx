import PropTypes from 'prop-types'

/**
 * Label, hint and error wrapper for a single control.
 */
export function FormField({ id, label, hint, error, required = false, children }) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      {typeof children === 'function' ? children({ describedBy }) : children}
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

FormField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  error: PropTypes.string,
  required: PropTypes.bool,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
}
