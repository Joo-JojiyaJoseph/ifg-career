import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdjustmentsHorizontalIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Button } from '@shared/ui/Button'
import { PageHeader } from '@shared/ui/Card'
import { DataTable } from '@shared/ui/DataTable'
import { DateInput } from '@shared/ui/DateInput'
import { EmptyState, Skeleton } from '@shared/ui/Skeleton'
import { EntityBadge } from '@shared/ui/EntityBadge'
import { ErrorState } from '@shared/ui/ErrorState'
import { FilterBar } from '@shared/ui/FilterBar'
import { FilterChips } from '@shared/ui/FilterChips'
import { FormField } from '@shared/ui/FormField'
import { Checkbox, Input } from '@shared/ui/Input'
import { MultiSelect } from '@shared/ui/MultiSelect'
import { Pagination } from '@shared/ui/Pagination'
import { ResultCount } from '@shared/ui/ResultCount'
import { SavedFilters } from '@shared/ui/SavedFilters'
import { SearchInput } from '@shared/ui/SearchInput'
import { Select } from '@shared/ui/Select'
import { SlideOver } from '@shared/ui/Modal'
import { StatusBadge } from '@shared/ui/Badge'
import { useToast } from '@shared/ui/Toast'
import { formatDate } from '@shared/lib/formatDate'
import { useSlashFocus } from '@shared/hooks/useSlashFocus'
import { useAuth } from '../auth/AuthProvider'
import { bulkJobs, deleteFilter, fetchEntities, fetchHrMeta, fetchJobs, fetchSavedFilters, saveFilter } from './api'

function asList(value) {
  return Array.isArray(value) ? value : []
}

const emptyFilters = {
  q: '',
  entity: '',
  department: '',
  team: '',
  level: '',
  location: '',
  status: '',
  skills: [],
  created_by: '',
  posted_from: '',
  posted_to: '',
  last_date_from: '',
  last_date_to: '',
  closing_within: '',
  has_applications: '',
  sort: 'posted_at',
  direction: 'desc',
  page: '1',
  per_page: '25',
}

export function JobListPage() {
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const filters = readFilters(params)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(filters)
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState({})
  const [visibilityEmail, setVisibilityEmail] = useState('')
  if (user?.email && user.email !== visibilityEmail) {
    setVisibilityEmail(user.email)
    try {
      setColumnVisibility(JSON.parse(window.localStorage.getItem(columnKey(user.email)) || '{}'))
    } catch {
      setColumnVisibility({})
    }
  }
  const searchRef = useRef(null)
  const appliedDefault = useRef(false)
  useSlashFocus(searchRef)
  const canPublish = user?.permissions?.includes('jobs.publish')
  const canManage = user?.permissions?.includes('jobs.manage')

  const meta = useQuery({ queryKey: ['hr-meta'], queryFn: fetchHrMeta, staleTime: 600_000 })
  const entities = useQuery({ queryKey: ['public-entities'], queryFn: fetchEntities, staleTime: 600_000 })
  const saved = useQuery({ queryKey: ['saved-filters', 'jobs'], queryFn: fetchSavedFilters })
  const list = useQuery({
    queryKey: ['hr-jobs', filters],
    queryFn: () => fetchJobs(toQuery(filters)),
    placeholderData: keepPreviousData,
  })
  const draftCount = useQuery({
    queryKey: ['hr-jobs-count', draft],
    queryFn: () => fetchJobs({ ...toQuery(draft), per_page: 25, page: 1 }),
    enabled: open,
  })

  useEffect(() => {
    if (appliedDefault.current || !saved.data) return
    appliedDefault.current = true
    const active = [...params.keys()].some((key) => !['page', 'per_page', 'sort', 'direction'].includes(key))
    if (active) return
    const fallback = saved.data.find((item) => item.is_default && item.mine)
    if (!fallback?.query) return
    const next = new URLSearchParams()
    Object.entries(fallback.query).forEach(([key, value]) => writeParam(next, key, value))
    setParams(next, { replace: true })
  }, [saved.data, params, setParams])

  const rows = list.data?.data ?? []
  const total = list.data?.meta?.total ?? 0
  const selected = Object.keys(rowSelection).filter((id) => rowSelection[id])
  const columns = useMemo(() => jobColumns(), [])

  const saveMutation = useMutation({
    mutationFn: saveFilter,
    onSuccess: () => {
      toast.push({ tone: 'success', message: 'Filter saved' })
      queryClient.invalidateQueries({ queryKey: ['saved-filters', 'jobs'] })
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })
  const deleteMutation = useMutation({
    mutationFn: deleteFilter,
    onSuccess: () => {
      toast.push({ tone: 'success', message: 'Filter deleted' })
      queryClient.invalidateQueries({ queryKey: ['saved-filters', 'jobs'] })
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })
  const bulkMutation = useMutation({
    mutationFn: ({ action, ids }) => bulkJobs(action, ids),
    onSuccess: (result) => {
      const failed = result.failed?.length ?? 0
      toast.push({
        tone: failed ? 'warning' : 'success',
        message: failed ? `${result.updated} updated. ${failed} could not be updated.` : 'Roles updated',
      })
      setRowSelection({})
      queryClient.invalidateQueries({ queryKey: ['hr-jobs'] })
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })

  function update(patch, keepPage = false) {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([key, value]) => writeParam(next, key, value))
    if (!keepPage && !Object.prototype.hasOwnProperty.call(patch, 'page')) next.delete('page')
    setParams(next, { replace: true })
  }

  function applyQuery(query) {
    const next = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => writeParam(next, key, value))
    setParams(next, { replace: true })
  }

  function clearAll() {
    setParams(new URLSearchParams(), { replace: true })
  }

  const chips = buildChips(filters, meta.data, entities.data, update)

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Jobs"
        subtitle="Create, publish and close roles across Infolks Group."
        actions={canManage ? <Link to="/jobs/new" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-5 text-sm font-medium text-white"><PlusIcon className="h-5 w-5" /> New role</Link> : null}
      />
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="flex-1">
          <SearchInput ref={searchRef} id="job-search" value={filters.q} onChange={(q) => update({ q })} placeholder="Search roles" label="Search roles" />
        </div>
        <Button className="lg:hidden" variant="secondary" icon={AdjustmentsHorizontalIcon} onClick={() => { setDraft(filters); setOpen(true) }}>
          Filters
        </Button>
      </div>
      <div className="hidden lg:block">
        <JobFilters values={filters} onChange={update} meta={meta.data} entities={entities.data ?? []} />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ResultCount count={total} noun="roles" />
        <FilterChips chips={chips} onClear={clearAll} />
      </div>
      {canPublish && selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" loading={bulkMutation.isPending} onClick={() => bulkMutation.mutate({ action: 'publish', ids: selected })}>Publish</Button>
          <Button size="sm" variant="secondary" loading={bulkMutation.isPending} onClick={() => bulkMutation.mutate({ action: 'unpublish', ids: selected })}>Unpublish</Button>
          <Button size="sm" variant="danger" loading={bulkMutation.isPending} onClick={() => bulkMutation.mutate({ action: 'close', ids: selected })}>Close</Button>
        </div>
      ) : null}
      {list.isLoading ? <Skeleton className="h-64" /> : null}
      {list.isError ? <ErrorState onRetry={() => list.refetch()} /> : null}
      {!list.isLoading && !list.isError && rows.length === 0 ? (
        <EmptyState title="No roles match these filters" description="Create a role or clear the filters." action={<Button onClick={clearAll}>Clear filters</Button>} />
      ) : null}
      {rows.length > 0 ? (
        <DataTable
          columns={columns}
          data={rows}
          selectable={Boolean(canPublish)}
          sorting={[{ id: filters.sort, desc: filters.direction !== 'asc' }]}
          onSortingChange={(next) => {
            const item = next[0]
            update(item ? { sort: item.id, direction: item.desc ? 'desc' : 'asc' } : { sort: 'posted_at', direction: 'desc' })
          }}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={(next) => {
            setColumnVisibility(next)
            if (user?.email) window.localStorage.setItem(columnKey(user.email), JSON.stringify(next))
          }}
          getRowId={(row) => row.public_id}
          renderCard={(job) => <JobSummary job={job} />}
        />
      ) : null}
      <Pagination
        page={Number(filters.page)}
        pageCount={list.data?.meta?.last_page ?? 1}
        perPage={Number(filters.per_page)}
        onPageChange={(page) => update({ page: String(page) }, true)}
        onPerPageChange={(perPage) => update({ per_page: String(perPage) })}
      />
      <SavedFilters
        items={saved.data ?? []}
        saving={saveMutation.isPending}
        onApply={(item) => applyQuery(item.query)}
        onDelete={(item) => deleteMutation.mutate(item.id)}
        onSave={(payload) => saveMutation.mutate({ ...payload, query: currentQuery(filters) })}
      />
      <SlideOver open={open} onClose={() => setOpen(false)} title="Filters">
        <div className="flex flex-col gap-4">
          <JobFilters values={draft} onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))} meta={meta.data} entities={entities.data ?? []} />
          <Button className="sticky bottom-0 w-full" onClick={() => { applyQuery({ ...currentQuery(draft), sort: draft.sort, direction: draft.direction }); setOpen(false) }}>
            Apply filters ({draftCount.isFetching ? '…' : draftCount.data?.meta?.total ?? 0})
          </Button>
        </div>
      </SlideOver>
    </div>
  )
}

function JobSummary({ job }) {
  return (
    <div>
      <Link className="font-medium text-brand-700" to={`/jobs/${job.public_id}/edit`}>{job.title}</Link>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <EntityBadge entity={job.entity} />
        <StatusBadge status={job.status} />
      </div>
      <p className="mt-2 text-sm text-muted">{job.department?.name || 'No department'} · Posted {formatDate(job.posted_at)} · Closes {formatDate(job.last_date_to_apply)}</p>
      <Link className="mt-2 inline-flex min-h-11 items-center text-sm text-brand-700" to={`/applications?job=${job.public_id}`}>{job.applications_count ?? 0} applications</Link>
    </div>
  )
}

function JobFilters({ values, onChange, meta, entities }) {
  const teams = asList(meta?.teams).filter((team) => !values.department || String(team.department_id) === values.department)
  return (
    <FilterBar>
      <FormField id="hr-entity" label="Entity">
        <Select id="hr-entity" value={values.entity} onChange={(entity) => onChange({ entity })} options={[{ value: '', label: 'All entities' }, ...entities.map((entity) => ({ value: entity.slug, label: entity.name }))]} />
      </FormField>
      <FormField id="hr-department" label="Department">
        <Select id="hr-department" value={values.department} onChange={(department) => onChange({ department, team: '' })} options={[{ value: '', label: 'All departments' }, ...asList(meta?.departments).map((department) => ({ value: String(department.id), label: department.name }))]} />
      </FormField>
      <FormField id="hr-team" label="Team">
        <Select id="hr-team" value={values.team} onChange={(team) => onChange({ team })} options={[{ value: '', label: 'All teams' }, ...teams.map((team) => ({ value: String(team.id), label: team.name }))]} />
      </FormField>
      <FormField id="hr-level" label="Level">
        <Select id="hr-level" value={values.level} onChange={(level) => onChange({ level })} options={[{ value: '', label: 'All levels' }, ...asList(meta?.enums?.job_levels).map((level) => ({ value: level.value, label: level.label }))]} />
      </FormField>
      <FormField id="hr-status" label="Status">
        <Select id="hr-status" value={values.status} onChange={(status) => onChange({ status })} options={[{ value: '', label: 'All statuses' }, ...asList(meta?.enums?.job_statuses).map((status) => ({ value: status.value, label: status.label }))]} />
      </FormField>
      <FormField id="hr-location" label="Location">
        <Input id="hr-location" value={values.location} onChange={(event) => onChange({ location: event.target.value })} />
      </FormField>
      <FormField id="hr-created-by" label="Created by">
        <Input id="hr-created-by" value={values.created_by} placeholder="Email" onChange={(event) => onChange({ created_by: event.target.value })} />
      </FormField>
      <FormField id="hr-closing-within" label="Closing within days">
        <Input id="hr-closing-within" inputMode="numeric" value={values.closing_within} onChange={(event) => onChange({ closing_within: event.target.value.replace(/\D/g, '') })} />
      </FormField>
      <FormField id="hr-posted-from" label="Posted from">
        <DateInput id="hr-posted-from" value={values.posted_from} onChange={(posted_from) => onChange({ posted_from })} />
      </FormField>
      <FormField id="hr-posted-to" label="Posted to">
        <DateInput id="hr-posted-to" value={values.posted_to} onChange={(posted_to) => onChange({ posted_to })} />
      </FormField>
      <FormField id="hr-last-from" label="Last date from">
        <DateInput id="hr-last-from" value={values.last_date_from} onChange={(last_date_from) => onChange({ last_date_from })} />
      </FormField>
      <FormField id="hr-last-to" label="Last date to">
        <DateInput id="hr-last-to" value={values.last_date_to} onChange={(last_date_to) => onChange({ last_date_to })} />
      </FormField>
      <FormField id="hr-skills" label="Skills">
        <MultiSelect id="hr-skills" value={values.skills} onChange={(skills) => onChange({ skills })} options={asList(meta?.skills).map((skill) => ({ value: skill.slug, label: skill.name }))} />
      </FormField>
      <Checkbox label="Has applications" checked={values.has_applications === '1'} onChange={(event) => onChange({ has_applications: event.target.checked ? '1' : '' })} />
    </FilterBar>
  )
}

function jobColumns() {
  return [
    { id: 'title', accessorKey: 'title', header: 'Title', cell: ({ row }) => <Link className="font-medium text-brand-700" to={`/jobs/${row.original.public_id}/edit`}>{row.original.title}</Link> },
    { id: 'entity', header: 'Entity', enableSorting: false, cell: ({ row }) => <EntityBadge entity={row.original.entity} /> },
    { id: 'department', header: 'Department', enableSorting: false, cell: ({ row }) => row.original.department?.name || '—' },
    { id: 'level', header: 'Level', enableSorting: false, cell: ({ row }) => row.original.level?.label || '—' },
    { id: 'status', accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { id: 'applications', header: 'Applications', cell: ({ row }) => <Link className="text-brand-700" to={`/applications?job=${row.original.public_id}`}>{row.original.applications_count ?? 0}</Link> },
    { id: 'posted_at', header: 'Posted', cell: ({ row }) => formatDate(row.original.posted_at) },
    { id: 'closing', header: 'Closes', cell: ({ row }) => formatDate(row.original.last_date_to_apply) },
  ]
}

function readFilters(params) {
  return {
    ...emptyFilters,
    ...Object.fromEntries([...params.entries()]),
    skills: (params.get('skills') ?? '').split(',').filter(Boolean),
  }
}

function toQuery(filters) {
  return {
    q: filters.q,
    entity: filters.entity,
    department: filters.department,
    team: filters.team,
    level: filters.level,
    location: filters.location,
    status: filters.status,
    skills: filters.skills.join(','),
    created_by: filters.created_by,
    posted_from: filters.posted_from,
    posted_to: filters.posted_to,
    last_date_from: filters.last_date_from,
    last_date_to: filters.last_date_to,
    closing_within: filters.closing_within,
    has_applications: filters.has_applications,
    sort: filters.sort,
    direction: filters.direction,
    page: Number(filters.page) || 1,
    per_page: Number(filters.per_page) || 25,
  }
}

function currentQuery(filters) {
  const query = { ...filters }
  delete query.page
  delete query.per_page
  delete query.sort
  delete query.direction
  return query
}

function writeParam(params, key, value) {
  const text = Array.isArray(value) ? value.join(',') : value == null ? '' : String(value)
  if (!text) params.delete(key)
  else params.set(key, text)
}

function buildChips(filters, meta, entities, update) {
  const chips = []
  const remove = (key) => update({ [key]: emptyFilters[key] })
  if (filters.q) chips.push({ key: 'q', label: `Search: ${filters.q}`, onRemove: () => remove('q') })
  if (filters.entity) chips.push({ key: 'entity', label: entities?.find((entity) => entity.slug === filters.entity)?.name ?? filters.entity, onRemove: () => remove('entity') })
  if (filters.department) chips.push({ key: 'department', label: meta?.departments?.find((item) => String(item.id) === filters.department)?.name ?? 'Department', onRemove: () => remove('department') })
  if (filters.team) chips.push({ key: 'team', label: meta?.teams?.find((item) => String(item.id) === filters.team)?.name ?? 'Team', onRemove: () => remove('team') })
  if (filters.level) chips.push({ key: 'level', label: meta?.enums?.job_levels?.find((item) => item.value === filters.level)?.label ?? filters.level, onRemove: () => remove('level') })
  if (filters.status) chips.push({ key: 'status', label: meta?.enums?.job_statuses?.find((item) => item.value === filters.status)?.label ?? filters.status, onRemove: () => remove('status') })
  if (filters.location) chips.push({ key: 'location', label: filters.location, onRemove: () => remove('location') })
  if (filters.created_by) chips.push({ key: 'created_by', label: filters.created_by, onRemove: () => remove('created_by') })
  if (filters.posted_from) chips.push({ key: 'posted_from', label: `Posted from ${formatDate(filters.posted_from)}`, onRemove: () => remove('posted_from') })
  if (filters.posted_to) chips.push({ key: 'posted_to', label: `Posted to ${formatDate(filters.posted_to)}`, onRemove: () => remove('posted_to') })
  if (filters.last_date_from) chips.push({ key: 'last_date_from', label: `Closes from ${formatDate(filters.last_date_from)}`, onRemove: () => remove('last_date_from') })
  if (filters.last_date_to) chips.push({ key: 'last_date_to', label: `Closes to ${formatDate(filters.last_date_to)}`, onRemove: () => remove('last_date_to') })
  if (filters.closing_within) chips.push({ key: 'closing_within', label: `Closing within ${filters.closing_within} days`, onRemove: () => remove('closing_within') })
  if (filters.has_applications === '1') chips.push({ key: 'has_applications', label: 'Has applications', onRemove: () => remove('has_applications') })
  filters.skills.forEach((slug) => {
    chips.push({
      key: `skill-${slug}`,
      label: meta?.skills?.find((skill) => skill.slug === slug)?.name ?? slug,
      onRemove: () => update({ skills: filters.skills.filter((item) => item !== slug) }),
    })
  })
  return chips
}

function columnKey(email) {
  return `portal.jobs.columns.${email}`
}
