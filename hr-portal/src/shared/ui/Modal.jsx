import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import PropTypes from 'prop-types'

export function Modal({ open, onClose, title, children }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop transition className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition duration-200 data-[closed]:opacity-0" />
      <div className="fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <DialogPanel transition className="max-h-[100dvh] w-full max-w-lg overflow-auto rounded-t-3xl border border-white/70 bg-white/95 p-6 shadow-lift backdrop-blur-xl transition duration-200 ease-out data-[closed]:translate-y-6 data-[closed]:opacity-0 sm:rounded-3xl sm:data-[closed]:translate-y-0 sm:data-[closed]:scale-95">
          <div className="mb-4 flex items-start justify-between gap-4">
            <DialogTitle className="font-display text-xl font-semibold tracking-tight text-ink">{title}</DialogTitle>
            <button type="button" className="min-h-11 min-w-11 rounded-full text-muted transition duration-200 hover:rotate-90 hover:bg-brand-50 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" onClick={onClose} aria-label="Close">
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
      <DialogBackdrop transition className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition duration-200 data-[closed]:opacity-0" />
      <div className="fixed inset-0 flex justify-end">
        <DialogPanel transition className="flex h-full w-full max-w-md flex-col border-l border-white/70 bg-white/95 shadow-lift backdrop-blur-xl transition duration-[250ms] ease-out data-[closed]:translate-x-full">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <DialogTitle className="font-display text-lg font-semibold text-ink">{title}</DialogTitle>
            <button type="button" className="min-h-11 min-w-11 rounded-full transition duration-200 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" onClick={onClose} aria-label="Close">
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
