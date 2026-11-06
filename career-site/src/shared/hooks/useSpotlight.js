import { useCallback } from 'react'

/**
 * Pointer-follow highlight for elements with the `spotlight` class.
 * Usage: const spot = useSpotlight(); <div className="spotlight" {...spot}>…</div>
 */
export function useSpotlight() {
  const onPointerMove = useCallback((event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty('--spot-x', `${event.clientX - rect.left}px`)
    event.currentTarget.style.setProperty('--spot-y', `${event.clientY - rect.top}px`)
  }, [])

  return { onPointerMove }
}
