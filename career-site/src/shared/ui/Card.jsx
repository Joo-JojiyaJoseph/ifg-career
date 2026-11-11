import PropTypes from 'prop-types'

const surfaces = {
  solid: 'border border-white bg-card shadow-card',
  glass: 'glass',
  // Near-opaque frosted panel for forms over a dark background: keeps body text fully readable.
  frost: 'border border-white/60 bg-white/[0.92] shadow-lift backdrop-blur-xl backdrop-saturate-150',
}

/** Surface used by both apps. `variant="glass"` for panels over light colour or imagery, `frost` for forms over dark. */
export function Card({ as: Component = 'div', variant = 'solid', className = '', children, ...props }) {
  return (
    <Component className={`rounded-2xl p-5 ${surfaces[variant] ?? surfaces.solid} ${className}`} {...props}>
      {children}
    </Component>
  )
}

Card.propTypes = {
  as: PropTypes.elementType,
  variant: PropTypes.oneOf(['solid', 'glass', 'frost']),
  className: PropTypes.string,
  children: PropTypes.node,
}

/** Page title row used by the portal shell. */
export function PageHeader({ title, subtitle, actions, art }) {
  if (art) {
    // Banner form: a soft glass panel with an illustration on the right (hidden on small screens).
    return (
      <header className="glass relative mb-6 overflow-hidden rounded-3xl p-5 sm:p-8">
        <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-brand-300/30 blur-3xl" aria-hidden="true" />
        <div className="relative flex items-center gap-6">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink min-[380px]:text-3xl sm:text-[2.1rem]">{title}</h1>
            {subtitle ? <p className="mt-2 max-w-xl text-muted">{subtitle}</p> : null}
            {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}
          </div>
          <div className="hidden w-[19rem] shrink-0 lg:block xl:w-[22rem]">{art}</div>
        </div>
      </header>
    )
  }

  return (
    <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink min-[380px]:text-3xl sm:text-[2.1rem]">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-muted">{subtitle}</p> : null}
      </div>
      {/* Buttons keep their text on one line and never squeeze into narrow pills. */}
      {actions ? <div className="flex shrink-0 flex-wrap gap-3 [&>*]:shrink-0 [&>*]:whitespace-nowrap">{actions}</div> : null}
    </header>
  )
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.node,
  actions: PropTypes.node,
  /** Optional illustration; turns the header into a glass banner. */
  art: PropTypes.node,
}
