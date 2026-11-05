import { useMemo, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import PropTypes from 'prop-types'

/**
 * Type-ahead multi select that stores the chosen values as chips.
 */
export function MultiSelect({ id, value = [], onChange, options, placeholder = 'Search and add', describedBy, invalid = false }) {
  const [query, setQuery] = useState('')
  const matches = useMemo(() => {
    const chosen = new Set(value)
    const needle = query.trim().toLowerCase()
    return options
      .filter((option) => !chosen.has(option.value))
      .filter((option) => option.label.toLowerCase().includes(needle))
      .slice(0, 8)
  }, [options, query, value])

  function add(optionValue) {
    onChange([...value, optionValue])
    setQuery('')
  }

  return (
    <div>
      <div className={`flex min-h-11 flex-wrap items-center gap-2 rounded-xl border bg-white px-2 py-1 ${invalid ? 'border-danger' : 'border-border'}`}>
        {value.map((item) => {
          const option = options.find((entry) => entry.value === item)
          return (
            <span key={item} className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-1 text-xs text-brand-900">
              {option?.label ?? item}
              <button type="button" className="min-h-11 min-w-11" aria-label={`Remove ${option?.label ?? item}`} onClick={() => onChange(value.filter((entry) => entry !== item))}>
                <XMarkIcon className="mx-auto h-4 w-4" />
              </button>
            </span>
          )
        })}
        <input
          id={id}
          value={query}
          aria-describedby={describedBy}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="min-h-11 min-w-[8rem] flex-1 border-0 bg-transparent p-0 text-sm focus:ring-0"
        />
      </div>
      {query && matches.length > 0 ? (
        <ul className="mt-1 max-h-48 overflow-auto rounded-xl border border-border bg-white p-1 shadow-card" role="listbox">
          {matches.map((option) => (
            <li key={option.value}>
              <button type="button" className="min-h-11 w-full rounded-lg px-3 text-left text-sm hover:bg-brand-50" onClick={() => add(option.value)}>
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

MultiSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })).isRequired,
  placeholder: PropTypes.string,
  describedBy: PropTypes.string,
  invalid: PropTypes.bool,
}
