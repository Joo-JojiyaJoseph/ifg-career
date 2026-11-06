import { useMemo } from 'react'
import PropTypes from 'prop-types'
import DOMPurify from 'dompurify'

const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'a', 'h2', 'h3', 'h4', 'blockquote', 'hr', 'span']

/**
 * Renders rich text from the API. It is sanitised on save by the API and again here before rendering.
 */
export function SafeHtml({ html, className = '', as: Component = 'div' }) {
  const clean = useMemo(
    () => DOMPurify.sanitize(html ?? '', { ALLOWED_TAGS, ALLOWED_ATTR: ['href', 'target', 'rel'], ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i }),
    [html],
  )

  return <Component className={className} dangerouslySetInnerHTML={{ __html: clean }} />
}

SafeHtml.propTypes = {
  html: PropTypes.string,
  className: PropTypes.string,
  as: PropTypes.elementType,
}
