import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AdjustmentsHorizontalIcon, BriefcaseIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { client } from '@shared/api/createClient'
import { formatDate } from '@shared/lib/formatDate'
import { StatusBadge } from '@shared/ui/Badge'
import { EntityLogo } from '@shared/ui/BrandLogo'
import { Button } from '@shared/ui/Button'
import { DateInput } from '@shared/ui/DateInput'
import { ErrorState } from '@shared/ui/ErrorState'
import { Pagination } from '@shared/ui/Pagination'
import { Select } from '@shared/ui/Select'
import { EmptyState, Skeleton } from '@shared/ui/Skeleton'
import { Tabs } from '@shared/ui/Tabs'
import { startGoogleSignIn } from '../features/auth/api'
import { useCandidateAuth } from '../features/auth/AuthProvider'
import { fetchEntities } from '../features/jobs/api'

/** The status tabs. "In progress" covers everything that has not been decided yet. */
const groups = [
  { id: '', label: 'All', key: 'all' },
  { id: 'in_progress', label: 'In progress', key: 'in_progress' },
  { id: 'selected', label: 'Selected', key: 'selected' },
  { id: 'not_selected', label: 'Not selected', key: 'not_selected' },
  { id: 'closed', label: 'Closed', key: 'closed' },
]

/** One short line under each application saying where it stands. */
const hints = {
  applied: 'Received. Waiting for the hiring team to review it.',
  in_review: 'The hiring team is reviewing it.',
  shortlisted: 'Shortlisted. The team will arrange an interview.',
  interview_scheduled: 'Interview scheduled. Open it for the date, time and link.',
  selected: 'Congratulations, you have been selected.',
  not_selected: 'Not selected this time.',
  closed: 'This application is closed.',
}

const EXTRA_FILTERS = ['entity', 'applied_from', 'applied_to']

/**
 * The candidate's applications: status tabs with counts, simple cards that open the full application page,
 * and company and date filters tucked away until there are enough applications to need them.
 */
export function MyApplicationsPage() {
  const { candidate, loading } = useCandidateAuth()
  const [params, setParams] = useSearchParams()
  const extraActive = EXTRA_FILTERS.some((key) => params.get(key))
  const [showFilters, setShowFilters] = useState(extraActive)
  const applications = useQuery({
    queryKey: ['candidate-applications', params.toString()],
    queryFn: async () => (await client.get('/api/v1/candidate/applications', { params: Object.fromEntries(params.entries()) })).data,
    enabled: Boolean(candidate),
    placeholderData: (previous) => previous,
  })
  const entities = useQuery({ queryKey: ['entities'], queryFn: fetchEntities, staleTime: 600_000, enabled: Boolean(candidate) && showFilters })

  useEffect(() => {
    document.title = 'My Applications · Infolks Group Careers'
  }, [])

  function setFilter(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }

  function clearExtra() {
    const next = new URLSearchParams(params)
    EXTRA_FILTERS.forEach((key) => next.delete(key))
    next.delete('page')
    setParams(next, { replace: true })
  }

  if (!loading && !candidate) {
    return (
      <EmptyState
        title="Sign in to see your applications"
        description="See the status of every application you have sent. Sign in with the Google account you applied with."
        action={<Button onClick={() => startGoogleSignIn('/my-applications')}>Sign in with Google</Button>}
      />
    )
  }

  const counts = applications.data?.counts ?? {}
  const status = params.get('status') || ''
  const items = applications.data?.data ?? []
  const total = counts.all ?? 0
  // Tabs with nothing in them are left out (All and the open tab always show).
  const tabs = groups.filter((group) => group.id === '' || group.id === status || counts[group.key] > 0).map((group) => ({ id: group.id, label: group.label, count: counts[group.key] ?? 0 }))
  const page = Number(params.get('page') || applications.data?.meta?.current_page || 1)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-navy">My Applications</h1>
          <p className="mt-1 text-muted">{total ? `${total} ${total === 1 ? 'application' : 'applications'}. Open one to see its progress and interviews.` : 'Track every role you apply for.'}</p>
        </div>
        {total > 5 || extraActive ? (
          <button
            type="button"
            onClick={() => setShowFilters((open) => !open)}
            aria-expanded={showFilters}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${extraActive ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-border bg-white text-navy hover:bg-brand-50'}`}
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden="true" />
            More filters
          </button>
        ) : null}
      </div>

      {total > 0 ? <Tabs items={tabs} value={status} onChange={(next) => setFilter('status', next)} label="Application status" /> : null}

      {showFilters ? (
        <div className="grid gap-3 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-card sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy" htmlFor="entity-filter">Company</label>
            <Select
              id="entity-filter"
              value={params.get('entity') || ''}
              onChange={(value) => setFilter('entity', value)}
              options={[{ value: '', label: 'Any company' }, ...(entities.data ?? []).map((entity) => ({ value: entity.slug, label: entity.name }))]}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy" htmlFor="applied-from">Applied from</label>
            <DateInput id="applied-from" value={params.get('applied_from') || ''} onChange={(value) => setFilter('applied_from', value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy" htmlFor="applied-to">Applied to</label>
            <DateInput id="applied-to" value={params.get('applied_to') || ''} onChange={(value) => setFilter('applied_to', value)} />
          </div>
          {extraActive ? (
            <button type="button" onClick={clearExtra} className="inline-flex min-h-11 items-center gap-1.5 justify-self-start text-sm font-medium text-brand-700 hover:underline sm:col-span-3">
              <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              Clear company and date
            </button>
          ) : null}
        </div>
      ) : null}

      {applications.isLoading || loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : null}
      {applications.isError ? <ErrorState title="Applications could not be loaded" onRetry={() => applications.refetch()} /> : null}

      {applications.data && items.length === 0 ? (
        total === 0 && !extraActive ? (
          <EmptyState
            title="No applications yet"
            description="When you apply for a role, or share your profile with Quick Apply, it shows up here."
            action={
              <Link to="/jobs" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700">
                <BriefcaseIcon className="h-5 w-5" aria-hidden="true" />
                Browse open roles
              </Link>
            }
          />
        ) : (
          <EmptyState
            title="Nothing here"
            description="No applications match this view."
            action={<Button variant="secondary" onClick={() => setParams({}, { replace: true })}>Show all applications</Button>}
          />
        )
      ) : null}

      <ul className="flex flex-col gap-3">
        {items.map((application, index) => (
          <li key={application.public_id} className="motion-safe:animate-row-in" style={{ '--row-delay': `${Math.min(index, 8) * 40}ms` }}>
            <Link
              to={`/my-applications/${application.public_id}`}
              viewTransition
              className="group flex items-center gap-3 rounded-3xl sm:gap-4 border border-white/70 bg-white/90 p-4 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:p-5"
            >
              <EntityLogo entity={application.entity} className="self-start rounded-2xl sm:self-center" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h2 className="font-display text-lg font-semibold text-navy group-hover:text-brand-700">{application.role}</h2>
                  <StatusBadge status={application.status} />
                </div>
                <p className="mt-0.5 text-sm text-muted">
                  {application.entity?.name ? `${application.entity.name} · ` : ''}Applied {formatDate(application.applied_at)}
                </p>
                {hints[application.status] ? <p className={`mt-2 text-sm ${application.status === 'selected' ? 'font-medium text-emerald-700' : 'text-ink'}`}>{hints[application.status]}</p> : null}
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition duration-200 group-hover:translate-x-0.5 group-hover:bg-brand-600 group-hover:text-white" aria-hidden="true">
                <ChevronRightIcon className="h-5 w-5" />
              </span>
              <span className="sr-only">View details</span>
            </Link>
          </li>
        ))}
      </ul>

      {applications.data ? (
        <Pagination
          page={page}
          pageCount={applications.data.meta.last_page}
          perPage={applications.data.meta.per_page}
          perPageOptions={[10, 25, 50]}
          total={applications.data.meta.total}
          onPageChange={(next) => setFilter('page', String(next))}
          onPerPageChange={(size) => setFilter('per_page', String(size))}
        />
      ) : null}
    </div>
  )
}
