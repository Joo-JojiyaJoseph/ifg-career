import PropTypes from 'prop-types'

/**
 * Vertical list of dated events: notes, blocks and audit activity.
 */
export function Timeline({ items }) {
  if (!items.length) return null

  return (
    <ol className="flex flex-col gap-4">
      {items.map((item) => (
        <li key={item.key} className="border-l-2 border-brand-100 pl-4">
          <p className="text-sm font-medium text-navy">{item.title}</p>
          {item.meta ? <p className="text-sm text-muted">{item.meta}</p> : null}
          {item.body ? <p className="mt-1 whitespace-pre-wrap text-sm text-text">{item.body}</p> : null}
        </li>
      ))}
    </ol>
  )
}

Timeline.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    meta: PropTypes.string,
    body: PropTypes.string,
  })).isRequired,
}
