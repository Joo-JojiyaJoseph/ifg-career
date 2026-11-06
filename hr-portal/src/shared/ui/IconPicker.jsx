import PropTypes from 'prop-types'
import { heroiconMap } from './heroiconMap'

/**
 * Grid of curated Heroicons. Stores the icon's name, e.g. "HeartIcon".
 */
export function IconPicker({ id, value, onChange }) {
  return (
    <div id={id} role="radiogroup" aria-label="Icon" className="grid grid-cols-6 gap-2 sm:grid-cols-7">
      {Object.entries(heroiconMap).map(([name, Icon]) => {
        const active = name === value
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={name.replace(/Icon$/, '').replace(/([a-z])([A-Z0-9])/g, '$1 $2')}
            title={name.replace(/Icon$/, '')}
            onClick={() => onChange(name)}
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition duration-150 ${active ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-500/40' : 'border-border text-navy hover:bg-brand-50'}`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}

IconPicker.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
}
