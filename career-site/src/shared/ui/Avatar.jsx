import { useState } from 'react'
import PropTypes from 'prop-types'

const palette = ['bg-brand-600', 'bg-teal', 'bg-violet', 'bg-cyan', 'bg-amber', 'bg-navy']

function initialsFrom(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?'
}

function colourFor(name = '') {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return palette[hash % palette.length]
}

const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-base' }

/**
 * Round avatar: the Google photo when there is one, otherwise initials in a colour taken from the name.
 */
export function Avatar({ name, src, initials, size = 'md' }) {
  const [failed, setFailed] = useState(false)
  const classes = `inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ${sizes[size]}`

  if (src && !failed) {
    return <img src={src} alt="" className={`${classes} object-cover`} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
  }

  return (
    <span className={`${classes} ${colourFor(name)}`} aria-hidden="true">
      {initials || initialsFrom(name)}
    </span>
  )
}

Avatar.propTypes = {
  name: PropTypes.string,
  src: PropTypes.string,
  initials: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
}
