import PropTypes from 'prop-types'

/**
 * Endless horizontal strip (the list is rendered twice). Pauses on hover and focus;
 * with reduced motion it becomes a normal wrapped row.
 */
export function Marquee({ children, className = '' }) {
  return (
    <div className={`group relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)] ${className}`}>
      <div className="flex w-max gap-10 motion-safe:animate-marquee group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center">
        <div className="flex shrink-0 items-center gap-10">{children}</div>
        <div className="flex shrink-0 items-center gap-10 motion-reduce:hidden" aria-hidden="true" inert>{children}</div>
      </div>
    </div>
  )
}

Marquee.propTypes = { children: PropTypes.node.isRequired, className: PropTypes.string }
