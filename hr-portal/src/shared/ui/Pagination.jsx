import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import PropTypes from 'prop-types'
import { Select } from './Select'

/** Page numbers to show: the first, the last and the ones around the current page, with gaps as null. */
function pageWindow(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1)
  const around = [page - 1, page, page + 1].filter((value) => value > 1 && value < pages)
  const list = [1, ...(around[0] > 2 ? [null] : []), ...around, ...(around[around.length - 1] < pages - 1 ? [null] : []), pages]
  return list
}

const arrow =
  'inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-ink transition duration-200 hover:border-brand-200 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-40'

/**
 * Server-side page controls: rows per page and "1–25 of 60" on the left, numbered pages on the right.
 * Phones show "Page 2 of 5" between the arrows instead of the numbers.
 */
export function Pagination({ page, pageCount, perPage, perPageOptions = [25, 50, 100], onPageChange, onPerPageChange, total }) {
  const pages = Math.max(pageCount, 1)
  const from = total ? (page - 1) * perPage + 1 : 0
  const to = total ? Math.min(page * perPage, total) : 0

  return (
    <nav className="flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/70 px-3 py-2.5 shadow-card backdrop-blur sm:flex-row sm:items-center sm:justify-between" aria-label="Pages">
      <div className="flex items-center gap-3">
        <div className="w-36">
          <Select
            value={String(perPage)}
            onChange={(value) => onPerPageChange(Number(value))}
            options={perPageOptions.map((size) => ({ value: String(size), label: `${size} per page` }))}
          />
        </div>
        {total !== undefined ? (
          <p className="text-sm text-muted" aria-live="polite">
            {total ? (
              <>
                <span className="font-medium text-ink">{from}–{to}</span> of {total}
              </>
            ) : (
              'Nothing to show'
            )}
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-1.5 sm:justify-end">
        <button type="button" className={arrow} onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <span className="min-w-24 text-center text-sm text-muted sm:hidden">
          Page {page} of {pages}
        </span>
        <ul className="hidden items-center gap-1 sm:flex">
          {pageWindow(page, pages).map((value, index) =>
            value === null ? (
              <li key={`gap-${index}`} className="w-6 text-center text-sm text-muted" aria-hidden="true">…</li>
            ) : (
              <li key={value}>
                <button
                  type="button"
                  onClick={() => onPageChange(value)}
                  aria-current={value === page ? 'page' : undefined}
                  aria-label={`Page ${value} of ${pages}`}
                  className={`inline-flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${value === page ? 'bg-brand-600 text-white shadow-glow' : 'text-ink hover:bg-brand-50'}`}
                >
                  {value}
                </button>
              </li>
            ),
          )}
        </ul>
        <button type="button" className={arrow} onClick={() => onPageChange(page + 1)} disabled={page >= pages} aria-label="Next page">
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </nav>
  )
}

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  pageCount: PropTypes.number.isRequired,
  perPage: PropTypes.number.isRequired,
  perPageOptions: PropTypes.arrayOf(PropTypes.number),
  onPageChange: PropTypes.func.isRequired,
  onPerPageChange: PropTypes.func.isRequired,
  /** Total rows across all pages; shows "1–25 of 60". */
  total: PropTypes.number,
}
