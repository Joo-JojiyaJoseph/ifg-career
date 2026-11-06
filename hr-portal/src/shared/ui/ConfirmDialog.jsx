import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import PropTypes from 'prop-types'
import { Button } from './Button'

/**
 * Asks for confirmation before a destructive or publishing action.
 */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', tone = 'danger', loading = false }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-navy/40" />
      <div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center">
        <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card">
          <DialogTitle className="font-display text-xl text-navy">{title}</DialogTitle>
          <p className="mt-2 text-sm text-muted">{message}</p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant={tone === 'danger' ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string,
  tone: PropTypes.oneOf(['danger', 'primary']),
  loading: PropTypes.bool,
}
