import { useMotionValue, useSpring, useTransform } from 'framer-motion'
import { usePrefersReducedMotion } from './motionPresets'

/**
 * A gentle 3D tilt that follows the mouse over a card. Spread `handlers` on the element and pass `style`
 * to a framer-motion element. Touch screens and reduced motion get no tilt.
 */
export function useTilt(max = 6) {
  const reduced = usePrefersReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 180, damping: 18 })
  const springY = useSpring(y, { stiffness: 180, damping: 18 })
  const rotateY = useTransform(springX, [-0.5, 0.5], [-max, max])
  const rotateX = useTransform(springY, [-0.5, 0.5], [max, -max])

  if (reduced) return { style: {}, handlers: {} }

  return {
    style: { rotateX, rotateY, transformPerspective: 900 },
    handlers: {
      onPointerMove(event) {
        if (event.pointerType !== 'mouse') return
        const box = event.currentTarget.getBoundingClientRect()
        x.set((event.clientX - box.left) / box.width - 0.5)
        y.set((event.clientY - box.top) / box.height - 0.5)
      },
      onPointerLeave() {
        x.set(0)
        y.set(0)
      },
    },
  }
}
