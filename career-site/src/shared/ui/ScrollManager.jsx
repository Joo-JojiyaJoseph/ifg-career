import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import PropTypes from 'prop-types'

/** Where each history entry was scrolled to, so Back and Forward return to the same place. */
const positions = new Map()

/**
 * Scroll behaviour for page changes:
 * - a new page opens at the top (React Router keeps the old scroll position otherwise);
 * - Back and Forward return to where you were on that page;
 * - a link with #section scrolls to that section;
 * - changing only the query string (filters, sorting, tabs) keeps your place;
 * - `keepScroll(from, to)` can keep the position for other changes, such as opening a modal route.
 */
export function ScrollManager({ keepScroll }) {
  const location = useLocation()
  const navigationType = useNavigationType()
  const previous = useRef(location)

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
  }, [])

  // Keep the current page's position up to date while scrolling, so it is right when we leave
  // (by the time a navigation is noticed, the new page has already replaced the old one).
  const currentKey = useRef(location.key)
  useEffect(() => {
    currentKey.current = location.key
  }, [location.key])
  useEffect(() => {
    const onScroll = () => positions.set(currentKey.current, window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useLayoutEffect(() => {
    const from = previous.current
    previous.current = location
    if (from.pathname === location.pathname && !location.hash) return
    if (keepScroll?.(from.pathname, location.pathname)) return

    if (navigationType === 'POP' && positions.has(location.key)) {
      // The page may still be loading and too short to reach the old position, so keep trying briefly.
      const target = positions.get(location.key)
      let tries = 0
      const restore = () => {
        window.scrollTo(0, target)
        if (Math.abs(window.scrollY - target) > 2 && tries++ < 30) window.setTimeout(restore, 100)
      }
      restore()
      return
    }
    if (location.hash) {
      // The section may render a moment later (lazy pages, loaded content), so try for a short while.
      let tries = 0
      const find = () => {
        const target = document.getElementById(decodeURIComponent(location.hash.slice(1)))
        if (target) target.scrollIntoView({ block: 'start' })
        else if (tries++ < 20) window.setTimeout(find, 100)
      }
      find()
      return
    }
    window.scrollTo(0, 0)
  }, [location, navigationType, keepScroll])

  return null
}

ScrollManager.propTypes = {
  /** Return true to keep the scroll position when moving between these two paths. */
  keepScroll: PropTypes.func,
}
