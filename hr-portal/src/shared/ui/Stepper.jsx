import PropTypes from 'prop-types'

/**
 * Numbered steps as a vertical timeline: a number on a connecting line, then the step's name and description.
 * Reads well at every width, even with long descriptions. `compact` uses smaller numbers and tighter spacing.
 */
export function Stepper({ steps, compact = false }) {
  if (!steps?.length) return null

  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const last = index === steps.length - 1
        return (
          <li key={step.name} className={`relative flex last:pb-0 ${compact ? 'gap-3 pb-4' : 'gap-4 pb-6'}`}>
            {last ? null : <span className={`absolute w-0.5 -translate-x-1/2 bg-gradient-to-b from-brand-200 to-brand-100 ${compact ? 'left-4 top-9 h-[calc(100%-2.25rem)]' : 'left-[1.3rem] top-11 h-[calc(100%-2.75rem)]'}`} aria-hidden="true" />}
            <span className={`relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display font-semibold text-white shadow-md shadow-brand-500/25 ${compact ? 'h-8 w-8 text-xs' : 'h-11 w-11 text-sm'}`}>
              {index + 1}
            </span>
            <div className={`min-w-0 ${compact ? 'pt-1' : 'pt-2'}`}>
              <p className={`font-display font-semibold text-ink ${compact ? 'text-sm' : ''}`}>{step.name}</p>
              {step.description ? <p className={`mt-0.5 leading-relaxed text-muted ${compact ? 'text-[13px]' : 'text-sm'}`}>{step.description}</p> : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

Stepper.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ),
  compact: PropTypes.bool,
}
