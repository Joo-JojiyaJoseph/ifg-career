import { useMemo, useState } from 'react'
import { ChevronUpDownIcon } from '@heroicons/react/24/outline'
import {
  columnVisibilityFeature,
  flexRender,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  useTable,
} from '@tanstack/react-table'
import PropTypes from 'prop-types'
import { Button } from './Button'

/**
 * Server-backed table with sorting, selection, column visibility and mobile cards.
 */
export function DataTable({
  columns,
  data,
  sorting,
  onSortingChange,
  rowSelection = {},
  onRowSelectionChange,
  columnVisibility = {},
  onColumnVisibilityChange,
  getRowId,
  renderCard,
  selectable = false,
}) {
  const [columnsOpen, setColumnsOpen] = useState(false)
  const tableColumns = useMemo(() => {
    if (!selectable) return columns
    return [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-border text-brand-600"
            aria-label="Select all rows"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-border text-brand-600"
            aria-label="Select row"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      ...columns,
    ]
  }, [columns, selectable])

  const table = useTable(
    {
      features: {
        rowSortingFeature,
        rowSelectionFeature,
        columnVisibilityFeature,
        rowPaginationFeature,
      },
      data,
      columns: tableColumns,
      getRowId,
      manualSorting: true,
      manualPagination: true,
      enableRowSelection: selectable,
      state: {
        sorting,
        rowSelection,
        columnVisibility,
      },
      onSortingChange: (updater) => onSortingChange(typeof updater === 'function' ? updater(sorting) : updater),
      onRowSelectionChange: (updater) => onRowSelectionChange?.(typeof updater === 'function' ? updater(rowSelection) : updater),
      onColumnVisibilityChange: (updater) =>
        onColumnVisibilityChange?.(typeof updater === 'function' ? updater(columnVisibility) : updater),
    },
    (state) => ({
      sorting: state.sorting,
      rowSelection: state.rowSelection,
      columnVisibility: state.columnVisibility,
    }),
  )

  const hideable = table.getAllLeafColumns().filter((column) => column.getCanHide())

  return (
    <div className="flex flex-col gap-3">
      {hideable.length > 0 ? (
        <div className="relative hidden self-end lg:block">
          <Button variant="secondary" size="sm" onClick={() => setColumnsOpen((open) => !open)} icon={ChevronUpDownIcon}>
            Columns
          </Button>
          {columnsOpen ? (
            <div className="glass absolute right-0 z-20 mt-2 w-56 rounded-2xl p-2">
              {hideable.map((column) => (
                <label key={column.id} className="flex min-h-11 items-center gap-3 px-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-border text-brand-600"
                    checked={column.getIsVisible()}
                    onChange={column.getToggleVisibilityHandler()}
                  />
                  {columnLabel(column)}
                </label>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="hidden overflow-auto rounded-3xl border border-white/70 bg-white/85 shadow-card backdrop-blur-xl lg:block">
        <table className="min-w-full text-left text-sm [&_td_a]:inline-flex [&_td_a]:min-h-11 [&_td_a]:items-center">
          <thead className="sticky top-0 z-10 bg-brand-50/90 backdrop-blur">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getCanSort() ? header.column.getIsSorted() : false
                  return (
                    <th key={header.id} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-muted">
                      {header.column.getCanSort() ? (
                        <button type="button" className="inline-flex min-h-11 items-center gap-1 rounded-lg px-1 -mx-1 uppercase hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" onClick={header.column.getToggleSortingHandler()}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === 'asc' ? ' ↑' : sorted === 'desc' ? ' ↓' : ''}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className={`border-t border-border/70 transition-colors duration-150 hover:bg-brand-50/60 ${row.getIsSelected() ? 'bg-brand-50' : ''}`}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3.5 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones and tablets: cards (two columns on tablets). The checkbox sits in the card's corner. */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:hidden">
        {table.getRowModel().rows.map((row) => (
          <div key={row.id} className={`relative rounded-3xl border bg-white/90 p-4 shadow-card backdrop-blur transition duration-200 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center ${row.getIsSelected() ? 'border-brand-300 ring-2 ring-brand-200' : 'border-white/70'} ${selectable ? 'pr-14' : ''}`}>
            {selectable ? (
              <label className="absolute right-1.5 top-1.5 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full hover:bg-brand-50">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-border text-brand-600"
                  aria-label="Select row"
                  checked={row.getIsSelected()}
                  onChange={row.getToggleSelectedHandler()}
                />
              </label>
            ) : null}
            {renderCard ? renderCard(row.original) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function columnLabel(column) {
  const header = column.columnDef.header
  return typeof header === 'string' ? header : column.id
}

DataTable.propTypes = {
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  sorting: PropTypes.array.isRequired,
  onSortingChange: PropTypes.func.isRequired,
  rowSelection: PropTypes.object,
  onRowSelectionChange: PropTypes.func,
  columnVisibility: PropTypes.object,
  onColumnVisibilityChange: PropTypes.func,
  getRowId: PropTypes.func,
  renderCard: PropTypes.func,
  selectable: PropTypes.bool,
}
