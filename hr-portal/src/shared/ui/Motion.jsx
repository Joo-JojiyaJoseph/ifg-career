import { LazyMotion, domAnimation, m, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { fade, fadeUp, riseIn, staggerParent, usePrefersReducedMotion } from './motionPresets'

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

/**
 * A list whose children rise in one after another when it scrolls into view.
 * Use StaggerItem for each child. Under reduced motion the items simply fade.
 */
export function Stagger({ children, className = '', as = 'div' }) {
  const Tag = as === 'ul' ? m.ul : as === 'ol' ? m.ol : m.div
  return (
    <Tag className={className} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} variants={staggerParent}>
      {children}
    </Tag>
  )
}

Stagger.propTypes = { children: PropTypes.node, className: PropTypes.string, as: PropTypes.oneOf(['div', 'ul', 'ol']) }

export function StaggerItem({ children, className = '', as = 'div', ...rest }) {
  const reduced = usePrefersReducedMotion()
  const Tag = as === 'li' ? m.li : as === 'article' ? m.article : m.div
  return (
    <Tag className={className} variants={reduced ? fade : riseIn} {...rest}>
      {children}
    </Tag>
  )
}

StaggerItem.propTypes = { children: PropTypes.node, className: PropTypes.string, as: PropTypes.oneOf(['div', 'li', 'article']) }

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
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (reduced || !inView) return undefined
    const start = performance.now()
    let frame = 0
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / 900)
      const eased = 1 - (1 - progress) ** 3
      setDisplay(Math.round(value * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [reduced, inView, value])

  return <span ref={ref} className="tabular-nums">{(reduced ? value : display).toLocaleString('en-IN')}</span>
}

AnimatedNumber.propTypes = { value: PropTypes.number.isRequired }
