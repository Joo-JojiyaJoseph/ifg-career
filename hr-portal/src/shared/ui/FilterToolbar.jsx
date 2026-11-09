import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import PropTypes from 'prop-types'
import { Select } from './Select'

/**
 * One tidy row above a list: search, up to two quick filters (large screens), and a Filters button
 * that shows how many filters are on. Everything else lives in the FilterPanel.
 */
export function FilterToolbar({ search, quick, activeCount = 0, onOpen }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">{search}</div>
      {quick ? <div className="hidden shrink-0 items-center gap-2 lg:flex">{quick}</div> : null}
      <button
        type="button"
        onClick={onOpen}
        className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border px-5 text-sm font-medium transition duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${activeCount ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-border bg-white text-ink hover:bg-brand-50'}`}
      >
        <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden="true" />
        Filters
        {activeCount ? <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">{activeCount}<span className="sr-only"> on</span></span> : null}
      </button>
    </div>
  )
}

FilterToolbar.propTypes = {
  search: PropTypes.node,
  quick: PropTypes.node,
  activeCount: PropTypes.number,
  onOpen: PropTypes.func.isRequired,
}

/** A compact select for the toolbar: no visible label (it has a screen-reader label instead). */
export function QuickFilter({ id, label, value, onChange, options }) {
  return (
    <div className="w-44">
      <label htmlFor={id} className="sr-only">{label}</label>
      <Select id={id} value={value} onChange={onChange} options={options} />
    </div>
  )
}

QuickFilter.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.array.isRequired,
}
