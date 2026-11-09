import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline'
import PropTypes from 'prop-types'
import { Button } from './Button'
import { FilterPanelContext } from './filterPanelContext'

/**
 * The side panel that holds a page's filters. Filters stack in one column;
 * "Clear all" and the apply button stay pinned at the bottom.
 */
export function FilterPanel({ open, onClose, onApply, onClear, applyLabel = 'Show results', activeCount = 0, children }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop transition className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition duration-200 data-[closed]:opacity-0" />
      <div className="fixed inset-0 flex justify-end">
        <DialogPanel transition className="flex h-full w-full max-w-md flex-col border-l border-white/70 bg-white/95 shadow-lift backdrop-blur-xl transition duration-[250ms] ease-out data-[closed]:translate-x-full">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
            <DialogTitle className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
              <AdjustmentsHorizontalIcon className="h-5 w-5 text-brand-600" aria-hidden="true" />
              Filters
              {activeCount ? <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">{activeCount}</span> : null}
            </DialogTitle>
            <button type="button" className="min-h-11 min-w-11 rounded-full text-muted transition hover:bg-brand-50 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" onClick={onClose} aria-label="Close filters">
              <XMarkIcon className="mx-auto h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
            <FilterPanelContext.Provider value>{children}</FilterPanelContext.Provider>
          </div>
          <div className="flex shrink-0 gap-2 border-t border-border/70 bg-brand-50/50 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {onClear ? <Button variant="secondary" className="flex-1" onClick={onClear}>Clear all</Button> : null}
            <Button className="flex-[2]" onClick={onApply ?? onClose}>{applyLabel}</Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

FilterPanel.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  /** Applies the filters chosen in the panel; defaults to closing it (for live filters). */
  onApply: PropTypes.func,
  onClear: PropTypes.func,
  applyLabel: PropTypes.node,
  activeCount: PropTypes.number,
  children: PropTypes.node,
}
