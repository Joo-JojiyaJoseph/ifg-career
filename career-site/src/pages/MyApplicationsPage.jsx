import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { client } from '@shared/api/createClient'
import { formatDate } from '@shared/lib/formatDate'
import { Card } from '@shared/ui/Card'
import { DateInput } from '@shared/ui/DateInput'
import { EntityBadge } from '@shared/ui/EntityBadge'
import { ErrorState } from '@shared/ui/ErrorState'
import { Pagination } from '@shared/ui/Pagination'
import { Select } from '@shared/ui/Select'
import { Button } from '@shared/ui/Button'
import { EmptyState, Skeleton } from '@shared/ui/Skeleton'
import { startGoogleSignIn } from '../features/auth/api'
import { StatusBadge } from '@shared/ui/Badge'
import { useCandidateAuth } from '../features/auth/AuthProvider'
import { fetchEntities } from '../features/jobs/api'

const statuses = [
  { value: '', label: 'Any status' },
  { value: 'applied', label: 'Applied' },
  { value: 'in_review', label: 'In review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview_scheduled', label: 'Interview scheduled' },
  { value: 'selected', label: 'Selected' },
  { value: 'not_selected', label: 'Not selected' },
  { value: 'closed', label: 'Closed' },
]

export function MyApplicationsPage() {
  const { candidate, loading } = useCandidateAuth()
  const [params, setParams] = useSearchParams()
  const entities = useQuery({ queryKey: ['entities'], queryFn: fetchEntities, staleTime: 600_000, enabled: Boolean(candidate) })
  const applications = useQuery({
    queryKey: ['candidate-applications', params.toString()],
    queryFn: async () => {
      const { data } = await client.get('/api/v1/candidate/applications', {
        params: Object.fromEntries(params.entries()),
      })
      return data
    },
    enabled: Boolean(candidate),
  })

  useEffect(() => {
    document.title = 'My Applications · Infolks Group Careers'
  }, [])

  function setFilter(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  if (!loading && !candidate) {
    return (
      <EmptyState
        title="Sign in to see your applications"
        description="Your Candidate profile shows the status of every application you have sent. Sign in with the Google account you applied with."
        action={<Button onClick={() => startGoogleSignIn('/my-applications')}>Sign in with Google</Button>}
      />
    )
  }

  const entityOptions = [
    { value: '', label: 'Any entity' },
    ...(entities.data ?? []).map((entity) => ({ value: entity.slug, label: entity.name })),
  ]
  const page = Number(params.get('page') || applications.data?.meta?.current_page || 1)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl text-navy">My Applications</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="sr-only" htmlFor="status-filter">Status</label>
          <Select id="status-filter" value={params.get('status') || ''} onChange={(value) => setFilter('status', value)} options={statuses} />
        </div>
        <div>
          <label className="sr-only" htmlFor="entity-filter">Entity</label>
          <Select id="entity-filter" value={params.get('entity') || ''} onChange={(value) => setFilter('entity', value)} options={entityOptions} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy" htmlFor="applied-from">Applied from</label>
          <DateInput id="applied-from" value={params.get('applied_from') || ''} onChange={(value) => setFilter('applied_from', value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy" htmlFor="applied-to">Applied to</label>
          <DateInput id="applied-to" value={params.get('applied_to') || ''} onChange={(value) => setFilter('applied_to', value)} />
        </div>
      </div>
      {applications.isLoading ? <Skeleton className="h-32" /> : null}
      {applications.isError ? <ErrorState title="Applications could not be loaded" onRetry={() => applications.refetch()} /> : null}
      {applications.data && applications.data.data.length === 0 ? (
        <EmptyState title="No applications yet" description="When you apply for a role, or send a general application, it will show up here." />
      ) : null}
      <ul className="flex flex-col gap-3">
        {(applications.data?.data ?? []).map((application) => (
          <li key={application.public_id}>
            <Link
              to={`/my-applications/${application.public_id}`}
              viewTransition
              className="group block rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              <Card className="transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-card-hover">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-medium text-navy group-hover:text-brand-700">{application.role}</h2>
                    <p className="mt-1 text-sm text-muted">Applied {formatDate(application.applied_at)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <EntityBadge entity={application.entity} />
                    <StatusBadge status={application.status} />
                    <span className="ml-1 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
                      View details
                      <ChevronRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
      {applications.data && applications.data.meta.last_page > 1 ? (
        <Pagination
          page={page}
          pageCount={applications.data.meta.last_page}
          perPage={applications.data.meta.per_page}
          perPageOptions={[10, 25, 50]}
          onPageChange={(next) => setFilter('page', String(next))}
          onPerPageChange={(size) => setFilter('per_page', String(size))}
        />
      ) : null}
    </div>
  )
}
