import PropTypes from 'prop-types'
import { Reveal } from '@shared/ui/Motion'

/**
 * Centred section title with an optional eyebrow. `tone="dark"` for sections on the ink background.
 */
export function SectionHeading({ id, title, intro, eyebrow, tone = 'light' }) {
  const dark = tone === 'dark'

  return (
    <Reveal className="mx-auto mb-14 max-w-2xl text-center">
      {eyebrow ? (
        <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.18em] ${dark ? 'text-cyan-200' : 'text-brand-600'}`}>
          {eyebrow}
        </p>
      ) : null}
      <h2 id={id} className={`font-display text-[clamp(1.75rem,2.2vw+1rem,2.75rem)] font-semibold leading-[1.12] tracking-tight ${dark ? 'text-white' : 'text-ink'}`}>{title}</h2>
      {intro ? <p className={`mt-4 text-base leading-relaxed md:text-lg ${dark ? 'text-white/70' : 'text-muted'}`}>{intro}</p> : null}
    </Reveal>
  )
}

SectionHeading.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  intro: PropTypes.string,
  eyebrow: PropTypes.string,
  tone: PropTypes.oneOf(['light', 'dark']),
}
