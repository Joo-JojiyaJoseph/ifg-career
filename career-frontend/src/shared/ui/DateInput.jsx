import { useState } from 'react'
import PropTypes from 'prop-types'
import { Input } from './Input'
import { toDisplayDate, toIsoDate } from '../lib/formatDate'

/**
 * Date field shown as DD-MM-YYYY and stored as Y-m-d.
 */
export function DateInput({ id, value = '', onChange, invalid = false, describedBy, name }) {
  const [text, setText] = useState(toDisplayDate(value))
  const [source, setSource] = useState(value)

  if (value !== source) {
    setSource(value)
    setText(toDisplayDate(value))
  }

  return (
    <Input
      id={id}
      name={name}
      value={text}
      inputMode="numeric"
      placeholder="DD-MM-YYYY"
      aria-describedby={describedBy}
      invalid={invalid}
      onChange={(event) => {
        const next = event.target.value
        setText(next)
        if (next === '') onChange('')
        const iso = toIsoDate(next)
        if (iso) onChange(iso)
      }}
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
}
