import { Switch as HeadlessSwitch } from '@headlessui/react'
import PropTypes from 'prop-types'

/**
 * Accessible on/off toggle with a 44px touch target.
 */
export function Switch({ checked, onChange, label, disabled = false, srOnlyLabel = false }) {
  return (
    <label className={`inline-flex min-h-11 items-center gap-3 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <HeadlessSwitch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="group relative inline-flex h-6 w-11 shrink-0 rounded-full bg-slate-300 transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 data-[checked]:bg-brand-600"
      >
        <span className="pointer-events-none mt-0.5 inline-block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition duration-200 group-data-[checked]:translate-x-[1.375rem]" />
      </HeadlessSwitch>
      <span className={srOnlyLabel ? 'sr-only' : 'text-sm text-text'}>{label}</span>
    </label>
  )
}

Switch.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  srOnlyLabel: PropTypes.bool,
}
