import { Link } from 'react-router-dom'
import { MapPinIcon } from '@heroicons/react/24/outline'
import PropTypes from 'prop-types'
import { formatDate } from '../lib/formatDate'
import { Badge } from './Badge'
import { EntityBadge } from './EntityBadge'

/**
 * Public role card themed with the hiring entity's accent and logo.
 */
export function JobCard({ job, onHover }) {
  const accent = job.entity?.theme?.accent || '#1976D2'
  const primary = job.entity?.theme?.primary || '#0B4FA3'
  const logo = job.entity?.theme?.logo_url
  const teamLine = [job.department?.name, job.team?.name].filter(Boolean).join(' · ')

  return (
    <Link
      to={job.path}
      onMouseEnter={onHover}
      onFocus={onHover}
      className="block rounded-2xl border border-l-4 border-border bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover border-l-[var(--entity-accent)]"
      style={{ '--entity-accent': accent, '--entity-primary': primary }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-navy">{job.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <EntityBadge entity={job.entity} />
            {job.level?.value ? <Badge color={job.level.color}>{job.level.label}</Badge> : null}
          </div>
        </div>
        {logo ? <img src={logo} alt="" width="48" height="48" className="h-12 w-12 rounded-xl object-contain" /> : null}
      </div>
      {teamLine ? <p className="mt-3 text-sm text-muted">{teamLine}</p> : null}
      <p className="mt-2 flex items-center gap-2 text-sm text-text">
        <MapPinIcon className="h-4 w-4 text-muted" aria-hidden="true" />
        {job.location}
      </p>
      <p className="mt-3 text-sm text-muted">
        Posted {formatDate(job.posted_at)}
        {typeof job.days_left === 'number' ? ` · ${job.days_left} day${job.days_left === 1 ? '' : 's'} left` : ''}
      </p>
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
