import { forwardRef, useEffect, useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import PropTypes from 'prop-types'
import { useDebounce } from '../hooks/useDebounce'

/**
 * Search field that reports its value after a short pause.
 */
export const SearchInput = forwardRef(function SearchInput(
  { id = 'search', label = 'Search', value, onChange, placeholder = 'Search', delay = 300 },
  ref,
) {
  const [text, setText] = useState(value ?? '')
  const debounced = useDebounce(text, delay)

  useEffect(() => {
    setText(value ?? '')
  }, [value])

  useEffect(() => {
    if (debounced !== (value ?? '')) onChange(debounced)
  }, [debounced, onChange, value])

  return (
    <label className="flex min-h-11 items-center gap-2 rounded-full border border-border bg-white px-4 shadow-sm" htmlFor={id}>
      <MagnifyingGlassIcon className="h-5 w-5 text-muted" aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <input
        ref={ref}
        id={id}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        className="w-full border-0 bg-transparent p-0 text-sm focus:ring-0"
      />
    </label>
  )
})

SearchInput.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  delay: PropTypes.number,
}
