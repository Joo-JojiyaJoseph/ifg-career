import PropTypes from 'prop-types'

const palettes = {
  dark: ['bg-brand-500/50', 'bg-cyan/35', 'bg-violet/30'],
  light: ['bg-brand-500/15', 'bg-cyan/15', 'bg-violet/10'],
}

/**
 * Slowly drifting colour fields behind glass surfaces. Decorative only.
 * CSS keyframes (transform only), paused automatically for reduced motion.
 */
export function Aurora({ tone = 'dark', className = '' }) {
  const [a, b, c] = palettes[tone]

  return (
    <div className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`} aria-hidden="true">
      <div className={`absolute -left-[10%] -top-[30%] h-[70%] w-[60%] rounded-full blur-3xl motion-safe:animate-aurora ${a}`} />
      <div className={`absolute -right-[15%] top-[10%] h-[65%] w-[55%] rounded-full blur-3xl motion-safe:animate-aurora-slow ${b}`} />
      <div className={`absolute bottom-[-35%] left-[25%] h-[60%] w-[50%] rounded-full blur-3xl motion-safe:animate-aurora ${c} [animation-delay:-12s]`} />
    </div>
  )
}

Aurora.propTypes = { tone: PropTypes.oneOf(['dark', 'light']), className: PropTypes.string }
