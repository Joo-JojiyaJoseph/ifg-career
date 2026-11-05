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
        <div className="relative self-end">
          <Button variant="secondary" size="sm" onClick={() => setColumnsOpen((open) => !open)} icon={ChevronUpDownIcon}>
            Columns
          </Button>
          {columnsOpen ? (
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border bg-white p-2 shadow-card">
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

      <div className="hidden overflow-auto rounded-2xl border border-border bg-white md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-brand-50">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getCanSort() ? header.column.getIsSorted() : false
                  return (
                    <th key={header.id} className="px-3 py-3 font-medium text-navy">
                      {header.column.getCanSort() ? (
                        <button type="button" className="min-h-11" onClick={header.column.getToggleSortingHandler()}>
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
              <tr key={row.id} className="border-t border-border">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {table.getRowModel().rows.map((row) => (
          <div key={row.id} className="rounded-2xl border border-border bg-white p-4 shadow-card">
            {selectable ? (
              <label className="mb-2 flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-border text-brand-600"
                  aria-label="Select row"
                  checked={row.getIsSelected()}
                  onChange={row.getToggleSelectedHandler()}
                />
                Select
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
