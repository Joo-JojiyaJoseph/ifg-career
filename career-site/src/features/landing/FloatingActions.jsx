import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { AnimatePresence, m } from 'framer-motion'
import { BriefcaseIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { usePrefersReducedMotion } from '@shared/ui/motionPresets'

/**
 * On the home page, a bottom bar for phones with the two main actions, once you scroll past the hero.
 * It hides while Quick Apply is on screen. (Back to top is the shared BackToTop button.)
 */
export function FloatingActions({ home }) {
  const reduced = usePrefersReducedMotion()
  const [past, setPast] = useState(false)
  const [quickApplyVisible, setQuickApplyVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > window.innerHeight * 0.8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const target = document.getElementById('quick-apply')
    if (!home || !target || !('IntersectionObserver' in window)) return undefined
    const observer = new IntersectionObserver(([entry]) => setQuickApplyVisible(entry.isIntersecting), { threshold: 0.05 })
    observer.observe(target)
    return () => observer.disconnect()
  }, [home])

  const motion = (from) => (reduced ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } } : { initial: { opacity: 0, ...from }, animate: { opacity: 1, x: 0, y: 0 }, exit: { opacity: 0, ...from }, transition: { duration: 0.2 } })
  const showBar = home && past && !quickApplyVisible

  return (
    <>
      <AnimatePresence>
        {showBar ? (
          <m.nav key="bar" {...motion({ y: 80 })} aria-label="Quick actions" className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-2 gap-2 rounded-[1.4rem] border border-white/70 bg-white/85 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lift backdrop-blur-xl sm:hidden">
            <Link to="/jobs" viewTransition className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-500 text-sm font-semibold text-white">
              <BriefcaseIcon className="h-5 w-5" aria-hidden="true" />Search jobs
            </Link>
            <a href="#quick-apply" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-brand-50 text-sm font-semibold text-brand-700">
              <PaperAirplaneIcon className="h-5 w-5" aria-hidden="true" />Quick Apply
            </a>
          </m.nav>
        ) : null}
      </AnimatePresence>
    </>
  )
}

FloatingActions.propTypes = { home: PropTypes.bool }
