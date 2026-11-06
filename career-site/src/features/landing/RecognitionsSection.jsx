import PropTypes from 'prop-types'
import { Marquee } from '@shared/ui/Marquee'

/**
 * First half of section 9: awards, certifications and memberships.
 */
export function RecognitionsSection({ items = [] }) {
  if (!items.length) return null

  // A short list would leave a gap in the loop, so it stays a centred row.
  const Row = items.length >= 5 ? Marquee : StaticRow

  return (
    <section className="border-t border-border bg-white py-14" aria-labelledby="recognitions-title">
      <div className="mx-auto max-w-6xl px-4">
        <h2 id="recognitions-title" className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-muted">Our recognitions and validations</h2>
        <Row className="mt-8">
          {items.map((badge) => {
            const content = (
              <>
                <img src={badge.badge_url} alt="" className="h-16 w-auto max-w-[8rem] object-contain grayscale transition duration-300 group-hover/badge:grayscale-0" loading="lazy" height="64" />
                <span className="text-center text-xs text-muted">{badge.name}{badge.year ? ` (${badge.year})` : ''}</span>
              </>
            )
            return (
              <div key={badge.id}>
                {badge.link ? (
                  <a href={badge.link} target="_blank" rel="noreferrer noopener" className="group/badge flex w-32 flex-col items-center gap-2 rounded-xl p-3 transition duration-200 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                    {content}
                  </a>
                ) : (
                  <div className="group/badge flex w-32 flex-col items-center gap-2 p-3">{content}</div>
                )}
              </div>
            )
          })}
        </Row>
      </div>
    </section>
  )
}

function StaticRow({ children, className = '' }) {
  return <div className={`flex flex-wrap items-center justify-center gap-6 ${className}`}>{children}</div>
}

StaticRow.propTypes = { children: PropTypes.node, className: PropTypes.string }

RecognitionsSection.propTypes = { items: PropTypes.array }
