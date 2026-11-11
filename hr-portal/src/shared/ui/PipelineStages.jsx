import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { m } from 'framer-motion'
import { AnimatedNumber } from './Motion'
import { usePrefersReducedMotion } from './motionPresets'

/**
 * Hiring pipeline tiles joined by chevrons. The last stage is solid brand blue.
 * Phones show a two-column grid (the last stage full width), tablets one row of five, laptops add the chevrons.
 */
export function PipelineStages({ stages }) {
  const reduced = usePrefersReducedMotion()

  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:flex lg:items-stretch lg:gap-1">
      {stages.map((stage, index) => {
        const last = index === stages.length - 1
        return (
          <li key={stage.id} className={`flex min-w-0 items-center gap-1 lg:flex-1 ${last ? 'col-span-2 sm:col-span-1' : ''}`}>
            <m.div
              className="w-full"
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07, duration: 0.3, ease: 'easeOut' }}
            >
              <Link
                to={stage.to}
                className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-4 text-center xl:px-4 transition duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${last ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow' : index % 2 ? 'bg-gradient-to-br from-teal-50 to-emerald-100/70 text-navy' : 'bg-gradient-to-br from-brand-50 to-brand-100 text-navy'}`}
              >
                <stage.icon className={`h-6 w-6 ${last ? 'text-white' : 'text-brand-600'}`} aria-hidden="true" />
                <span className="max-w-full truncate text-sm font-medium">{stage.label}</span>
                <span className="font-display text-2xl font-semibold"><AnimatedNumber value={stage.value ?? 0} /></span>
              </Link>
            </m.div>
            {!last ? <ChevronRightIcon className="hidden h-5 w-5 shrink-0 text-brand-500 lg:block" aria-hidden="true" /> : null}
          </li>
        )
      })}
    </ol>
  )
}

PipelineStages.propTypes = {
  stages: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string.isRequired, value: PropTypes.number, icon: PropTypes.elementType.isRequired, to: PropTypes.string.isRequired })).isRequired,
}
