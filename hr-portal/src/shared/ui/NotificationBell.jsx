import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { BellIcon } from '@heroicons/react/24/outline'
import { m } from 'framer-motion'
import { NotificationItem } from './NotificationItem'
import { usePrefersReducedMotion } from './motionPresets'

/**
 * Bell with an unread badge and a dropdown of the latest notifications. It wiggles once when the count goes up.
 */
export function NotificationBell({ count = 0, items = [], onSelect, onMarkAll, footer }) {
  const reduced = usePrefersReducedMotion()
  const previous = useRef(count)
  const [wiggle, setWiggle] = useState(0)

  useEffect(() => {
    if (count > previous.current) setWiggle((value) => value + 1)
    previous.current = count
  }, [count])

  return (
    <Popover className="relative">
      <PopoverButton className="relative min-h-11 min-w-11 rounded-full bg-white shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label={count ? `Notifications, ${count} unread` : 'Notifications'}>
        <m.span
          key={wiggle}
          className="inline-flex"
          initial={false}
          animate={wiggle && !reduced ? { rotate: [0, -14, 12, -8, 6, 0] } : { rotate: 0 }}
          transition={{ duration: 0.6 }}
        >
          <BellIcon className="mx-auto h-5 w-5 text-brand-700" aria-hidden="true" />
        </m.span>
        {count > 0 ? (
          <m.span
            key={`badge-${count}`}
            initial={reduced ? false : { scale: 0.4 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[0.7rem] font-semibold text-white ring-2 ring-white"
            aria-hidden="true"
          >
            {count > 99 ? '99+' : count}
          </m.span>
        ) : null}
      </PopoverButton>
      <PopoverPanel
        transition
        anchor={{ to: 'bottom end', gap: 8 }}
        className="z-40 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-border bg-white p-2 shadow-card-hover transition duration-200 ease-out data-[closed]:translate-y-1 data-[closed]:opacity-0"
      >
        {({ close }) => (
          <>
            <div className="flex items-center justify-between px-2 py-1">
              <p className="font-display font-semibold text-navy">Notifications</p>
              {count > 0 ? (
                <button type="button" className="min-h-11 rounded-full px-3 text-sm text-brand-700 hover:bg-brand-50" onClick={onMarkAll}>
                  Mark all as read
                </button>
              ) : null}
            </div>
            <div className="max-h-96 overflow-y-auto" aria-live="polite">
              {items.length === 0 ? <p className="px-3 py-8 text-center text-sm text-muted">You are all caught up.</p> : null}
              {items.map((item) => (
                <NotificationItem key={item.id} item={item} compact onSelect={(selected) => { close(); onSelect(selected) }} />
              ))}
            </div>
            {footer ? <div className="border-t border-border px-2 pt-2" onClickCapture={() => close()}>{footer}</div> : null}
          </>
        )}
      </PopoverPanel>
    </Popover>
  )
}

NotificationBell.propTypes = {
  count: PropTypes.number,
  items: PropTypes.array,
  onSelect: PropTypes.func.isRequired,
  onMarkAll: PropTypes.func.isRequired,
  footer: PropTypes.node,
}
