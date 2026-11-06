import { XMarkIcon } from '@heroicons/react/24/outline'
import PropTypes from 'prop-types'
import { Button } from './Button'

/**
 * Removable labels for the filters currently applied, plus Clear all.
 */
export function FilterChips({ chips, onClear }) {
  if (!chips.length) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-3 text-sm text-navy shadow-card"
        >
          {chip.label}
          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Remove</span>
        </button>
      ))}
      <Button variant="ghost" onClick={onClear}>
        Clear all
      </Button>
    </div>
  )
}

FilterChips.propTypes = {
  chips: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      onRemove: PropTypes.func.isRequired,
    }),
  ).isRequired,
  onClear: PropTypes.func.isRequired,
}
