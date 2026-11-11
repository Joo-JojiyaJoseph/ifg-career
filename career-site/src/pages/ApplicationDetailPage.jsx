import { useEffect } from 'react'
import PropTypes from 'prop-types'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  CheckIcon,
  ClockIcon,
  InformationCircleIcon,
  MapPinIcon,
  MinusIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline'
import { client } from '@shared/api/createClient'
import { formatDate } from '@shared/lib/formatDate'
import { StatusBadge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { Card } from '@shared/ui/Card'
import { EntityLogo } from '@shared/ui/BrandLogo'
import { EntityBadge } from '@shared/ui/EntityBadge'
import { ErrorState } from '@shared/ui/ErrorState'
import { EmptyState, Skeleton } from '@shared/ui/Skeleton'
import { startGoogleSignIn } from '../features/auth/api'
import { useCandidateAuth } from '../features/auth/AuthProvider'

const time = (iso) => (iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '')
const isLink = (value) => /^https?:\/\//i.test(value ?? '')

/**
 * One of the candidate's applications: where it is on the path (Applied → In review → Shortlisted → Interviews →
 * Decision), a short note on what happens next, and the details of their interviews with the joining link.
 */
export function ApplicationDetailPage() {
  const { applicationId } = useParams()
  const { candidate, loading } = useCandidateAuth()
  const application = useQuery({
    queryKey: ['candidate-application', applicationId],
    queryFn: async () => (await client.get(`/api/v1/candidate/applications/${applicationId}`)).data.data,
    enabled: Boolean(candidate),
  })

  useEffect(() => {
    document.title = `${application.data?.role ?? 'Application'} · Infolks Group Careers`
  }, [application.data?.role])

  if (!loading && !candidate) {
    return (
      <EmptyState
        title="Sign in to see this application"
        description="Sign in with the Google account you applied with."
        action={<Button onClick={() => startGoogleSignIn(`/my-applications/${applicationId}`)}>Sign in with Google</Button>}
      />
    )
  }

  const data = application.data
  const upcoming = (data?.interviews ?? []).filter((round) => round.upcoming)

  return (
    <div className="flex flex-col gap-5">
      <Link to="/my-applications" viewTransition className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-full text-sm font-medium text-brand-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
        My Applications
      </Link>

      {application.isLoading || loading ? <Skeleton className="h-56" /> : null}
      {application.isError ? (
        <ErrorState
          title={application.error?.status === 404 ? 'This application was not found' : 'The application could not be loaded'}
          onRetry={application.error?.status === 404 ? undefined : () => application.refetch()}
        />
      ) : null}

      {data ? (
        <>
          <Card className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <EntityLogo entity={data.entity} className="rounded-2xl" />
                <div className="min-w-0">
                <h1 className="font-display text-2xl font-semibold text-navy sm:text-3xl">{data.role}</h1>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                  <li className="flex items-center gap-1.5"><CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />Applied {formatDate(data.applied_at)}</li>
                  {data.department ? <li className="flex items-center gap-1.5"><BuildingOffice2Icon className="h-4 w-4" aria-hidden="true" />{data.department}</li> : null}
                  {data.job?.location ? <li className="flex items-center gap-1.5"><MapPinIcon className="h-4 w-4" aria-hidden="true" />{data.job.location}</li> : null}
                </ul>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <EntityBadge entity={data.entity} />
                <StatusBadge status={data.status} />
              </div>
            </div>
            {data.message ? (
              <p
                className={`flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm ${
                  data.result === 'selected' ? 'border border-emerald-200 bg-emerald-50 text-emerald-900' : data.result === 'not_selected' ? 'border border-border bg-slate-50 text-ink' : 'bg-brand-50 text-brand-900'
                }`}
                role="status"
              >
                {data.result === 'selected' ? (
                  <CheckBadgeIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                ) : (
                  <InformationCircleIcon className={`mt-0.5 h-5 w-5 shrink-0 ${data.result === 'not_selected' ? 'text-muted' : 'text-brand-600'}`} aria-hidden="true" />
                )}
                {data.message}
              </p>
            ) : null}
            {data.job?.slug && data.job.is_open ? (
              <Link to={`/jobs/${data.job.slug}`} viewTransition className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-medium text-brand-700 hover:underline">
                View the job description
                <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : null}
          </Card>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <Card>
              <h2 className="font-display text-lg font-semibold text-navy">Progress</h2>
              <Progress steps={data.steps} />
            </Card>
            <Card>
              <h2 className="font-display text-lg font-semibold text-navy">Your interviews</h2>
              {data.interviews.length ? (
                <ul className="mt-4 flex flex-col gap-3">
                  {data.interviews.map((round) => (
                    <Interview key={round.round_number} round={round} />
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  {['closed', 'selected', 'not_selected'].includes(data.status)
                    ? 'There are no interviews for this application.'
                    : 'No interview is scheduled yet. When the hiring team schedules one, the date, time and joining details will appear here and you will get an email.'}
                </p>
              )}
              {upcoming.length ? <p className="mt-4 text-xs text-muted">Times are shown in your device's time zone.</p> : null}
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}

/** The application's steps as a vertical list: done, current, still to come, or skipped. */
function Progress({ steps }) {
  return (
    <ol className="mt-4 flex flex-col" aria-label="Application progress">
      {steps.map((step, index) => {
        const last = index === steps.length - 1
        const look = {
          done: { dot: 'bg-brand-600 text-white', text: 'text-ink', note: step.date ? formatDate(step.date) : 'Done' },
          current: { dot: 'bg-white text-brand-700 ring-4 ring-brand-200 border-2 border-brand-600', text: 'font-semibold text-brand-800', note: step.date ? `${formatDate(step.date)} · where it is now` : 'Where it is now' },
          next: { dot: 'bg-white text-muted border-2 border-slate-200', text: 'text-muted', note: 'Still to come' },
          skipped: { dot: 'bg-slate-100 text-slate-400', text: 'text-slate-400', note: 'Not needed' },
        }[step.state] ?? {}
        return (
          <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0" aria-current={step.state === 'current' ? 'step' : undefined}>
            {last ? null : <span className={`absolute left-[0.95rem] top-9 h-[calc(100%-2.25rem)] w-0.5 ${step.state === 'done' ? 'bg-brand-300' : 'bg-slate-200'}`} aria-hidden="true" />}
            <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${look.dot}`} aria-hidden="true">
              {step.state === 'done' ? <CheckIcon className="h-4 w-4" /> : step.state === 'skipped' ? <MinusIcon className="h-4 w-4" /> : index + 1}
            </span>
            <div className="min-w-0 pt-1">
              <p className={`text-sm ${look.text}`}>{step.label}</p>
              <p className="text-xs text-muted">
                <span className="sr-only">{step.state}: </span>
                {look.note}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

Progress.propTypes = { steps: PropTypes.array.isRequired }

/** One interview round: when, how long, how, and the joining link or address while it is still to come. */
function Interview({ round }) {
  return (
    <li className={`rounded-2xl border p-4 ${round.upcoming ? 'border-violet-200 bg-violet-50/60' : 'border-border bg-white'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-medium text-ink">
          Round {round.round_number} · {round.round_name}
        </p>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${round.upcoming ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-muted'}`}>{round.upcoming ? 'Upcoming' : 'Completed'}</span>
      </div>
      <ul className="mt-2 flex flex-col gap-1 text-sm text-muted">
        <li className="flex items-center gap-2"><CalendarDaysIcon className="h-4 w-4 shrink-0" aria-hidden="true" />{formatDate(round.scheduled_at)} at {time(round.scheduled_at)}</li>
        {round.duration_minutes ? <li className="flex items-center gap-2"><ClockIcon className="h-4 w-4 shrink-0" aria-hidden="true" />{round.duration_minutes} minutes</li> : null}
        {round.mode ? <li className="flex items-center gap-2"><VideoCameraIcon className="h-4 w-4 shrink-0" aria-hidden="true" />{round.mode}</li> : null}
        {round.upcoming && round.location_or_link && !isLink(round.location_or_link) ? (
          <li className="flex items-start gap-2"><MapPinIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span className="break-words">{round.location_or_link}</span></li>
        ) : null}
      </ul>
      {round.upcoming && isLink(round.location_or_link) ? (
        <a href={round.location_or_link} target="_blank" rel="noreferrer noopener" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2">
          Join the interview
          <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : null}
    </li>
  )
}

Interview.propTypes = { round: PropTypes.object.isRequired }
