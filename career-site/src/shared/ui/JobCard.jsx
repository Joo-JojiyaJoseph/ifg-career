import { Link } from 'react-router-dom'
import { ArrowUpRightIcon, MapPinIcon } from '@heroicons/react/24/outline'
import PropTypes from 'prop-types'
import { useSpotlight } from '../hooks/useSpotlight'
import { formatDate } from '../lib/formatDate'
import { Badge } from './Badge'
import { EntityBadge } from './EntityBadge'
import { EntityLogo } from './BrandLogo'

/**
 * Public role card in the hiring company's theme: its colours, logo and a matching hover glow.
 */
export function JobCard({ job, onHover }) {
  const accent = job.entity?.theme?.accent || '#1976D2'
  const primary = job.entity?.theme?.primary || '#0B4FA3'
  const dark = job.entity?.theme?.secondary || '#0A2540'
  const spot = useSpotlight()
  const teamLine = [job.department?.name, job.team?.name].filter(Boolean).join(' · ')

  return (
    <Link
      to={job.path}
      viewTransition
      onMouseEnter={onHover}
      onFocus={onHover}
      {...spot}
      className="spotlight group relative block overflow-hidden rounded-3xl border border-border bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--entity-accent)_40%,white)] hover:shadow-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:p-6"
      style={{ '--entity-accent': accent, '--entity-primary': primary, '--entity-dark': dark, '--spot-color': `color-mix(in srgb, ${accent} 14%, transparent)` }}
    >
      {/* The hiring company's colours: a stripe down the left edge and a soft glow in the corner. */}
      <span className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[var(--entity-dark)] via-[var(--entity-primary)] to-[var(--entity-accent)]" aria-hidden="true" />
      <span className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[var(--entity-accent)] opacity-[0.08] blur-2xl transition-opacity duration-300 group-hover:opacity-20" aria-hidden="true" />
      <div className="flex items-start gap-4">
        {job.entity ? <EntityLogo entity={job.entity} size="md" className="hidden transition duration-200 group-hover:scale-105 sm:flex" /> : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-lg font-semibold leading-snug text-ink transition-colors duration-200 group-hover:text-[var(--entity-primary)] sm:text-xl">{job.title}</h2>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition duration-200 group-hover:bg-[var(--entity-primary)] group-hover:text-white" aria-hidden="true">
              <ArrowUpRightIcon className="h-4 w-4 transition duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
            <EntityBadge entity={job.entity} />
            {job.level?.value ? <Badge color={job.level.color}>{job.level.label}</Badge> : null}
            <span className="inline-flex items-center gap-1"><MapPinIcon className="h-4 w-4" aria-hidden="true" />{job.location}</span>
          </div>
          <p className="mt-3 text-sm text-muted">
            {teamLine ? <>{teamLine}<span aria-hidden="true"> · </span></> : null}
            Posted {formatDate(job.posted_at)}
            {typeof job.days_left === 'number' ? <span className={job.days_left <= 7 ? 'font-medium text-amber-700' : ''}>{` · ${job.days_left} day${job.days_left === 1 ? '' : 's'} left`}</span> : null}
          </p>
        </div>
      </div>
    </Link>
  )
}

JobCard.propTypes = {
  job: PropTypes.shape({
    path: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    location: PropTypes.string,
    posted_at: PropTypes.string,
    days_left: PropTypes.number,
    level: PropTypes.shape({ value: PropTypes.string, label: PropTypes.string, color: PropTypes.string }),
    department: PropTypes.shape({ name: PropTypes.string }),
    team: PropTypes.shape({ name: PropTypes.string }),
    entity: PropTypes.object,
  }).isRequired,
  onHover: PropTypes.func,
}
