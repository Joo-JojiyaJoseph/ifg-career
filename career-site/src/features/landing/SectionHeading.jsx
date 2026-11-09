import PropTypes from 'prop-types'
import { Reveal } from '@shared/ui/Motion'

/**
 * Centred section title: a small spaced eyebrow, the title and an optional line of intro.
 * `tone="dark"` for sections on the navy background.
 */
export function SectionHeading({ id, title, intro, eyebrow, tone = 'light' }) {
  const dark = tone === 'dark'

  return (
    <Reveal className="mx-auto mb-12 max-w-3xl text-center md:mb-14">
      {eyebrow ? (
        <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.2em] ${dark ? 'text-cyan-200' : 'text-brand-600'}`}>{eyebrow}</p>
      ) : null}
      <h2 id={id} className={`font-display text-[clamp(1.85rem,2.2vw+1rem,2.9rem)] font-semibold leading-[1.1] tracking-tight [text-wrap:balance] ${dark ? 'text-white' : 'text-ink'}`}>{title}</h2>
      {intro ? <p className={`mx-auto mt-4 max-w-2xl text-base leading-relaxed md:text-lg ${dark ? 'text-white/70' : 'text-muted'}`}>{intro}</p> : null}
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
