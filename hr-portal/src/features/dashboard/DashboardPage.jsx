import { lazy, Suspense, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  ClockIcon,
  DocumentTextIcon,
  EllipsisHorizontalIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  InboxArrowDownIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  PaperAirplaneIcon,
  StarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Avatar } from '@shared/ui/Avatar'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { PageHeader } from '@shared/ui/Card'
import { HrDeskIllustration } from '@shared/ui/illustrations/HrDesk'
import { Aurora } from '@shared/ui/Aurora'
import { Photo } from '@shared/ui/Photo'
import { Stagger, StaggerItem } from '@shared/ui/Motion'
import { DonutChart } from '@shared/ui/DonutChart'
import { EntityBadge } from '@shared/ui/EntityBadge'
import { ErrorState } from '@shared/ui/ErrorState'
import { PipelineStages } from '@shared/ui/PipelineStages'
import { Select } from '@shared/ui/Select'
import { EmptyState, Skeleton } from '@shared/ui/Skeleton'
import { StatCard } from '@shared/ui/StatCard'
import { formatDate, formatDateTime } from '@shared/lib/formatDate'
import { useAuth } from '../auth/AuthProvider'
import { fetchEntities } from '../applications/api'
import { fetchActionItems, fetchOverTime, fetchPipeline, fetchPromo, fetchRecent, fetchSources, fetchStats, fetchUpcoming } from './api'

const AreaChart = lazy(() => import('@shared/ui/AreaChart'))
const ranges = [{ id: '1m', label: '1M' }, { id: '3m', label: '3M' }, { id: '6m', label: '6M' }, { id: '1y', label: '1Y' }]
const live = { staleTime: 60_000, placeholderData: keepPreviousData }

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const entity = params.get('entity') ?? ''
  const scope = { entity }
  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const can = (permission) => user?.permissions?.includes(permission)

  const entities = useQuery({ queryKey: ['public-entities'], queryFn: fetchEntities, staleTime: 600_000 })
  const stats = useQuery({ queryKey: ['dash', 'stats', scope], queryFn: () => fetchStats(scope), ...live })
  const actions = useQuery({ queryKey: ['dash', 'actions', scope], queryFn: () => fetchActionItems(scope), ...live, refetchInterval: 120_000 })

  // The promo card's team photo (Website Content → Opening banner) also decorates the welcome banner.
  const promo = useQuery({ queryKey: ['dash', 'promo'], queryFn: () => fetchPromo(), staleTime: 600_000 })
  const teamPhoto = promo.data?.image && !promo.data.image.endsWith('.svg') ? promo.data.image : null

  const withEntity = (path) => (entity ? `${path}${path.includes('?') ? '&' : '?'}entity=${entity}` : path)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Career Overview"
        art={teamPhoto ? (
          <Photo
            src={teamPhoto}
            alt=""
            className="glass aspect-[16/10] rounded-[1.75rem] border-[6px] border-white/80 motion-safe:animate-float-slow"
            sizes="352px"
            fallback={<HrDeskIllustration className="h-auto w-full motion-safe:animate-float-slow" />}
          />
        ) : <HrDeskIllustration className="h-auto w-full motion-safe:animate-float-slow" />}
        subtitle={<span>Welcome back, {firstName}! Let's build a stronger team together. <HeartIcon className="inline h-4 w-4 text-brand-500" aria-hidden="true" /></span>}
        actions={
          <>
            <div className="w-full sm:w-48">
              <Select id="dash-entity" value={entity} onChange={(next) => setParams(next ? { entity: next } : {}, { replace: true })} options={[{ value: '', label: 'All entities' }, ...(entities.data ?? []).map((item) => ({ value: item.slug, label: item.name }))]} />
            </div>
            {can('jobs.manage') ? <Button icon={PaperAirplaneIcon} onClick={() => navigate('/jobs/new')}>Post a Job</Button> : null}
            {can('campaigns.send') ? <Button variant="secondary" icon={MegaphoneIcon} onClick={() => navigate('/talent/new?type=job_alert')}>Send Job Alert</Button> : null}
          </>
        }
      />

      {stats.isError ? <ErrorState onRetry={() => stats.refetch()} /> : (
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StaggerItem><StatCard icon={BriefcaseIcon} tone="blue" label="Active openings" loading={stats.isLoading} to={withEntity('/jobs?status=published')} value={stats.data?.active_openings.value} delta={stats.data?.active_openings.delta} deltaKind="count" period={stats.data?.active_openings.period} spark={stats.data?.active_openings.spark} /></StaggerItem>
          <StaggerItem><StatCard icon={UserGroupIcon} tone="cyan" label="Total applicants" loading={stats.isLoading} to={withEntity('/applications')} value={stats.data?.total_applicants.value} delta={stats.data?.total_applicants.delta} period={stats.data?.total_applicants.period} spark={stats.data?.total_applicants.spark} /></StaggerItem>
          <StaggerItem><StatCard icon={StarIcon} tone="amber" label="Shortlisted" loading={stats.isLoading} to={withEntity('/applications?status=shortlisted')} value={stats.data?.shortlisted.value} delta={stats.data?.shortlisted.delta} period={stats.data?.shortlisted.period} spark={stats.data?.shortlisted.spark} /></StaggerItem>
          <StaggerItem><StatCard icon={CalendarDaysIcon} tone="teal" label="Interviews this week" loading={stats.isLoading} to="/interviews?view=rounds&when=week" value={stats.data?.interviews_this_week.value} delta={stats.data?.interviews_this_week.delta} period={stats.data?.interviews_this_week.period} spark={stats.data?.interviews_this_week.spark} /></StaggerItem>
        </Stagger>
      )}

      <ActionChips data={actions.data} loading={actions.isLoading} withEntity={withEntity} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <PipelineCard scope={scope} withEntity={withEntity} />
          <OverTimeCard scope={scope} />
          <RecentCard scope={scope} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <UpcomingCard scope={scope} />
          <SourcesCard scope={scope} />
          <PromoCard />
        </div>
      </div>
    </div>
  )
}

function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`glass rounded-3xl p-5 sm:p-6 ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function ViewAll({ to, label = 'View all' }) {
  return (
    <Link to={to} className="inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
      {label} <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
    </Link>
  )
}

function ActionChips({ data, loading, withEntity }) {
  if (loading) return <Skeleton className="h-11" />
  if (!data) return null
  const chips = [
    { key: 'new_since_login', label: 'new since your last sign-in', icon: InboxArrowDownIcon, to: withEntity('/applications?status=applied') },
    { key: 'new_today', label: 'applied today', icon: DocumentTextIcon, to: withEntity(`/applications?applied_from=${new Date().toISOString().slice(0, 10)}`) },
    { key: 'quick_apply_waiting', label: 'Quick apply to review', icon: MagnifyingGlassIcon, to: '/applications?type=general&status=applied' },
    { key: 'interviews_today', label: 'interviews today', icon: ClockIcon, to: '/interviews?view=rounds&when=today' },
    { key: 'closing_soon', label: 'jobs closing in 7 days', icon: CalendarDaysIcon, to: withEntity('/jobs?status=published&closing_within=7') },
    { key: 'sync_failed', label: 'calendar syncs to retry', icon: ExclamationTriangleIcon, to: '/interviews?view=rounds&sync=failed', warn: true },
  ]

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Needs action">
      {chips.map((chip) => {
        const value = data[chip.key] ?? 0
        if (!value) return null
        return (
          <li key={chip.key}>
            <Link to={chip.to} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm transition duration-200 hover:-translate-y-0.5 ${chip.warn ? 'bg-red-50 text-red-700 ring-1 ring-red-100' : 'glass text-navy hover:bg-white/80'}`}>
              <chip.icon className="h-4 w-4" aria-hidden="true" />
              <span className="font-semibold tabular-nums">{value}</span> {chip.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function PipelineCard({ scope, withEntity }) {
  const pipeline = useQuery({ queryKey: ['dash', 'pipeline', scope], queryFn: () => fetchPipeline(scope), ...live })
  const data = pipeline.data

  return (
    <Panel title="Hiring Pipeline" action={<ViewAll to="/reports" label="View details" />}>
      {pipeline.isLoading ? <Skeleton className="h-32" /> : null}
      {pipeline.isError ? <ErrorState onRetry={() => pipeline.refetch()} /> : null}
      {data ? (
        <>
          <PipelineStages
            stages={[
              { id: 'applied', label: 'Applied', value: data.applied, icon: DocumentTextIcon, to: withEntity('/applications?status=applied') },
              { id: 'review', label: 'Under review', value: data.under_review, icon: MagnifyingGlassIcon, to: withEntity('/applications?status=under_review') },
              { id: 'shortlisted', label: 'Shortlisted', value: data.shortlisted, icon: StarIcon, to: '/interviews?stage=to_schedule' },
              { id: 'interview', label: 'Interview', value: data.interview, icon: CalendarDaysIcon, to: '/interviews?stage=scheduled' },
              { id: 'selected', label: 'Selected', value: data.selected, icon: CheckBadgeIcon, to: '/interviews?stage=selected' },
            ]}
          />
          <p className="mt-3 text-sm text-muted">
            <Link to={withEntity('/applications?status=rejected')} className="inline-flex min-h-11 items-center hover:underline">{data.rejected} rejected</Link> · <Link to="/interviews?stage=not_selected" className="inline-flex min-h-11 items-center hover:underline">{data.not_selected} not selected</Link>
          </p>
        </>
      ) : null}
    </Panel>
  )
}

function OverTimeCard({ scope }) {
  const [range, setRange] = useState('1m')
  const [split, setSplit] = useState(false)
  const chart = useQuery({ queryKey: ['dash', 'over-time', scope, range], queryFn: () => fetchOverTime({ ...scope, range }), ...live })
  const series = split && chart.data
    ? chart.data.entities.map((entity) => ({ key: entity.slug, label: entity.name, color: entity.color ?? '#1E88E5' }))
    : [{ key: 'total', label: 'Applications', color: '#1E88E5' }]

  return (
    <Panel
      title="Applications Over Time"
      action={
        <div className="flex items-center gap-0.5 rounded-full border border-white/70 bg-white/70 p-1" role="group" aria-label="Range">
          {ranges.map((item) => (
            <button key={item.id} type="button" aria-pressed={range === item.id} onClick={() => setRange(item.id)} className={`min-h-10 min-w-11 rounded-full px-2.5 text-xs font-semibold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${range === item.id ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/30' : 'text-navy hover:bg-white'}`}>
              {item.label}
            </button>
          ))}
        </div>
      }
    >
      {chart.isError ? <ErrorState onRetry={() => chart.refetch()} /> : null}
      {chart.isLoading ? <Skeleton className="h-64" /> : null}
      {chart.data ? (
        <>
          <Suspense fallback={<Skeleton className="h-64" />}>
            <AreaChart data={chart.data.buckets} series={series} />
          </Suspense>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-muted"><span className="font-semibold text-navy">{chart.data.total.toLocaleString('en-IN')}</span> applications in this period</span>
            <button type="button" className="min-h-11 rounded-full px-3 font-medium text-brand-700 hover:bg-brand-50" onClick={() => setSplit((value) => !value)} aria-pressed={split}>
              {split ? 'Show total' : 'Split by entity'}
            </button>
          </div>
        </>
      ) : null}
    </Panel>
  )
}

function UpcomingCard({ scope }) {
  const upcoming = useQuery({ queryKey: ['dash', 'upcoming', scope], queryFn: () => fetchUpcoming(scope), ...live })

  return (
    <Panel title="Upcoming Interviews" action={<ViewAll to="/interviews?view=rounds&when=upcoming" />}>
      {upcoming.isLoading ? <Skeleton className="h-48" /> : null}
      {upcoming.isError ? <ErrorState onRetry={() => upcoming.refetch()} /> : null}
      {upcoming.data && !upcoming.data.length ? <EmptyState title="No interviews coming up" /> : null}
      <ul className="flex flex-col gap-3">
        {(upcoming.data ?? []).map((round) => (
          <li key={round.public_id}>
            <Link to={`/interviews?view=rounds&round=${round.public_id}`} className="flex items-center gap-3 rounded-xl p-1.5 transition duration-200 hover:bg-brand-50">
              <Avatar name={round.application?.candidate?.name} src={round.application?.candidate?.avatar_url} initials={round.application?.candidate?.initials} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-navy">{round.application?.candidate?.name}</span>
                <span className="block truncate text-xs text-muted">{round.application?.role}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-xs text-text">{formatDateTime(round.scheduled_at)}</span>
                <Badge color={round.status.color}>{round.round_name}</Badge>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function SourcesCard({ scope }) {
  const sources = useQuery({ queryKey: ['dash', 'sources', scope], queryFn: () => fetchSources({ ...scope, range: '3m' }), ...live })

  return (
    <Panel title="Top Hiring Sources" action={<ViewAll to="/reports?report=by-source" label="View details" />}>
      {sources.isLoading ? <Skeleton className="h-40" /> : null}
      {sources.isError ? <ErrorState onRetry={() => sources.refetch()} /> : null}
      {sources.data ? <DonutChart centreLabel="No applications yet" items={sources.data.map((item) => ({ label: item.label, value: item.total, percent: item.percent, color: item.color }))} /> : null}
      <p className="mt-3 text-xs text-muted">Last 3 months</p>
    </Panel>
  )
}

function RecentCard({ scope }) {
  const recent = useQuery({ queryKey: ['dash', 'recent', scope], queryFn: () => fetchRecent(scope), ...live })
  const rows = recent.data ?? []

  return (
    <Panel title="Recent Candidates" action={<ViewAll to="/candidates" label="View all candidates" />}>
      {recent.isLoading ? <Skeleton className="h-48" /> : null}
      {recent.isError ? <ErrorState onRetry={() => recent.refetch()} /> : null}
      {recent.data && !rows.length ? <EmptyState title="No applications yet" description="They appear here as soon as candidates apply." /> : null}
      {rows.length ? (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-border">
                  <th scope="col" className="py-2 pr-3 font-medium">Name</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Applied role</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Experience</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Applied</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Status</th>
                  <th scope="col" className="py-2 font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.public_id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-3">
                      <Link to={`/candidates/${row.candidate.public_id}`} className="flex min-h-11 items-center gap-2 font-medium text-navy hover:text-brand-700">
                        <Avatar size="sm" name={row.candidate.name} src={row.candidate.avatar_url} initials={row.candidate.initials} />
                        {row.candidate.name}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3"><span className="block">{row.role}</span>{row.entity ? <EntityBadge entity={row.entity} /> : null}</td>
                    <td className="py-2.5 pr-3 text-text">{row.experience !== null && row.experience !== undefined ? `${row.experience}+ years` : '—'}</td>
                    <td className="py-2.5 pr-3 text-text">{formatDate(row.applied_at)}</td>
                    <td className="py-2.5 pr-3"><StatusPill row={row} /></td>
                    <td className="py-2.5"><RowMenu row={row} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((row) => (
              <li key={row.public_id} className="flex items-center gap-3">
                <Avatar name={row.candidate.name} src={row.candidate.avatar_url} initials={row.candidate.initials} />
                <Link to={`/candidates/${row.candidate.public_id}`} className="flex min-h-11 min-w-0 flex-1 flex-col justify-center">
                  <span className="block truncate font-medium text-navy">{row.candidate.name}</span>
                  <span className="block truncate text-xs text-muted">{row.role} · {formatDate(row.applied_at)}</span>
                </Link>
                <StatusPill row={row} />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </Panel>
  )
}

function StatusPill({ row }) {
  if (row.result) return <Badge color={row.result.color}>{row.result.label}</Badge>
  if (row.status.value === 'shortlisted' && row.has_interview) return <Badge color="violet">Interview</Badge>
  return <Badge color={row.status.color}>{row.status.label}</Badge>
}

function RowMenu({ row }) {
  return (
    <Menu as="div" className="relative">
      <MenuButton className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted hover:bg-brand-50" aria-label={`Actions for ${row.candidate.name}`}>
        <EllipsisHorizontalIcon className="h-5 w-5" />
      </MenuButton>
      <MenuItems anchor="bottom end" className="z-[60] w-52 rounded-2xl border border-border bg-white p-1.5 shadow-lift ring-1 ring-black/5 [--anchor-gap:6px] focus:outline-none">
        <MenuItem><Link to={`/candidates/${row.candidate.public_id}`} className="block min-h-11 rounded-lg px-3 py-2.5 text-sm data-[focus]:bg-brand-50">View profile</Link></MenuItem>
        <MenuItem><Link to={`/applications?candidate=${row.candidate.public_id}`} className="block min-h-11 rounded-lg px-3 py-2.5 text-sm data-[focus]:bg-brand-50">Change status</Link></MenuItem>
        <MenuItem><Link to={`/candidates/${row.candidate.public_id}?tab=notes`} className="block min-h-11 rounded-lg px-3 py-2.5 text-sm data-[focus]:bg-brand-50">Add note</Link></MenuItem>
      </MenuItems>
    </Menu>
  )
}

function PromoCard() {
  const promo = useQuery({ queryKey: ['dash', 'promo'], queryFn: () => fetchPromo(), staleTime: 600_000 })
  const data = promo.data

  if (!data) return promo.isLoading ? <Skeleton className="h-48" /> : null

  const photo = data.image && !data.image.endsWith('.svg') ? data.image : null
  const link = (
    <a href={data.careers_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-brand-700 to-brand-500 px-4 text-sm font-medium text-white shadow-md shadow-brand-500/30 transition duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2">
      Open careers site <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
    </a>
  )

  if (photo) {
    // A team photo from Website Content, with the headline on smoked glass.
    return (
      <section className="group relative isolate flex min-h-52 items-end overflow-hidden rounded-3xl p-3 text-white shadow-lift">
        <Photo src={photo} alt="" className="!absolute inset-0 -z-10" imgClassName="transition-transform duration-700 group-hover:scale-105" sizes="(min-width: 1024px) 400px, 100vw" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" aria-hidden="true" />
        <div className="glass-ink w-full rounded-2xl p-4">
          <h2 className="font-display text-xl font-semibold leading-tight">{data.headline}</h2>
          {data.tagline ? <p className="mt-1 text-sm text-white/75">{data.tagline}</p> : null}
          {link}
        </div>
      </section>
    )
  }

  return (
    <section className="glass relative isolate flex flex-col overflow-hidden rounded-3xl">
      <Aurora tone="light" />
      {/* The illustration has its own band, so it never sits on top of the text or the button. */}
      <div className="relative flex h-32 items-end justify-center bg-gradient-to-br from-brand-50 to-cyan-50 px-6 pt-4">
        <img src={data.image || '/images/placeholders/promo.svg'} alt="" className="h-full w-auto max-w-full object-contain object-bottom" loading="lazy" />
      </div>
      <div className="relative z-10 p-6 pt-5">
        <h2 className="font-display text-xl font-semibold leading-tight text-ink">{data.headline}</h2>
        {data.tagline ? <p className="mt-2 text-sm text-muted">{data.tagline}</p> : null}
        {link}
      </div>
    </section>
  )
}

