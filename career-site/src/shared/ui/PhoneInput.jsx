import { useState } from 'react'
import PropTypes from 'prop-types'
import { getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js'
import { Input } from './Input'
import { Select } from './Select'

const countries = [
  { value: 'IN', label: 'India (+91)' },
  { value: 'AE', label: 'UAE (+971)' },
  { value: 'US', label: 'United States (+1)' },
  { value: 'GB', label: 'United Kingdom (+44)' },
  { value: 'SG', label: 'Singapore (+65)' },
  { value: 'AU', label: 'Australia (+61)' },
]

/**
 * Country code plus national number. The value is an E.164 string.
 */
export function PhoneInput({ id, value = '', onChange, invalid = false, describedBy }) {
  const parsed = value ? parsePhoneNumberFromString(value) : null
  const [country, setCountry] = useState(parsed?.country || 'IN')
  const [national, setNational] = useState(parsed?.nationalNumber || '')
  const [source, setSource] = useState(value)

  if (value !== source) {
    const next = value ? parsePhoneNumberFromString(value) : null
    setSource(value)
    setCountry(next?.country || 'IN')
    setNational(next?.nationalNumber || '')
  }

  function emit(nextCountry, nextNational) {
    const digits = nextNational.replace(/\D/g, '')
    setNational(digits)
    setCountry(nextCountry)
    if (!digits) {
      onChange('')
      setSource('')
      return
    }
    const phone = parsePhoneNumberFromString(digits, nextCountry)
    const e164 = phone?.number || `+${getCountryCallingCode(nextCountry)}${digits}`
    setSource(e164)
    onChange(e164)
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
      <Select
        id={`${id}-country`}
        value={country}
        onChange={(next) => emit(next, national)}
        options={countries}
        invalid={invalid}
        describedBy={describedBy}
      />
      <Input
        id={id}
        value={national}
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="Phone number"
        invalid={invalid}
        aria-describedby={describedBy}
        onChange={(event) => emit(country, event.target.value)}
      />
    </div>
  )
}

PhoneInput.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  invalid: PropTypes.bool,
  describedBy: PropTypes.string,
}
