import PropTypes from 'prop-types'
import { Tabs } from './Tabs'

/**
 * Sections of a long settings-style page. Large screens get a sticky list on the left (with an optional
 * step number, icon and one-line hint per section); smaller screens get the usual scrolling pill tabs.
 * The chosen section's content goes in `children`, on the right.
 */
export function SectionNav({ items, value, onChange, label = 'Sections', children }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start xl:gap-6">
      <div className="min-w-0 lg:hidden">
        <Tabs items={items.map((item) => ({ id: item.id, label: item.step ? `${item.step} · ${item.label}` : item.label, count: item.count }))} value={value} onChange={onChange} label={label} />
      </div>
      <nav className="hidden rounded-2xl border border-white/70 bg-white/70 p-2 shadow-card backdrop-blur lg:sticky lg:top-24 lg:block" aria-label={label}>
        <ul className="flex flex-col gap-0.5" role="tablist" aria-orientation="vertical" aria-label={label}>
          {items.map((item) => {
            const active = item.id === value
            return (
              <li key={item.id} role="presentation">
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onChange(item.id)}
                  className={`group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${active ? 'bg-brand-600 text-white shadow-glow' : 'text-ink hover:bg-brand-50'}`}
                >
                  {item.step ? (
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${active ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-700 group-hover:bg-white'}`} aria-hidden="true">{item.step}</span>
                  ) : item.icon ? (
                    <item.icon className={`h-5 w-5 shrink-0 ${active ? 'text-white' : 'text-brand-600'}`} aria-hidden="true" />
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.label}</span>
                    {item.hint ? <span className={`block truncate text-xs ${active ? 'text-white/75' : 'text-muted'}`}>{item.hint}</span> : null}
                  </span>
                  {item.count !== undefined ? <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white/20' : 'bg-brand-50 text-brand-700'}`}>{item.count}</span> : null}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="flex min-w-0 flex-col gap-6">{children}</div>
    </div>
  )
}

SectionNav.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      /** A step number shown in a circle (for sections that follow the page order). */
      step: PropTypes.number,
      icon: PropTypes.elementType,
      /** A short line under the label on large screens. */
      hint: PropTypes.string,
      count: PropTypes.number,
    }),
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  children: PropTypes.node,
}
