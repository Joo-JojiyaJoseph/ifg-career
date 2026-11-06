import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { m } from 'framer-motion'
import { AnimatedNumber } from './Motion'
import { usePrefersReducedMotion } from './motionPresets'

/**
 * Hiring pipeline tiles joined by chevrons. The last stage is solid brand blue.
 * Scrolls sideways with snap on small screens.
 */
export function PipelineStages({ stages }) {
  const reduced = usePrefersReducedMotion()

  return (
    <ol className="-mx-1 flex snap-x snap-mandatory items-stretch gap-1 overflow-x-auto px-1 pb-1">
      {stages.map((stage, index) => {
        const last = index === stages.length - 1
        return (
          <li key={stage.id} className="flex shrink-0 snap-start items-center gap-1 lg:min-w-0 lg:flex-1 lg:shrink">
            <m.div
              className="w-full"
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07, duration: 0.3, ease: 'easeOut' }}
            >
              <Link
                to={stage.to}
                className={`flex min-w-[7.5rem] lg:min-w-0 flex-col items-center gap-1 rounded-2xl px-4 py-4 text-center transition duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${last ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow' : index % 2 ? 'bg-gradient-to-br from-teal-50 to-emerald-100/70 text-navy' : 'bg-gradient-to-br from-brand-50 to-brand-100 text-navy'}`}
              >
                <stage.icon className={`h-6 w-6 ${last ? 'text-white' : 'text-brand-600'}`} aria-hidden="true" />
                <span className="truncate text-sm font-medium">{stage.label}</span>
                <span className="font-display text-2xl font-semibold"><AnimatedNumber value={stage.value ?? 0} /></span>
              </Link>
            </m.div>
            {!last ? <ChevronRightIcon className="h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" /> : null}
          </li>
        )
      })}
    </ol>
  )
}

PipelineStages.propTypes = {
  stages: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string.isRequired, value: PropTypes.number, icon: PropTypes.elementType.isRequired, to: PropTypes.string.isRequired })).isRequired,
}
