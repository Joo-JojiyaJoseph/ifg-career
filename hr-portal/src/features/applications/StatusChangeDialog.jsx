import PropTypes from 'prop-types'
import { ArrowRightIcon, ArrowsRightLeftIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { StatusBadge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { Modal } from '@shared/ui/Modal'

/**
 * Asks HR to confirm a status change before it is saved: who and which role, the current and the new status side by
 * side, and what the change means. Used for one application (from the candidate page or the list) and for a bulk
 * change (`count` applications).
 */
export function StatusChangeDialog({ open, onClose, onConfirm, loading = false, from, to, candidate, role, count }) {
  const rejecting = to?.value === 'rejected'
  const bulk = typeof count === 'number'
  const label = to?.label ?? ''

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={rejecting ? (bulk ? `Reject ${count} ${count === 1 ? 'application' : 'applications'}?` : 'Reject this application?') : `Move to ${label}?`}
      icon={rejecting ? ExclamationTriangleIcon : ArrowsRightLeftIcon}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={rejecting ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
            {rejecting ? (bulk ? `Reject ${count}` : 'Reject application') : bulk ? `Move ${count} to ${label}` : `Move to ${label}`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {bulk ? (
            <p className="text-sm font-semibold text-ink">{count} selected {count === 1 ? 'application' : 'applications'}</p>
          ) : (
            <>
              <p className="font-semibold text-ink">{candidate}</p>
              {role ? <p className="text-sm text-slate-600">{role}</p> : null}
            </>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {from ? <StatusBadge status={from} /> : <span className="text-sm text-slate-600">Current status</span>}
            <ArrowRightIcon className="h-4 w-4 text-slate-500" aria-label="to" />
            {to ? <StatusBadge status={to.value} /> : null}
          </div>
        </div>
        {rejecting ? (
          <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
            <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            This closes the application. The candidate sees it as closed in My Applications.
          </p>
        ) : null}
        <p className="flex items-start gap-2 text-sm text-slate-600">
          <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          The candidate is not emailed about status changes. You can undo this from the message that appears.
        </p>
      </div>
    </Modal>
  )
}

StatusChangeDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  /** The current status value, e.g. "shortlisted" (left out for a bulk change). */
  from: PropTypes.string,
  /** The new status: { value, label }. */
  to: PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired }),
  candidate: PropTypes.string,
  role: PropTypes.string,
  /** For a bulk change: how many applications. */
  count: PropTypes.number,
}
