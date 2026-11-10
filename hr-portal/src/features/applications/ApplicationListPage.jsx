import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { PageHeader } from '@shared/ui/Card'
import { ColumnsMenu } from '@shared/ui/ColumnsMenu'
import { DataTable } from '@shared/ui/DataTable'
import { DateInput } from '@shared/ui/DateInput'
import { EmptyState, Skeleton } from '@shared/ui/Skeleton'
import { EntityBadge } from '@shared/ui/EntityBadge'
import { ErrorState } from '@shared/ui/ErrorState'
import { FilterBar } from '@shared/ui/FilterBar'
import { FilterChips } from '@shared/ui/FilterChips'
import { FilterPanel } from '@shared/ui/FilterPanel'
import { FilterToolbar, QuickFilter } from '@shared/ui/FilterToolbar'
import { FormField } from '@shared/ui/FormField'
import { Input } from '@shared/ui/Input'
import { Modal } from '@shared/ui/Modal'
import { Pagination } from '@shared/ui/Pagination'
import { ResultCount } from '@shared/ui/ResultCount'
import { SavedFilters } from '@shared/ui/SavedFilters'
import { SelectionBar } from '@shared/ui/SelectionBar'
import { SearchInput } from '@shared/ui/SearchInput'
import { Select } from '@shared/ui/Select'
import { useToast } from '@shared/ui/Toast'
import { formatDate } from '@shared/lib/formatDate'
import { useSlashFocus } from '@shared/hooks/useSlashFocus'
import { useAuth } from '../auth/AuthProvider'
import { useQueuedExport } from '../exports/useQueuedExport'
import { ScheduleRoundPanel } from '../interviews/ScheduleRoundPanel'
import {
  assignJob,
  bulkStatus,
  deleteFilter,
  fetchApplications,
  fetchEntities,
  fetchHrMeta,
  fetchOpenJobs,
  fetchSavedFilters,
  saveFilter,
  undoStatus,
  updateStatus,
} from './api'

function asList(value) {
  return Array.isArray(value) ? value : []
}

const emptyFilters = {
  q: '',
  type: '',
  entity: '',
  job: '',
  candidate: '',
  department: '',
  level: '',
  source: '',
  gender: '',
  referred: '',
  status: '',
  result: '',
  applied_from: '',
  applied_to: '',
  has_interview: '',
  flagged: '',
  sort: 'applied_at',
  direction: 'desc',
  page: '1',
  per_page: '25',
}

export function ApplicationListPage() {
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
  const [assignTarget, setAssignTarget] = useState(null)
  const [scheduleTarget, setScheduleTarget] = useState(null)
  const canSchedule = user?.permissions?.includes('interviews.manage')
  const [jobId, setJobId] = useState('')
  const [bulkValue, setBulkValue] = useState('')
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
  const exporter = useQueuedExport('applications')
  const canUpdate = user?.permissions?.includes('applications.update')
  const canExport = user?.permissions?.includes('applications.view')

  const meta = useQuery({ queryKey: ['hr-meta'], queryFn: fetchHrMeta, staleTime: 600_000 })
  const entities = useQuery({ queryKey: ['public-entities'], queryFn: fetchEntities, staleTime: 600_000 })
  const saved = useQuery({ queryKey: ['saved-filters', 'applications'], queryFn: fetchSavedFilters })
  const list = useQuery({
    queryKey: ['hr-applications', filters],
    queryFn: () => fetchApplications(toQuery(filters)),
    placeholderData: keepPreviousData,
  })
  const jobs = useQuery({
    queryKey: ['hr-open-jobs'],
    queryFn: fetchOpenJobs,
    enabled: Boolean(assignTarget),
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
  const counts = list.data?.counts?.type ?? {}
  const selected = Object.keys(rowSelection).filter((id) => rowSelection[id])

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['hr-applications'] })
  }

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['hr-applications'] })
      const previous = queryClient.getQueriesData({ queryKey: ['hr-applications'] })
      queryClient.setQueriesData({ queryKey: ['hr-applications'] }, (current) => {
        if (!current?.data) return current
        return {
          ...current,
          data: current.data.map((row) => {
            if (row.public_id !== id) return row
            const next = row.allowed_statuses?.find((option) => option.value === status)
            return {
              ...row,
              status,
              status_label: next?.label ?? row.status_label,
              status_color: next?.color ?? row.status_color,
            }
          }),
        }
      })
      return { previous }
    },
    onSuccess: (_data, variables) => {
      toast.push({
        tone: 'success',
        message: 'Status updated',
        duration: 5000,
        action: { label: 'Undo', onClick: () => undoMutation.mutate(variables.id) },
      })
      refresh()
    },
    onError: (error, _variables, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data))
      toast.push({ tone: 'error', message: error.message })
    },
  })
  const undoMutation = useMutation({
    mutationFn: undoStatus,
    onSuccess: () => {
      toast.push({ tone: 'success', message: 'Status change undone' })
      refresh()
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })
  const bulkMutation = useMutation({
    mutationFn: () => bulkStatus(selected, bulkValue),
    onSuccess: (result) => {
      const failed = result.failed?.length ?? 0
      const ids = selected
      toast.push({
        tone: failed ? 'warning' : 'success',
        message: failed ? `${result.updated} updated. ${failed} could not be updated.` : 'Statuses updated',
        duration: 5000,
        action: result.updated ? { label: 'Undo', onClick: () => Promise.all(ids.map((id) => undoStatus(id))).then(() => refresh()) } : undefined,
      })
      setRowSelection({})
      setBulkValue('')
      refresh()
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })
  const assignMutation = useMutation({
    mutationFn: () => assignJob(assignTarget.public_id, jobId),
    onSuccess: () => {
      toast.push({ tone: 'success', message: 'Application assigned to the role' })
      setAssignTarget(null)
      setJobId('')
      refresh()
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })
  const saveMutation = useMutation({
    mutationFn: saveFilter,
    onSuccess: () => {
      toast.push({ tone: 'success', message: 'Filter saved' })
      queryClient.invalidateQueries({ queryKey: ['saved-filters', 'applications'] })
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })
  const deleteMutation = useMutation({
    mutationFn: deleteFilter,
    onSuccess: () => {
      toast.push({ tone: 'success', message: 'Filter deleted' })
      queryClient.invalidateQueries({ queryKey: ['saved-filters', 'applications'] })
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

  function changeColumns(next) {
    setColumnVisibility(next)
    if (user?.email) window.localStorage.setItem(columnKey(user.email), JSON.stringify(next))
  }

  const chips = buildChips(filters, meta.data, entities.data, update)
  const columns = useMemo(
    () => applicationColumns(canUpdate, (id, status) => statusMutation.mutate({ id, status }), setAssignTarget, canSchedule ? setScheduleTarget : null),
    [canUpdate, canSchedule, statusMutation],
  )
  const tabs = [
    { id: '', label: 'All', count: counts.all ?? 0 },
    { id: 'job', label: 'Job applications', count: counts.job ?? 0 },
    { id: 'general', label: 'General', count: counts.general ?? 0 },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Applications"
        subtitle="Review job applications and Quick apply submissions."
        actions={canExport ? (
          <Button variant="secondary" icon={ArrowDownTrayIcon} onClick={() => exporter.start(toQuery(filters)).catch((error) => toast.push({ tone: 'error', message: error.message }))}>
            Export
          </Button>
        ) : null}
      />
      <div className="flex gap-2 overflow-x-auto" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.label}
            type="button"
            role="tab"
            aria-selected={filters.type === item.id}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-medium ${filters.type === item.id ? 'bg-brand-600 text-white' : 'bg-white text-navy shadow-card'}`}
            onClick={() => update({ type: item.id })}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>
      <FilterToolbar
        search={<SearchInput ref={searchRef} id="application-search" value={filters.q} onChange={(q) => update({ q })} placeholder="Search name, email or role" label="Search applications" />}
        quick={
          <>
            <QuickFilter id="quick-entity" label="Entity" value={filters.entity} onChange={(entity) => update({ entity })} options={[{ value: '', label: 'All entities' }, ...(entities.data ?? []).map((entity) => ({ value: entity.slug, label: entity.name }))]} />
            <QuickFilter id="quick-status" label="Status" value={filters.status} onChange={(status) => update({ status })} options={[{ value: '', label: 'All statuses' }, ...asList(meta.data?.enums?.application_statuses).map((item) => ({ value: item.value, label: item.label }))]} />
          </>
        }
        activeCount={chips.filter((chip) => chip.key !== 'q').length}
        onOpen={() => { setDraft(filters); setOpen(true) }}
        actions={

          <>

            <SavedFilters
                    items={saved.data ?? []}
                    saving={saveMutation.isPending}
                    onApply={(item) => applyQuery(item.query)}
                    onDelete={(item) => deleteMutation.mutate(item.id)}
                    onSave={(payload) => saveMutation.mutate({ ...payload, query: currentQuery(filters) })}
            />

            <ColumnsMenu columns={columns} visibility={columnVisibility} onChange={changeColumns} />
          </>
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ResultCount count={total} noun="applications" />
        <FilterChips chips={chips} onClear={clearAll} />
      </div>
      <SelectionBar count={canUpdate ? selected.length : 0} noun="application" onClear={() => setRowSelection({})}>
        <div className="w-56">
          <label htmlFor="bulk-status" className="sr-only">Bulk status</label>
          <Select id="bulk-status" value={bulkValue} onChange={setBulkValue} options={[{ value: '', label: 'Choose a status' }, ...(meta.data?.enums?.application_statuses ?? []).map((item) => ({ value: item.value, label: item.label }))]} />
        </div>
        <Button size="sm" loading={bulkMutation.isPending} disabled={!bulkValue} onClick={() => bulkMutation.mutate()}>Update {selected.length}</Button>
      </SelectionBar>
      {list.isLoading ? <Skeleton className="h-64" /> : null}
      {list.isError ? <ErrorState onRetry={() => list.refetch()} /> : null}
      {!list.isLoading && !list.isError && rows.length === 0 ? (
        <EmptyState title="No applications match these filters" action={<Button onClick={clearAll}>Clear filters</Button>} />
      ) : null}
      {rows.length > 0 ? (
        <DataTable
          columns={columns}
          data={rows}
          selectable={canUpdate}
          sorting={[{ id: filters.sort, desc: filters.direction !== 'asc' }]}
          onSortingChange={(next) => {
            const item = next[0]
            update(item ? { sort: item.id, direction: item.desc ? 'desc' : 'asc' } : { sort: 'applied_at', direction: 'desc' })
          }}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={changeColumns}
          getRowId={(row) => row.public_id}
          renderCard={(application) => (
            <div>
              <Link className="font-medium text-brand-700" to={`/candidates/${application.candidate?.public_id}`}>{application.candidate?.name}</Link>
              <p className="mt-1 text-sm">{application.role}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <EntityBadge entity={application.entity} />
                <Badge color={application.source?.color}>{application.source?.label}</Badge>
              </div>
            </div>
          )}
        />
      ) : null}
      <Pagination
        page={Number(filters.page)}
        total={total}
        pageCount={list.data?.meta?.last_page ?? 1}
        perPage={Number(filters.per_page)}
        onPageChange={(page) => update({ page: String(page) }, true)}
        onPerPageChange={(perPage) => update({ per_page: String(perPage) })}
      />
      <FilterPanel
        open={open}
        onClose={() => setOpen(false)}
        activeCount={chips.filter((chip) => chip.key !== 'q').length}
        onClear={() => { clearAll(); setOpen(false) }}
        onApply={() => { applyQuery(currentQuery(draft)); setOpen(false) }}
        applyLabel="Show results"
      >
        <ApplicationFilters values={draft} onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))} meta={meta.data} entities={entities.data ?? []} />
      </FilterPanel>
      <ScheduleRoundPanel open={Boolean(scheduleTarget)} onClose={() => setScheduleTarget(null)} application={scheduleTarget} />
      <Modal open={Boolean(assignTarget)} onClose={() => setAssignTarget(null)} title="Assign to a role">
        <FormField id="assign-job" label="Open role">
          <Select
            id="assign-job"
            value={jobId}
            onChange={setJobId}
            options={[{ value: '', label: 'Choose a role' }, ...(jobs.data ?? []).map((job) => ({ value: job.public_id, label: job.title }))]}
          />
        </FormField>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setAssignTarget(null)}>Cancel</Button>
          <Button loading={assignMutation.isPending} disabled={!jobId} onClick={() => assignMutation.mutate()}>Assign</Button>
        </div>
      </Modal>
    </div>
  )
}

function ApplicationFilters({ values, onChange, meta, entities }) {
  const enums = meta?.enums ?? {}
  return (
    <FilterBar className="xl:grid-cols-4">
      <FormField id="app-entity" label="Entity">
        <Select id="app-entity" value={values.entity} onChange={(entity) => onChange({ entity })} options={[{ value: '', label: 'All entities' }, ...entities.map((entity) => ({ value: entity.slug, label: entity.name }))]} />
      </FormField>
      <FormField id="app-job" label="Job or role">
        <Input id="app-job" value={values.job} onChange={(event) => onChange({ job: event.target.value })} />
      </FormField>
      <FormField id="app-department" label="Department">
        <Select id="app-department" value={values.department} onChange={(department) => onChange({ department })} options={[{ value: '', label: 'All departments' }, ...asList(meta?.departments).map((department) => ({ value: String(department.id), label: department.name }))]} />
      </FormField>
      <FormField id="app-level" label="Level">
        <Select id="app-level" value={values.level} onChange={(level) => onChange({ level })} options={[{ value: '', label: 'All levels' }, ...asList(enums.job_levels).map((item) => ({ value: item.value, label: item.label }))]} />
      </FormField>
      <FormField id="app-source" label="Source">
        <Select id="app-source" value={values.source} onChange={(source) => onChange({ source })} options={[{ value: '', label: 'All sources' }, ...asList(enums.application_sources).map((item) => ({ value: item.value, label: item.label }))]} />
      </FormField>
      <FormField id="app-gender" label="Gender">
        <Select id="app-gender" value={values.gender} onChange={(gender) => onChange({ gender })} options={[{ value: '', label: 'All' }, ...asList(enums.genders).map((item) => ({ value: item.value, label: item.label }))]} />
      </FormField>
      <FormField id="app-status" label="Status">
        <Select id="app-status" value={values.status} onChange={(status) => onChange({ status })} options={[{ value: '', label: 'All statuses' }, ...asList(enums.application_statuses).map((item) => ({ value: item.value, label: item.label }))]} />
      </FormField>
      <FormField id="app-result" label="Result">
        <Select id="app-result" value={values.result} onChange={(result) => onChange({ result })} options={[{ value: '', label: 'All results' }, ...asList(enums.application_results).map((item) => ({ value: item.value, label: item.label }))]} />
      </FormField>
      <FormField id="app-referred" label="Referred">
        <Select id="app-referred" value={values.referred} onChange={(referred) => onChange({ referred })} options={yesNo('Anyone')} />
      </FormField>
      <FormField id="app-interview" label="Has interview">
        <Select id="app-interview" value={values.has_interview} onChange={(has_interview) => onChange({ has_interview })} options={yesNo('Anyone')} />
      </FormField>
      <FormField id="app-flagged" label="Blacklisted candidate">
        <Select id="app-flagged" value={values.flagged} onChange={(flagged) => onChange({ flagged })} options={yesNo('Anyone')} />
      </FormField>
      <FormField id="app-from" label="Applied from">
        <DateInput id="app-from" value={values.applied_from} onChange={(applied_from) => onChange({ applied_from })} />
      </FormField>
      <FormField id="app-to" label="Applied to">
        <DateInput id="app-to" value={values.applied_to} onChange={(applied_to) => onChange({ applied_to })} />
      </FormField>
    </FilterBar>
  )
}

function yesNo(allLabel) {
  return [
    { value: '', label: allLabel },
    { value: '1', label: 'Yes' },
    { value: '0', label: 'No' },
  ]
}

function applicationColumns(canUpdate, onStatus, onAssign, onSchedule) {
  return [
    { id: 'candidate', header: 'Candidate', cell: ({ row }) => <Link className="font-medium text-brand-700" to={`/candidates/${row.original.candidate?.public_id}`}>{row.original.candidate?.name}</Link> },
    { id: 'role', header: 'Role', enableSorting: false, cell: ({ row }) => row.original.role },
    { id: 'entity', header: 'Entity', enableSorting: false, cell: ({ row }) => <EntityBadge entity={row.original.entity} /> },
    { id: 'level', header: 'Level', enableSorting: false, cell: ({ row }) => row.original.level?.label || '—' },
    { id: 'source', header: 'Source', enableSorting: false, cell: ({ row }) => <Badge color={row.original.source?.color}>{row.original.source?.label}</Badge> },
    { id: 'referred', header: 'Referred', enableSorting: false, cell: ({ row }) => row.original.referred ? <Badge color="violet">Referred</Badge> : '—' },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => canUpdate && row.original.allowed_statuses?.length ? (
        <Select
          id={`status-${row.original.public_id}`}
          value={row.original.status}
          onChange={(status) => onStatus(row.original.public_id, status)}
          options={[{ value: row.original.status, label: row.original.status_label }, ...row.original.allowed_statuses]}
        />
      ) : <Badge color={row.original.status_color}>{row.original.status_label}</Badge>,
    },
    { id: 'result', header: 'Result', enableSorting: false, cell: ({ row }) => row.original.result_label ? <Badge color={row.original.result_color}>{row.original.result_label}</Badge> : '—' },
    { id: 'applied_at', header: 'Applied', cell: ({ row }) => formatDate(row.original.applied_at) },
    { id: 'flagged', header: 'Flagged', enableSorting: false, cell: ({ row }) => row.original.is_flagged ? <Badge color="amber">Flagged</Badge> : '—' },
    {
      id: 'assign',
      header: 'Assign',
      enableSorting: false,
      cell: ({ row }) => row.original.type?.value === 'general' && canUpdate ? <Button size="sm" variant="secondary" onClick={() => onAssign(row.original)}>Assign to role</Button> : null,
    },
    {
      id: 'interview',
      header: 'Interview',
      enableSorting: false,
      cell: ({ row }) => {
        const application = row.original
        if (application.status !== 'shortlisted' || application.result) return null
        if (application.has_interview) return <Link className="text-sm text-brand-700 underline" to={`/interviews?candidate=${application.candidate?.public_id}`}>View rounds</Link>
        return onSchedule && !application.is_flagged ? <Button size="sm" variant="secondary" onClick={() => onSchedule(application)}>Schedule</Button> : null
      },
    },
  ]
}

function readFilters(params) {
  return { ...emptyFilters, ...Object.fromEntries([...params.entries()]) }
}

function toQuery(filters) {
  return { ...filters, page: Number(filters.page) || 1, per_page: Number(filters.per_page) || 25 }
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
  const text = value == null ? '' : String(value)
  if (!text) params.delete(key)
  else params.set(key, text)
}

function buildChips(filters, meta, entities, update) {
  const chips = []
  const remove = (key) => update({ [key]: '' })
  const label = (group, value) => meta?.enums?.[group]?.find((item) => item.value === value)?.label ?? value
  if (filters.q) chips.push({ key: 'q', label: `Search: ${filters.q}`, onRemove: () => remove('q') })
  if (filters.entity) chips.push({ key: 'entity', label: entities?.find((entity) => entity.slug === filters.entity)?.name ?? filters.entity, onRemove: () => remove('entity') })
  if (filters.job) chips.push({ key: 'job', label: filters.job, onRemove: () => remove('job') })
  if (filters.status) chips.push({ key: 'status', label: label('application_statuses', filters.status), onRemove: () => remove('status') })
  if (filters.source) chips.push({ key: 'source', label: label('application_sources', filters.source), onRemove: () => remove('source') })
  if (filters.gender) chips.push({ key: 'gender', label: label('genders', filters.gender), onRemove: () => remove('gender') })
  if (filters.flagged === '1') chips.push({ key: 'flagged', label: 'Flagged', onRemove: () => remove('flagged') })
  if (filters.referred === '1') chips.push({ key: 'referred', label: 'Referred', onRemove: () => remove('referred') })
  return chips
}

function columnKey(email) {
  return `portal.applications.columns.${email}`
}
