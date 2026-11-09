import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import PropTypes from 'prop-types'

const widths = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  full: 'sm:max-w-6xl',
}

/**
 * A centred dialog (a bottom sheet on phones) for adding, editing and confirming.
 * The header and the optional `footer` (the form's buttons) stay put while the body scrolls,
 * so long forms keep Save in reach. Put `form="<form id>"` on footer buttons to submit a form in the body.
 */
export function Modal({ open, onClose, title, description, icon: Icon, size = 'md', footer, children }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop transition className="fixed inset-0 bg-ink/45 backdrop-blur-sm transition duration-200 data-[closed]:opacity-0" />
      <div className="fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4 lg:p-8">
        <DialogPanel
          transition
          className={`flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-white/70 bg-white/95 shadow-lift backdrop-blur-xl transition duration-200 ease-out data-[closed]:translate-y-6 data-[closed]:opacity-0 sm:max-h-[calc(100dvh-4rem)] sm:rounded-[1.75rem] sm:data-[closed]:translate-y-0 sm:data-[closed]:scale-95 ${widths[size] ?? widths.md}`}
        >
          <div className="relative flex shrink-0 items-start justify-between gap-4 border-b border-border/70 px-5 pb-4 pt-5 sm:px-7">
            <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan via-brand-500 to-violet" aria-hidden="true" />
            <div className="flex min-w-0 items-start gap-3">
              {Icon ? (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 ring-1 ring-brand-100" aria-hidden="true">
                  <Icon className="h-5 w-5" />
                </span>
              ) : null}
              <div className="min-w-0">
                <DialogTitle className="font-display text-xl font-semibold tracking-tight text-ink">{title}</DialogTitle>
                {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
              </div>
            </div>
            <button type="button" className="min-h-11 min-w-11 shrink-0 rounded-full text-muted transition duration-200 hover:rotate-90 hover:bg-brand-50 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" onClick={onClose} aria-label="Close">
              <XMarkIcon className="mx-auto h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">{children}</div>
          {footer ? (
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border/70 bg-brand-50/50 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-end sm:px-7">
              {footer}
            </div>
          ) : null}
        </DialogPanel>
      </div>
    </Dialog>
  )
}

Modal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  /** One line under the title. */
  description: PropTypes.node,
  /** A Heroicon shown beside the title. */
  icon: PropTypes.elementType,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  /** Buttons pinned to the bottom of the dialog. */
  footer: PropTypes.node,
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

SlideOver.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
}
