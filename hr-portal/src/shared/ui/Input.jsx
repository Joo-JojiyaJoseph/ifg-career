import { forwardRef } from 'react'
import PropTypes from 'prop-types'

const fieldClass =
  'min-h-11 w-full rounded-xl border border-border bg-white px-3 text-text shadow-sm placeholder:text-muted focus:border-brand-500 focus:ring-brand-500'

export const Input = forwardRef(function Input({ invalid = false, className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`${fieldClass} ${invalid ? 'border-danger' : ''} ${className}`}
      {...props}
    />
  )
})

Input.propTypes = {
  invalid: PropTypes.bool,
  className: PropTypes.string,
}

export const Textarea = forwardRef(function Textarea({ invalid = false, className = '', rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`${fieldClass} py-2 ${invalid ? 'border-danger' : ''} ${className}`}
      {...props}
    />
  )
})

Textarea.propTypes = {
  invalid: PropTypes.bool,
  className: PropTypes.string,
  rows: PropTypes.number,
}

export const Checkbox = forwardRef(function Checkbox({ label, ...props }, ref) {
  return (
    <label className="inline-flex min-h-11 items-center gap-3 text-sm text-text">
      <input ref={ref} type="checkbox" className="h-5 w-5 rounded border-border text-brand-600 focus:ring-brand-500" {...props} />
      <span>{label}</span>
    </label>
  )
})

Checkbox.propTypes = {
  label: PropTypes.node,
}
