import { useState } from 'react'
import PropTypes from 'prop-types'

const WIDTHS = [480, 800, 1200, 1600, 2000]

/** Unsplash and other image CDNs that resize with a `w` query parameter get a responsive srcset. */
function srcSetFor(src) {
  if (!src || !/^https:\/\/images\.unsplash\.com\//.test(src)) return undefined
  const url = new URL(src)
  return WIDTHS.map((width) => {
    url.searchParams.set('w', String(width))
    return `${url.toString()} ${width}w`
  }).join(', ')
}

/**
 * A photo that fades in once it has loaded and falls back to a brand gradient when it is missing or fails.
 * The wrapper sets the size and shape (`className`); the image always covers it.
 * Pass `priority` for the first photo on a page so it loads straight away.
 */
export function Photo({ src, alt = '', className = '', imgClassName = '', sizes = '100vw', priority = false }) {
  const [state, setState] = useState('loading')
  const show = src && state !== 'error'

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-brand-700 via-navy to-ink ${className}`}>
      {show ? (
        <img
          key={src}
          src={src}
          srcSet={srcSetFor(src)}
          sizes={sizes}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${state === 'loaded' ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        />
      ) : null}
    </div>
  )
}

Photo.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  className: PropTypes.string,
  /** Extra classes for the <img>, for example an animation. */
  imgClassName: PropTypes.string,
  sizes: PropTypes.string,
  priority: PropTypes.bool,
}
