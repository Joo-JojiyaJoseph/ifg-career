import { useMemo, useRef, useState } from 'react'
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import PropTypes from 'prop-types'

const CREATE = '__create__'
const rank = (label, needle) => {
  const text = label.toLowerCase()
  return text === needle ? 0 : text.startsWith(needle) ? 1 : 2
}

/**
 * Type-ahead multi select that stores the chosen values as chips.
 * Suggestions open on focus; arrow keys move, Enter picks, Backspace on an empty box removes the last chip.
 * The suggestion list floats above everything (dialogs included) and flips upwards when there is no room below,
 * so it is never cut off by a scrolling container.
 * Pass `onCreate(label)` (returns the new option's value) to offer "Add …" when nothing matches;
 * otherwise `createHint` explains where new options come from.
 */
export function MultiSelect({
  id,
  value = [],
  onChange,
  options,
  placeholder = 'Search and add',
  describedBy,
  invalid = false,
  onCreate,
  createHint,
  noun = 'item',
}) {
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  // Shown while the box has focus; leaving the box closes it (a short delay lets a click on a suggestion land).
  const [open, setOpen] = useState(false)
  const closeTimer = useRef(null)
  const needle = query.trim().toLowerCase()

  const matches = useMemo(() => {
    const chosen = new Set(value)
    return (
      options
        .filter((option) => !chosen.has(option.value))
        .filter((option) => option.label.toLowerCase().includes(needle))
        // An exact name first, then names that start with what was typed, so Enter picks the obvious one.
        .sort((a, b) => rank(a.label, needle) - rank(b.label, needle))
        .slice(0, 8)
    )
  }, [options, needle, value])

  const exact = options.find((option) => option.label.toLowerCase() === needle)
  const canCreate = Boolean(onCreate) && needle.length > 1 && !exact
  const labelOf = (item) => options.find((option) => option.value === item)?.label ?? item

  async function select(next) {
    const added = next.filter((item) => !value.includes(item))
    setQuery('')
    if (!added.includes(CREATE)) return onChange(next.filter((item) => item !== CREATE))
    const label = query.trim()
    setCreating(true)
    try {
      const created = await onCreate(label)
      if (created && !value.includes(created)) onChange([...value, created])
    } finally {
      setCreating(false)
    }
  }

  return (
    <Combobox multiple immediate value={value} onChange={select} disabled={creating}>
      <div
        className={`flex min-h-11 flex-wrap items-center gap-2 rounded-xl border bg-white px-2 py-1 transition focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200 ${invalid ? 'border-danger' : 'border-border'}`}
      >
        {value.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded-full bg-brand-100 py-0.5 pl-3 text-sm text-brand-900"
          >
            {labelOf(item)}
            <button
              type="button"
              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full hover:bg-brand-200"
              aria-label={`Remove ${labelOf(item)}`}
              onClick={() => onChange(value.filter((entry) => entry !== item))}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </span>
        ))}
        <ComboboxInput
          id={id}
          value={query}
          aria-describedby={describedBy}
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            clearTimeout(closeTimer.current)
            setOpen(true)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Backspace' && !query && value.length) onChange(value.slice(0, -1))
            if (event.key === 'Escape') setOpen(false)
            if (event.key === 'ArrowDown') setOpen(true)
          }}
          onBlur={() => {
            // Typing a name that exists and leaving the box still adds it.
            if (exact && !value.includes(exact.value)) onChange([...value, exact.value])
            setQuery('')
            closeTimer.current = setTimeout(() => setOpen(false), 150)
          }}
          placeholder={value.length ? '' : placeholder}
          className="min-h-11 min-w-[8rem] flex-1 border-0 bg-transparent p-0 text-sm focus:ring-0"
        />
      </div>
      {open ? (
        <ComboboxOptions
          static
          modal={false}
          anchor="bottom start"
          className="z-[70] max-h-60 w-[min(24rem,calc(100vw-2rem))] min-w-[var(--input-width)] overflow-auto rounded-2xl border border-border bg-white p-1 shadow-lift [--anchor-gap:6px] [--anchor-max-height:15rem] [--anchor-padding:12px] empty:invisible focus:outline-none"
        >
          {matches.map((option) => (
            <ComboboxOption
              key={option.value}
              value={option.value}
              className="flex min-h-11 cursor-pointer items-center rounded-xl px-3 text-sm data-[focus]:bg-brand-50 data-[focus]:text-brand-900"
            >
              {option.label}
            </ComboboxOption>
          ))}
          {canCreate ? (
            <ComboboxOption
              value={CREATE}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-medium text-brand-700 data-[focus]:bg-brand-50"
            >
              <PlusIcon className="h-4 w-4" aria-hidden="true" />
              {`Add "${query.trim()}" as a new ${noun}`}
            </ComboboxOption>
          ) : null}
          {!matches.length && !canCreate && needle ? (
            <div className="px-3 py-3 text-sm text-muted">
              No {noun} called &ldquo;{query.trim()}&rdquo;. {createHint}
            </div>
          ) : null}
        </ComboboxOptions>
      ) : null}
    </Combobox>
  )
}

MultiSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired }),
  ).isRequired,
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
