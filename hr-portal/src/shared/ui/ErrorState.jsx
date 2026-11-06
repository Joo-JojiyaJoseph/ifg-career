import PropTypes from 'prop-types'
import { Button } from './Button'

/** Shown when a request fails, with a way to try again. */
export function ErrorState({ title = 'Something went wrong', description = 'Please try again.', onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-danger/40 bg-white px-6 py-12 text-center" role="alert">
      <h2 className="font-display text-xl text-navy">{title}</h2>
      <p className="max-w-md text-muted">{description}</p>
      {onRetry ? <Button onClick={onRetry}>Try again</Button> : null}
    </div>
  )
}

ErrorState.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  onRetry: PropTypes.func,
}
