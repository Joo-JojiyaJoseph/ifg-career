import PropTypes from 'prop-types'
import { ShieldCheckIcon } from '@heroicons/react/24/solid'
import { Photo } from '@shared/ui/Photo'
import { isPlaceholder } from './api'

/**
 * "Our recognitions and validations": the certifications HR lists in Website Content.
 * A recognition without its own badge image shows a shield. Hidden when there are none.
 */
export function RecognitionsSection({ recognitions = [] }) {
  if (!recognitions.length) return null

  return (
    <section className="border-t border-border bg-white py-14" aria-labelledby="recognitions-title">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 id="recognitions-title" className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Our recognitions and validations</h2>
        <ul className="mt-8 flex flex-wrap justify-center gap-x-12 gap-y-6">
          {recognitions.map((badge) => {
            const content = (
              <>
                {isPlaceholder(badge.badge_url) || !badge.badge_url ? (
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 ring-1 ring-border" aria-hidden="true"><ShieldCheckIcon className="h-9 w-9 text-slate-500" /></span>
                ) : (
                  <Photo src={badge.badge_url} alt="" className="h-16 w-16 rounded-full !bg-none" imgClassName="!object-contain" sizes="64px" />
                )}
                <span className="mt-2 text-sm text-muted">{badge.name}{badge.year ? ` · ${badge.year}` : ''}</span>
              </>
            )
            return (
              <li key={badge.id}>
                {badge.link ? (
                  <a href={badge.link} target="_blank" rel="noreferrer noopener" className="flex min-h-11 flex-col items-center rounded-xl p-1 transition duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">{content}<span className="sr-only"> (opens in a new tab)</span></a>
                ) : (
                  <div className="flex flex-col items-center p-1">{content}</div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

RecognitionsSection.propTypes = { recognitions: PropTypes.array }
