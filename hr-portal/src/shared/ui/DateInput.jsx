import PropTypes from 'prop-types'
import { Input } from './Input'

/**
 * Date field using the browser's own date picker: a calendar on every device, shown in the user's
 * local format (DD-MM-YYYY in India) and stored as Y-m-d. `min` / `max` (Y-m-d) block impossible dates.
 */
export function DateInput({ id, value = '', onChange, invalid = false, describedBy, name, min, max }) {
  return (
    <Input
      id={id}
      name={name}
      type="date"
      value={value ?? ''}
      min={min}
      max={max}
      aria-describedby={describedBy}
      invalid={invalid}
      onChange={(event) => onChange(event.target.value)}
      className="[color-scheme:light]"
    />
  )
}

DateInput.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  invalid: PropTypes.bool,
  describedBy: PropTypes.string,
  /** Earliest allowed date, Y-m-d. */
  min: PropTypes.string,
  /** Latest allowed date, Y-m-d. */
  max: PropTypes.string,
}

