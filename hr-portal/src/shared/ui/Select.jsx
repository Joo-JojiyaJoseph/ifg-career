import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { ChevronUpDownIcon } from '@heroicons/react/24/outline'
import PropTypes from 'prop-types'

/**
 * Accessible select built on Headless UI Listbox.
 */
export function Select({ id, value, onChange, options, placeholder = 'Select', invalid = false, describedBy }) {
  const selected = options.find((option) => option.value === value) ?? null

  return (
    <Listbox value={value ?? ''} onChange={onChange}>
      <ListboxButton
        id={id}
        aria-describedby={describedBy}
        className={`flex min-h-11 w-full items-center justify-between rounded-xl border bg-white px-3 text-left ${invalid ? 'border-danger' : 'border-border'}`}
      >
        <span className={selected ? 'text-text' : 'text-muted'}>{selected?.label ?? placeholder}</span>
        <ChevronUpDownIcon className="h-5 w-5 text-muted" aria-hidden="true" />
      </ListboxButton>
      <ListboxOptions
        anchor="bottom start"
        modal={false}
        portal
        className="z-50 max-h-60 w-max min-w-[max(11rem,var(--button-width))] overflow-auto rounded-xl border border-border bg-white p-1 shadow-card [--anchor-gap:4px] focus:outline-none"
      >
        {options.map((option) => (
          <ListboxOption
            key={option.value}
            value={option.value}
            className="cursor-pointer whitespace-nowrap rounded-lg px-3 py-2 data-[focus]:bg-brand-50"
          >
            {option.label}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  )
}

Select.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  placeholder: PropTypes.string,
  invalid: PropTypes.bool,
  describedBy: PropTypes.string,
}
