import PropTypes from 'prop-types'
import { AnimatePresence, m } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { usePrefersReducedMotion } from './motionPresets'

/**
 * Floating bar for bulk actions. It slides up from the bottom while rows are selected and shows how many,
 * the actions passed as children, and a button to clear the selection. On phones it sits above the tab bar.
 */
export function SelectionBar({ count, noun = 'item', onClear, children }) {
  const reduced = usePrefersReducedMotion()
  const motion = reduced ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 24 } }

  return (
    <AnimatePresence>
      {count > 0 ? (
        <m.div
          key="selection"
          {...motion}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          role="region"
          aria-label="Bulk actions"
          className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-3xl flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-ink/95 p-2 pl-4 text-white shadow-lift backdrop-blur-xl md:bottom-6"
        >
          <p className="mr-auto text-sm font-medium" aria-live="polite">
            <span className="mr-1 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-white/15 px-2 text-sm font-semibold">{count}</span>{' '}
            {count === 1 ? noun : `${noun}s`} selected
          </p>
          <div className="flex flex-wrap items-center gap-2">{children}</div>
          <button
            type="button"
            onClick={onClear}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Clear selection"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </m.div>
      ) : null}
    </AnimatePresence>
  )
}

SelectionBar.propTypes = {
  count: PropTypes.number.isRequired,
  /** What is selected, singular ("role"). */
  noun: PropTypes.string,
  onClear: PropTypes.func.isRequired,
  children: PropTypes.node,
}
