import PropTypes from 'prop-types'

/**
 * Pill tabs with optional counts. Controlled: pass `value` and `onChange`.
 */
export function Tabs({ items, value, onChange, label = 'Sections' }) {
  return (
    <div className="no-scrollbar max-w-full overflow-x-auto">
      <div className="glass inline-flex gap-1 rounded-full p-1 shadow-sm" role="tablist" aria-label={label}>
        {items.map((item) => {
          const active = item.id === value
          return (
            <button
              key={item.id || 'all'}
              type="button"
              role="tab"
              aria-selected={active}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition duration-200 ${active ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/30' : 'text-navy hover:bg-white/80'} focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500`}
              onClick={() => onChange(item.id)}
            >
              {item.icon ? <item.icon className="h-4 w-4" aria-hidden="true" /> : null}
              {item.label}
              {item.count !== undefined ? (
                <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white/20' : 'bg-brand-50 text-brand-700'}`}>{item.count}</span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

Tabs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      count: PropTypes.number,
      icon: PropTypes.elementType,
    }),
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
}
