import { LazyMotion, domAnimation, m } from 'framer-motion'
import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { fade, fadeUp, usePrefersReducedMotion } from './motionPresets'

export function MotionProvider({ children }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>
}

MotionProvider.propTypes = { children: PropTypes.node }

export function Reveal({ children, className = '' }) {
  const reduced = usePrefersReducedMotion()
  return (
    <m.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={reduced ? fade : fadeUp}
    >
      {children}
    </m.div>
  )
}

Reveal.propTypes = { children: PropTypes.node, className: PropTypes.string }

export function PageTransition({ children }) {
  const reduced = usePrefersReducedMotion()
  return (
    <m.div initial="hidden" animate="visible" variants={reduced ? fade : fadeUp}>
      {children}
    </m.div>
  )
}

PageTransition.propTypes = { children: PropTypes.node }

export function AnimatedNumber({ value }) {
  const reduced = usePrefersReducedMotion()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (reduced) return undefined
    const start = performance.now()
    let frame = 0
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / 600)
      setDisplay(Math.round(value * progress))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [reduced, value])

  return <span>{reduced ? value : display}</span>
}

AnimatedNumber.propTypes = { value: PropTypes.number.isRequired }
