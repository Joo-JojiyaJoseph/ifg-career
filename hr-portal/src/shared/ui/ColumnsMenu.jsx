import PropTypes from 'prop-types'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { ViewColumnsIcon } from '@heroicons/react/24/outline'

/**
 * Show or hide a table's columns. Sits in the list toolbar (large screens only, where the table shows).
 * Reads the same column definitions the DataTable uses; columns with `enableHiding: false` stay fixed.
 */
export function ColumnsMenu({ columns, visibility = {}, onChange }) {
  const hideable = columns.filter((column) => column.enableHiding !== false && typeof column.header === 'string' && column.header)
  if (!hideable.length) return null
  const idOf = (column) => column.id ?? column.accessorKey
  const hidden = hideable.filter((column) => visibility[idOf(column)] === false).length

  return (
    <Popover className="relative hidden lg:block">
      <PopoverButton className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-medium text-ink transition duration-200 hover:border-brand-200 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 data-[open]:border-brand-200 data-[open]:bg-brand-50">
        <ViewColumnsIcon className="h-5 w-5" aria-hidden="true" />
        Columns
        {hidden ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-muted">{hidden} hidden</span> : null}
      </PopoverButton>
      <PopoverPanel
        anchor={{ to: 'bottom end', gap: 8, padding: 12 }}
        transition
        className="z-[60] w-60 rounded-2xl border border-border bg-white p-2 shadow-lift transition duration-200 ease-out focus:outline-none data-[closed]:translate-y-1 data-[closed]:opacity-0"
      >
        <p className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted">Show columns</p>
        {hideable.map((column) => {
          const id = idOf(column)
          return (
            <label key={id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 text-sm hover:bg-brand-50">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-border text-brand-600"
                checked={visibility[id] !== false}
                onChange={(event) => onChange({ ...visibility, [id]: event.target.checked })}
              />
              {column.header}
            </label>
          )
        })}
      </PopoverPanel>
    </Popover>
  )
}

ColumnsMenu.propTypes = {
  /** The same column definitions passed to DataTable. */
  columns: PropTypes.array.isRequired,
  visibility: PropTypes.object,
  onChange: PropTypes.func.isRequired,
}
