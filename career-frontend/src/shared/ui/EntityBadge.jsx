import PropTypes from 'prop-types'

/**
 * Compact entity name using that entity's accent colour.
 */
export function EntityBadge({ entity }) {
  if (!entity) return null
  const accent = entity.theme?.accent || '#1976D2'

  return (
    <span
      className="inline-flex min-h-8 items-center rounded-full bg-[var(--entity-accent)] px-2.5 py-1 text-xs font-medium text-white"
      style={{ '--entity-accent': accent }}
    >
      {entity.name}
    </span>
  )
}

EntityBadge.propTypes = {
  entity: PropTypes.shape({
    name: PropTypes.string,
    theme: PropTypes.shape({ accent: PropTypes.string }),
  }),
}
