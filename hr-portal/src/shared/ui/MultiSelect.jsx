import { useId, useMemo, useRef, useState } from 'react'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import PropTypes from 'prop-types'

/**
 * Type-ahead multi select that stores the chosen values as chips.
 * Suggestions open on focus; arrow keys move, Enter picks, Backspace on an empty box removes the last chip.
 * Pass `onCreate(label)` (returns the new option's value) to offer "Add …" when nothing matches;
 * otherwise `createHint` explains where new options come from.
 */
export function MultiSelect({ id, value = [], onChange, options, placeholder = 'Search and add', describedBy, invalid = false, onCreate, createHint, noun = 'item' }) {
  const [query, setQuery] = useState('')
  // Leaving the box closes the list shortly after; coming straight back must cancel that.
  const closeTimer = useRef(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [creating, setCreating] = useState(false)
  const listId = useId()
  const needle = query.trim().toLowerCase()

  const matches = useMemo(() => {
    const chosen = new Set(value)
    return options
      .filter((option) => !chosen.has(option.value))
      .filter((option) => option.label.toLowerCase().includes(needle))
      .slice(0, 8)
  }, [options, needle, value])

  const exact = options.find((option) => option.label.toLowerCase() === needle)
  const canCreate = Boolean(onCreate) && needle.length > 1 && !exact
  const choices = canCreate ? [...matches, { value: '__create__', label: query.trim(), create: true }] : matches

  function add(optionValue) {
    if (!value.includes(optionValue)) onChange([...value, optionValue])
    setQuery('')
    setActive(0)
  }

  async function choose(choice) {
    if (!choice) return
    if (!choice.create) return add(choice.value)
    setCreating(true)
    try {
      const created = await onCreate(choice.label)
      if (created) add(created)
    } finally {
      setCreating(false)
    }
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((index) => Math.min(index + 1, choices.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' || (event.key === ',' && needle)) {
      if (needle || open) event.preventDefault()
      if (needle) choose(exact && !value.includes(exact.value) ? exact : choices[active])
    } else if (event.key === 'Backspace' && !query && value.length) {
      onChange(value.slice(0, -1))
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const showList = open && (choices.length > 0 || needle)

  return (
    <div className="relative">
      <div className={`flex min-h-11 flex-wrap items-center gap-2 rounded-xl border bg-white px-2 py-1 transition focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200 ${invalid ? 'border-danger' : 'border-border'}`}>
        {value.map((item) => {
          const option = options.find((entry) => entry.value === item)
          return (
            <span key={item} className="inline-flex items-center gap-1 rounded-full bg-brand-100 py-0.5 pl-3 text-sm text-brand-900">
              {option?.label ?? item}
              <button type="button" className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full hover:bg-brand-200" aria-label={`Remove ${option?.label ?? item}`} onClick={() => onChange(value.filter((entry) => entry !== item))}>
                <XMarkIcon className="h-4 w-4" />
              </button>
            </span>
          )
        })}
        <input
          id={id}
          value={query}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-describedby={describedBy}
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
            setActive(0)
          }}
          onFocus={() => {
            clearTimeout(closeTimer.current)
            setOpen(true)
          }}
          onBlur={() => {
            // Typing a name that exists and leaving the box still adds it.
            if (exact && !value.includes(exact.value)) add(exact.value)
            closeTimer.current = setTimeout(() => setOpen(false), 150)
          }}
          onKeyDown={onKeyDown}
          placeholder={value.length ? '' : placeholder}
          className="min-h-11 min-w-[8rem] flex-1 border-0 bg-transparent p-0 text-sm focus:ring-0"
        />
      </div>
      {showList ? (
        <ul id={listId} className="absolute inset-x-0 z-20 mt-1 max-h-60 overflow-auto rounded-2xl border border-border bg-white p-1 shadow-lift" role="listbox">
          {choices.map((choice, index) => (
            <li key={choice.value} role="option" aria-selected={index === active}>
              <button
                type="button"
                disabled={creating}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(choice)}
                className={`flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm ${index === active ? 'bg-brand-50 text-brand-900' : 'hover:bg-brand-50'} ${choice.create ? 'font-medium text-brand-700' : ''}`}
              >
                {choice.create ? <PlusIcon className="h-4 w-4" aria-hidden="true" /> : null}
                {choice.create ? `Add "${choice.label}" as a new ${noun}` : choice.label}
              </button>
            </li>
          ))}
          {!choices.length && needle ? (
            <li className="px-3 py-3 text-sm text-muted">
              No {noun} called &ldquo;{query.trim()}&rdquo;. {createHint}
            </li>
          ) : null}
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
  /** Creates a new option from the typed text and resolves to its value. */
  onCreate: PropTypes.func,
  /** Shown when nothing matches and onCreate isn't available. */
  createHint: PropTypes.node,
  /** What the options are, for messages ("skill"). */
  noun: PropTypes.string,
}
