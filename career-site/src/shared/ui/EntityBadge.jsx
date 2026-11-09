import PropTypes from 'prop-types'

/**
 * Compact entity name using that entity's accent colour.
 */
export function EntityBadge({ entity }) {
  if (!entity) return null
  // The deeper primary colour keeps white text readable in every entity theme.
  const primary = entity.theme?.primary || '#1976D2'

  return (
    <span
      className="inline-flex min-h-8 items-center rounded-full bg-[var(--entity-primary)] px-2.5 py-1 text-xs font-medium text-white"
      style={{ '--entity-primary': primary }}
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
