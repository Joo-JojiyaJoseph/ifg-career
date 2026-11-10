import { useMemo } from 'react'
import { ChevronDownIcon, ChevronUpDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import {
  columnVisibilityFeature,
  flexRender,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  useTable,
} from '@tanstack/react-table'
import PropTypes from 'prop-types'

/**
 * Server-backed table with sorting, selection, column visibility and mobile cards.
 * Rows stay on one line (the table scrolls sideways inside its card if needed); choose columns with ColumnsMenu.
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

  return (
    <div className="flex flex-col gap-3">
      <div className="hidden overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-card backdrop-blur-xl lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm [&_td_a]:inline-flex [&_td_a]:min-h-11 [&_td_a]:items-center">
            <thead className="border-b border-border/80 bg-slate-50/80">
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => {
                    const sortable = header.column.getCanSort()
                    const sorted = sortable ? header.column.getIsSorted() : false
                    return (
                      <th
                        key={header.id}
                        aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                        className="whitespace-nowrap px-4 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-muted first:pl-5 last:pr-5"
                      >
                        {sortable ? (
                          <button type="button" className={`group -mx-1 inline-flex min-h-11 items-center gap-1 rounded-lg px-1 uppercase transition hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${sorted ? 'text-brand-700' : ''}`} onClick={header.column.getToggleSortingHandler()}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorted === 'asc' ? <ChevronUpIcon className="h-3.5 w-3.5" aria-hidden="true" /> : sorted === 'desc' ? <ChevronDownIcon className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronUpDownIcon className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-60" aria-hidden="true" />}
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
            <tbody className="divide-y divide-border/60">
              {table.getRowModel().rows.map((row, index) => (
                <tr
                  key={row.id}
                  style={{ '--row-delay': `${Math.min(index, 12) * 25}ms` }}
                  className={`motion-safe:animate-row-in transition-colors duration-150 hover:bg-brand-50/50 ${row.getIsSelected() ? 'bg-brand-50/80' : ''}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-4 py-2.5 align-middle first:pl-5 last:pr-5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phones and tablets: cards (two columns on tablets). The checkbox sits in the card's corner. */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:hidden">
        {table.getRowModel().rows.map((row) => (
          <div key={row.id} className={`relative rounded-2xl border bg-white/90 p-4 shadow-card backdrop-blur transition duration-200 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center ${row.getIsSelected() ? 'border-brand-300 ring-2 ring-brand-200' : 'border-white/70'} ${selectable ? 'pr-14' : ''}`}>
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
