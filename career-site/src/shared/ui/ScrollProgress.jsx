import { m, useScroll, useSpring } from 'framer-motion'
import { usePrefersReducedMotion } from './motionPresets'

/** Thin gradient line at the top of the page that fills as you scroll. */
export function ScrollProgress() {
  const reduced = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 })

  if (reduced) return null

  return <m.div className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gradient-to-r from-brand-500 via-cyan to-accent-orange" style={{ scaleX }} aria-hidden="true" />
}
