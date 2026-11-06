import { useEffect, useState } from 'react'
import { ArrowUpIcon } from '@heroicons/react/24/outline'
import { usePrefersReducedMotion } from './motionPresets'

/** Floating glass button that appears after scrolling down a long page and returns to the top. */
export function BackToTop() {
  const [show, setShow] = useState(false)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 900)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })}
      className={`glass fixed bottom-24 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full text-brand-700 transition duration-200 hover:-translate-y-0.5 hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:bottom-6 md:right-6 ${show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}
      aria-label="Back to top"
      tabIndex={show ? 0 : -1}
      aria-hidden={show ? undefined : 'true'}
    >
      <ArrowUpIcon className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}
