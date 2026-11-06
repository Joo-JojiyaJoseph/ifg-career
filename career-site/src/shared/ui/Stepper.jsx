import PropTypes from 'prop-types'

/**
 * Horizontal steps from the md breakpoint, stacked below it.
 */
export function Stepper({ steps }) {
  if (!steps?.length) return null

  return (
    <ol className="flex flex-col gap-4 md:flex-row md:gap-2">
      {steps.map((step, index) => (
        <li key={step.name} className="flex flex-1 gap-3 md:flex-col">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
            {index + 1}
          </span>
          <span>
            <span className="block font-medium text-navy">{step.name}</span>
            {step.description ? <span className="mt-1 block text-sm text-muted">{step.description}</span> : null}
          </span>
        </li>
      ))}
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
