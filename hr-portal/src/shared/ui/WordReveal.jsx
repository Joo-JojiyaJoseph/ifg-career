import PropTypes from 'prop-types'
import { m } from 'framer-motion'
import { usePrefersReducedMotion } from './motionPresets'

/**
 * Headline whose words rise into place one after another. Screen readers get the plain sentence.
 */
export function WordReveal({ text, as: Tag = 'h1', className = '', delay = 0 }) {
  const reduced = usePrefersReducedMotion()
  const words = String(text).split(' ')

  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} aria-hidden="true">
          <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <m.span
              className="inline-block"
              initial={reduced ? false : { y: '105%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              transition={{ duration: 0.7, delay: delay + index * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              {word}
            </m.span>
          </span>
          {index < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  )
}

WordReveal.propTypes = { text: PropTypes.string.isRequired, as: PropTypes.elementType, className: PropTypes.string, delay: PropTypes.number }
