import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AdjustmentsHorizontalIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  ListBulletIcon,
  PlusIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { Avatar } from '@shared/ui/Avatar'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { Card, PageHeader } from '@shared/ui/Card'
import { ConfirmDialog } from '@shared/ui/ConfirmDialog'
import { DataTable } from '@shared/ui/DataTable'
import { DateInput } from '@shared/ui/DateInput'
import { EntityBadge } from '@shared/ui/EntityBadge'
import { ErrorState } from '@shared/ui/ErrorState'
import { FilterBar } from '@shared/ui/FilterBar'
import { FilterChips } from '@shared/ui/FilterChips'
import { FormField } from '@shared/ui/FormField'
import { Input } from '@shared/ui/Input'
import { SlideOver } from '@shared/ui/Modal'
import { Pagination } from '@shared/ui/Pagination'
import { ResultCount } from '@shared/ui/ResultCount'
import { SearchInput } from '@shared/ui/SearchInput'
import { Select } from '@shared/ui/Select'
import { EmptyState, Skeleton } from '@shared/ui/Skeleton'
import { Tabs } from '@shared/ui/Tabs'
import { useToast } from '@shared/ui/Toast'
import { formatDate, formatDateTime } from '@shared/lib/formatDate'
import { startOfWeek } from '@shared/lib/week'
import { useAuth } from '../auth/AuthProvider'
import { fetchEntities, fetchHrMeta } from '../applications/api'
import { fetchCalendar, fetchPipeline, fetchRounds, setResult } from './api'
import { CalendarWeek } from './CalendarWeek'
import { RoundDetailPanel } from './RoundDetailPanel'
import { ScheduleRoundPanel } from './ScheduleRoundPanel'

const views = [
  { id: 'pipeline', label: 'Candidates', icon: UserGroupIcon },
  { id: 'rounds', label: 'Rounds', icon: ListBulletIcon },
  { id: 'calendar', label: 'Calendar', icon: CalendarDaysIcon },
]

const stages = [
  { id: '', label: 'All' },
  { id: 'to_schedule', label: 'To schedule' },
  { id: 'scheduled', label: 'In progress' },
  { id: 'awaiting_decision', label: 'All rounds passed' },
  { id: 'selected', label: 'Selected' },
  { id: 'not_selected', label: 'Not selected' },
]

const whenOptions = [
  { value: '', label: 'Any time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
]

export function InterviewsPage() {
  const { user } = useAuth()
  const canManage = user?.permissions?.includes('interviews.manage')
  const [params, setParams] = useSearchParams()
  const view = params.get('view') || 'pipeline'
  const [scheduleFor, setScheduleFor] = useState(null)
  const [reschedule, setReschedule] = useState(null)
  const [selected, setSelected] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const meta = useQuery({ queryKey: ['hr-meta'], queryFn: fetchHrMeta, staleTime: 600_000 })
  const entities = useQuery({ queryKey: ['public-entities'], queryFn: fetchEntities, staleTime: 600_000 })

  function update(patch) {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([key, value]) => (value ? next.set(key, String(value)) : next.delete(key)))
    if (!('page' in patch)) next.delete('page')
    setParams(next, { replace: true })
  }

  const filters = Object.fromEntries(params.entries())
  const shared = { q: filters.q, entity: filters.entity, job: filters.job, candidate: filters.candidate }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Interviews"
        subtitle="Schedule rounds, record results and keep the HR calendar in sync."
        actions={<Button variant="secondary" icon={CalendarDaysIcon} onClick={() => update({ view: 'calendar' })}>Open calendar</Button>}
      />
      <Tabs items={views} value={view} onChange={(next) => update({ view: next === 'pipeline' ? '' : next })} label="Interview views" />
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="flex-1">
          <SearchInput id="interview-search" value={filters.q ?? ''} onChange={(q) => update({ q })} placeholder="Search candidate, email or role" label="Search interviews" />
        </div>
        <Button className="lg:hidden" variant="secondary" icon={AdjustmentsHorizontalIcon} onClick={() => setFiltersOpen(true)}>Filters</Button>
      </div>
      <div className="hidden lg:block">
        <InterviewFilters view={view} values={filters} onChange={update} meta={meta.data} entities={entities.data ?? []} />
      </div>
      {view === 'pipeline' ? (
        <PipelineView filters={{ ...shared, stage: filters.stage, page: filters.page }} onChange={update} canManage={canManage} onSchedule={setScheduleFor} />
      ) : null}
      {view === 'rounds' ? (
        <RoundsView filters={filters} onChange={update} onSelect={setSelected} />
      ) : null}
      {view === 'calendar' ? (
        <CalendarView filters={filters} onChange={update} onSelect={setSelected} />
      ) : null}
      <SlideOver open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        <InterviewFilters view={view} values={filters} onChange={update} meta={meta.data} entities={entities.data ?? []} />
        <Button className="mt-4 w-full" onClick={() => setFiltersOpen(false)}>Show results</Button>
      </SlideOver>
      <ScheduleRoundPanel open={Boolean(scheduleFor) || Boolean(reschedule)} onClose={() => { setScheduleFor(null); setReschedule(null) }} application={scheduleFor} round={reschedule} />
      <RoundDetailPanel round={selected} canManage={canManage} onClose={() => setSelected(null)} onReschedule={(round) => { setSelected(null); setReschedule(round) }} />
    </div>
  )
}

function PipelineView({ filters, onChange, canManage, onSchedule }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [decision, setDecision] = useState(null)
  const list = useQuery({ queryKey: ['hr-interviews', 'pipeline', filters], queryFn: () => fetchPipeline(filters), placeholderData: keepPreviousData })
  const counts = list.data?.counts ?? {}
  const rows = list.data?.data ?? []

  const result = useMutation({
    mutationFn: ({ application, value }) => setResult(application.public_id, value),
    onSuccess: (_data, { value }) => {
      toast.push({ tone: 'success', message: value === 'selected' ? 'Candidate marked Selected. Move them to the HRMS when ready.' : 'Candidate marked Not selected' })
      setDecision(null)
      queryClient.invalidateQueries({ queryKey: ['hr-interviews'] })
      queryClient.invalidateQueries({ queryKey: ['hr-applications'] })
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })

  return (
    <>
      <Tabs items={stages.map((stage) => ({ ...stage, count: counts[stage.id || 'all'] ?? 0 }))} value={filters.stage ?? ''} onChange={(stage) => onChange({ stage })} label="Interview stage" />
      <ResultCount count={list.data?.meta?.total ?? 0} noun="candidates" />
      {list.isLoading ? <Skeleton className="h-64" /> : null}
      {list.isError ? <ErrorState onRetry={() => list.refetch()} /> : null}
      {!list.isLoading && !list.isError && rows.length === 0 ? (
        <EmptyState title="No candidates in this stage" description="Shortlist applications to start scheduling interviews." action={<Link className="text-brand-700 underline" to="/applications?status=under_review">Review applications</Link>} />
      ) : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((application) => (
          <Card key={application.public_id} className="flex min-w-0 flex-col gap-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
            <div className="flex items-start gap-3">
              <Avatar name={application.candidate?.name} src={application.candidate?.avatar_url} initials={application.candidate?.initials} />
              <div className="min-w-0 flex-1">
                <Link to={`/candidates/${application.candidate?.public_id}`} className="inline-flex min-h-11 items-center font-medium text-brand-700 hover:underline">{application.candidate?.name}</Link>
                <p className="truncate text-sm text-muted">{application.role}</p>
              </div>
              {application.result ? <Badge color={application.result.color}>{application.result.label}</Badge> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <EntityBadge entity={application.entity} />
              {application.is_flagged ? <Badge color="amber">Blacklisted</Badge> : null}
              <span className="text-xs text-muted">Shortlisted {formatDate(application.shortlisted_at)}</span>
            </div>
            <ol className="flex flex-wrap gap-2" aria-label="Rounds">
              {application.rounds.length === 0 ? <li className="text-sm text-muted">No rounds yet</li> : null}
              {application.rounds.map((round) => (
                <li key={round.public_id}>
                  <Badge color={round.status.color}>{round.round_number}. {round.round_name}: {round.status.label}</Badge>
                </li>
              ))}
            </ol>
            {canManage ? (
              <div className="mt-auto flex flex-wrap gap-2">
                {application.can_schedule ? (
                  <Button size="sm" icon={PlusIcon} onClick={() => onSchedule(application)}>{application.rounds.length ? 'Next round' : 'Schedule'}</Button>
                ) : null}
                {application.can_select ? (
                  <Button size="sm" variant="secondary" icon={CheckBadgeIcon} onClick={() => setDecision({ application, value: 'selected' })}>Mark selected</Button>
                ) : null}
                {application.can_reject ? (
                  <Button size="sm" variant="ghost" icon={XMarkIcon} onClick={() => setDecision({ application, value: 'not_selected' })}>Not selected</Button>
                ) : null}
              </div>
            ) : null}
          </Card>
        ))}
      </div>
      <Pagination page={Number(filters.page) || 1} pageCount={list.data?.meta?.last_page ?? 1} perPage={25} onPageChange={(page) => onChange({ page })} onPerPageChange={() => {}} perPageOptions={[25]} />
      <ConfirmDialog
        open={Boolean(decision)}
        onClose={() => setDecision(null)}
        onConfirm={() => result.mutate(decision)}
        loading={result.isPending}
        tone={decision?.value === 'selected' ? 'primary' : 'danger'}
        title={decision?.value === 'selected' ? 'Mark as Selected?' : 'Mark as Not selected?'}
        message={decision?.value === 'selected'
          ? `${decision?.application.candidate?.name} passed every round. Nothing else happens in the portal; move them to the HRMS manually.`
          : `${decision?.application.candidate?.name} will not be able to apply for this same role for 6 months. No email is sent.`}
        confirmLabel={decision?.value === 'selected' ? 'Mark selected' : 'Mark not selected'}
      />
    </>
  )
}

function RoundsView({ filters, onChange, onSelect }) {
  const query = { ...filters, view: undefined, page: Number(filters.page) || 1, per_page: Number(filters.per_page) || 25 }
  const list = useQuery({ queryKey: ['hr-interviews', 'rounds', query], queryFn: () => fetchRounds(query), placeholderData: keepPreviousData })
  const rows = list.data?.data ?? []
  const counts = list.data?.counts ?? {}
  const columns = useMemo(() => roundColumns(onSelect), [onSelect])
  const chips = [
    filters.when ? { key: 'when', label: whenOptions.find((item) => item.value === filters.when)?.label, onRemove: () => onChange({ when: '' }) } : null,
    filters.status ? { key: 'status', label: filters.status.replace('_', ' '), onRemove: () => onChange({ status: '' }) } : null,
    filters.sync ? { key: 'sync', label: `Calendar: ${filters.sync}`, onRemove: () => onChange({ sync: '' }) } : null,
    filters.interviewer ? { key: 'interviewer', label: filters.interviewer, onRemove: () => onChange({ interviewer: '' }) } : null,
  ].filter(Boolean)

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <QuickCount label="Today" value={counts.when?.today} active={filters.when === 'today'} onClick={() => onChange({ when: filters.when === 'today' ? '' : 'today' })} />
        <QuickCount label="This week" value={counts.when?.week} active={filters.when === 'week'} onClick={() => onChange({ when: filters.when === 'week' ? '' : 'week' })} />
        <QuickCount label="Upcoming" value={counts.when?.upcoming} active={filters.when === 'upcoming'} onClick={() => onChange({ when: filters.when === 'upcoming' ? '' : 'upcoming' })} />
        <QuickCount label="Sync failed" value={counts.sync?.failed ?? 0} tone="danger" active={filters.sync === 'failed'} onClick={() => onChange({ sync: filters.sync === 'failed' ? '' : 'failed' })} />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ResultCount count={list.data?.meta?.total ?? 0} noun="rounds" />
        <FilterChips chips={chips} onClear={() => onChange({ when: '', status: '', sync: '', interviewer: '', mode: '', from: '', to: '' })} />
      </div>
      {list.isLoading ? <Skeleton className="h-64" /> : null}
      {list.isError ? <ErrorState onRetry={() => list.refetch()} /> : null}
      {!list.isLoading && !list.isError && rows.length === 0 ? <EmptyState title="No interview rounds match these filters" /> : null}
      {rows.length > 0 ? (
        <DataTable
          columns={columns}
          data={rows}
          sorting={[{ id: filters.sort || 'scheduled_at', desc: filters.direction === 'desc' }]}
          onSortingChange={(next) => {
            const item = next[0]
            onChange(item ? { sort: item.id, direction: item.desc ? 'desc' : 'asc' } : { sort: '', direction: '' })
          }}
          getRowId={(row) => row.public_id}
          renderCard={(round) => (
            <button type="button" className="w-full text-left" onClick={() => onSelect(round)}>
              <p className="font-medium text-navy">{formatDateTime(round.scheduled_at)}</p>
              <p className="text-sm">{round.application?.candidate?.name} · {round.round_name}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge color={round.status.color}>{round.status.label}</Badge>
                <Badge color={round.calendar.status.color}>Calendar: {round.calendar.status.label}</Badge>
              </div>
            </button>
          )}
        />
      ) : null}
      <Pagination
        page={Number(filters.page) || 1}
        pageCount={list.data?.meta?.last_page ?? 1}
        perPage={Number(filters.per_page) || 25}
        onPageChange={(page) => onChange({ page })}
        onPerPageChange={(per_page) => onChange({ per_page })}
      />
    </>
  )
}

function CalendarView({ filters, onChange, onSelect }) {
  const weekStart = startOfWeek(filters.week || undefined)
  const range = { ...filters, view: undefined, week: undefined, from: weekStart.format('YYYY-MM-DD'), to: weekStart.add(6, 'day').format('YYYY-MM-DD') }
  const calendar = useQuery({ queryKey: ['hr-interviews', 'calendar', range], queryFn: () => fetchCalendar(range), placeholderData: keepPreviousData })

  if (calendar.isError) return <ErrorState onRetry={() => calendar.refetch()} />

  return (
    <CalendarWeek
      weekStart={weekStart}
      rounds={calendar.data ?? []}
      loading={calendar.isLoading}
      onSelect={onSelect}
      onNavigate={(next) => onChange({ week: next.format('YYYY-MM-DD') })}
    />
  )
}

function QuickCount({ label, value = 0, active, onClick, tone }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition duration-200 ${active ? 'bg-navy text-white' : 'bg-white text-navy shadow-card hover:bg-brand-50'}`}
    >
      {label}
      <span className={`rounded-full px-2 py-0.5 text-xs ${tone === 'danger' && value > 0 ? 'bg-red-100 text-red-700' : active ? 'bg-white/20' : 'bg-brand-50 text-brand-700'}`}>{value}</span>
    </button>
  )
}

function InterviewFilters({ view, values, onChange, meta, entities }) {
  const enums = meta?.enums ?? {}
  const options = (list, all) => [{ value: '', label: all }, ...(list ?? []).map((item) => ({ value: item.value, label: item.label }))]

  return (
    <FilterBar className="xl:grid-cols-4">
      <FormField id="iv-entity" label="Entity">
        <Select id="iv-entity" value={values.entity ?? ''} onChange={(entity) => onChange({ entity })} options={[{ value: '', label: 'All entities' }, ...entities.map((entity) => ({ value: entity.slug, label: entity.name }))]} />
      </FormField>
      <FormField id="iv-job" label="Job or role">
        <Input id="iv-job" value={values.job ?? ''} onChange={(event) => onChange({ job: event.target.value })} />
      </FormField>
      {view !== 'pipeline' ? (
        <>
          <FormField id="iv-status" label="Round status">
            <Select id="iv-status" value={values.status ?? ''} onChange={(status) => onChange({ status })} options={options(enums.round_statuses, 'All statuses')} />
          </FormField>
          <FormField id="iv-mode" label="Mode">
            <Select id="iv-mode" value={values.mode ?? ''} onChange={(mode) => onChange({ mode })} options={options(enums.interview_modes, 'All modes')} />
          </FormField>
          <FormField id="iv-interviewer" label="Interviewer">
            <Input id="iv-interviewer" value={values.interviewer ?? ''} onChange={(event) => onChange({ interviewer: event.target.value })} placeholder="Name or email" />
          </FormField>
          <FormField id="iv-sync" label="Calendar sync">
            <Select id="iv-sync" value={values.sync ?? ''} onChange={(sync) => onChange({ sync })} options={options(enums.calendar_sync_statuses, 'Any')} />
          </FormField>
        </>
      ) : null}
      {view === 'rounds' ? (
        <>
          <FormField id="iv-when" label="When">
            <Select id="iv-when" value={values.when ?? ''} onChange={(when) => onChange({ when })} options={whenOptions} />
          </FormField>
          <FormField id="iv-from" label="From">
            <DateInput id="iv-from" value={values.from ?? ''} onChange={(from) => onChange({ from })} />
          </FormField>
          <FormField id="iv-to" label="To">
            <DateInput id="iv-to" value={values.to ?? ''} onChange={(to) => onChange({ to })} />
          </FormField>
        </>
      ) : null}
    </FilterBar>
  )
}

function roundColumns(onSelect) {
  return [
    { id: 'scheduled_at', header: 'When', cell: ({ row }) => <button type="button" className="font-medium text-brand-700 hover:underline" onClick={() => onSelect(row.original)}>{formatDateTime(row.original.scheduled_at)}</button> },
    {
      id: 'candidate',
      header: 'Candidate',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="flex items-center gap-2">
          <Avatar size="sm" name={row.original.application?.candidate?.name} src={row.original.application?.candidate?.avatar_url} initials={row.original.application?.candidate?.initials} />
          <Link className="text-navy hover:underline" to={`/candidates/${row.original.application?.candidate?.public_id}`}>{row.original.application?.candidate?.name}</Link>
        </span>
      ),
    },
    { id: 'role', header: 'Role', enableSorting: false, cell: ({ row }) => row.original.application?.role },
    { id: 'entity', header: 'Entity', enableSorting: false, cell: ({ row }) => <EntityBadge entity={row.original.application?.entity} /> },
    { id: 'round', header: 'Round', enableSorting: false, cell: ({ row }) => `${row.original.round_number}. ${row.original.round_name}` },
    { id: 'mode', header: 'Mode', enableSorting: false, cell: ({ row }) => row.original.mode.label },
    { id: 'interviewer', header: 'Interviewer', cell: ({ row }) => row.original.interviewer_name },
    { id: 'status', header: 'Status', cell: ({ row }) => <Badge color={row.original.status.color}>{row.original.status.label}</Badge> },
    { id: 'calendar', header: 'Calendar', enableSorting: false, cell: ({ row }) => <Badge color={row.original.calendar.status.color}>{row.original.calendar.status.label}</Badge> },
  ]
}
