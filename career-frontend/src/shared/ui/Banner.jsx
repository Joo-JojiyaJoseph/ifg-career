import PropTypes from 'prop-types'
import { XMarkIcon } from '@heroicons/react/24/outline'

/**
 * Dismissible notice shown above page content.
 */
export function Banner({ children, onDismiss }) {
  return (
    <div className="bg-brand-700 text-white" role="status">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <p className="text-sm">{children}</p>
        <button type="button" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-white/10" aria-label="Dismiss" onClick={onDismiss}>
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

Banner.propTypes = {
  children: PropTypes.node,
  onDismiss: PropTypes.func.isRequired,
}
