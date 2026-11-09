import PropTypes from 'prop-types'

/**
 * Numbered steps as a vertical timeline: a number on a connecting line, then the step's name and description.
 * Reads well at every width, even with long descriptions.
 */
export function Stepper({ steps }) {
  if (!steps?.length) return null

  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const last = index === steps.length - 1
        return (
          <li key={step.name} className="relative flex gap-4 pb-6 last:pb-0">
            {last ? null : <span className="absolute left-[1.3rem] top-11 h-[calc(100%-2.75rem)] w-0.5 -translate-x-1/2 bg-gradient-to-b from-brand-200 to-brand-100" aria-hidden="true" />}
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display text-sm font-semibold text-white shadow-md shadow-brand-500/25">
              {index + 1}
            </span>
            <div className="min-w-0 pt-2">
              <p className="font-display font-semibold text-ink">{step.name}</p>
              {step.description ? <p className="mt-1 text-sm leading-relaxed text-muted">{step.description}</p> : null}
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
}
