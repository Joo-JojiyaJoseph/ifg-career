import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import PropTypes from 'prop-types'
import { Select } from './Select'

/**
 * Server-side page controls with a page-size choice.
 */
export function Pagination({ page, pageCount, perPage, perPageOptions = [25, 50, 100], onPageChange, onPerPageChange }) {
  const pages = Math.max(pageCount, 1)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="w-36">
        <Select
          value={String(perPage)}
          onChange={(value) => onPerPageChange(Number(value))}
          options={perPageOptions.map((size) => ({ value: String(size), label: `${size} per page` }))}
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white shadow-card disabled:opacity-40"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <span className="min-w-24 text-center text-sm text-muted">
          Page {page} of {pages}
        </span>
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white shadow-card disabled:opacity-40"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  pageCount: PropTypes.number.isRequired,
  perPage: PropTypes.number.isRequired,
  perPageOptions: PropTypes.arrayOf(PropTypes.number),
  onPageChange: PropTypes.func.isRequired,
  onPerPageChange: PropTypes.func.isRequired,
}
