import PropTypes from 'prop-types'

/** White surface used by both apps. */
export function Card({ as: Component = 'div', className = '', children, ...props }) {
  return (
    <Component className={`rounded-2xl border border-border bg-card p-5 shadow-card ${className}`} {...props}>
      {children}
    </Component>
  )
}

Card.propTypes = {
  as: PropTypes.elementType,
  className: PropTypes.string,
  children: PropTypes.node,
}

/** Page title row used by the portal shell. */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold text-navy">{title}</h1>
        {subtitle ? <p className="mt-1 text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  )
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.node,
  actions: PropTypes.node,
}
