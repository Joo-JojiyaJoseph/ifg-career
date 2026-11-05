import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import PropTypes from 'prop-types'

export function Modal({ open, onClose, title, children }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-navy/40 transition duration-200" />
      <div className="fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <DialogPanel className="max-h-[100dvh] w-full max-w-lg overflow-auto rounded-t-2xl bg-white p-6 shadow-card sm:rounded-2xl">
          <div className="mb-4 flex items-start justify-between gap-4">
            <DialogTitle className="font-display text-xl text-navy">{title}</DialogTitle>
            <button type="button" className="min-h-11 min-w-11 rounded-full text-muted" onClick={onClose} aria-label="Close">
              <XMarkIcon className="mx-auto h-5 w-5" />
            </button>
          </div>
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  )
}

Modal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
}

export function SlideOver({ open, onClose, title, children }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-navy/40" />
      <div className="fixed inset-0 flex justify-end">
        <DialogPanel className="flex h-full w-full max-w-md flex-col bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <DialogTitle className="font-display text-lg text-navy">{title}</DialogTitle>
            <button type="button" className="min-h-11 min-w-11 rounded-full" onClick={onClose} aria-label="Close">
              <XMarkIcon className="mx-auto h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">{children}</div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

SlideOver.propTypes = Modal.propTypes
