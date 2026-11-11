import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { Badge, StatusBadge } from '@shared/ui/Badge'
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
import { Pagination } from '@shared/ui/Pagination'
import { ResultCount } from '@shared/ui/ResultCount'
import { SavedFilters } from '@shared/ui/SavedFilters'
import { SearchInput } from '@shared/ui/SearchInput'
import { Select } from '@shared/ui/Select'
import { useToast } from '@shared/ui/Toast'
import { formatDate } from '@shared/lib/formatDate'
import { useSlashFocus } from '@shared/hooks/useSlashFocus'
import { useAuth } from '../auth/AuthProvider'
import { useQueuedExport } from '../exports/useQueuedExport'
import { deleteFilter, fetchCandidates, fetchEntities, fetchHrMeta, fetchSavedFilters, saveFilter } from './api'

function asList(value) {
  return Array.isArray(value) ? value : []
}

const emptyFilters = {
  q: '',
  entity: '',
  role: '',
  department: '',
  gender: '',
  age_min: '',
  age_max: '',
  location: '',
  qualification: '',
  experience_min: '',
  experience_max: '',
  ctc_min: '',
  ctc_max: '',
  signup_source: '',
  colour_tag: '',
  blacklisted: '',
  has_referral: '',
  has_role_block: '',
  application_status: '',
  applied_from: '',
  applied_to: '',
  profile_complete: '',
  sort: 'name',
  direction: 'asc',
  page: '1',
  per_page: '25',
}

export function CandidateListPage() {
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const filters = readFilters(params)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(filters)
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
  const exporter = useQueuedExport('candidates')
  const canExport = user?.permissions?.includes('candidates.export')

  const meta = useQuery({ queryKey: ['hr-meta'], queryFn: fetchHrMeta, staleTime: 600_000 })
  const entities = useQuery({ queryKey: ['public-entities'], queryFn: fetchEntities, staleTime: 600_000 })
  const saved = useQuery({ queryKey: ['saved-filters', 'candidates'], queryFn: fetchSavedFilters })
  const list = useQuery({
    queryKey: ['hr-candidates', filters],
    queryFn: () => fetchCandidates(toQuery(filters)),
    placeholderData: keepPreviousData,
  })
  const draftCount = useQuery({
    queryKey: ['hr-candidates-count', draft],
    queryFn: () => fetchCandidates({ ...toQuery(draft), per_page: 25, page: 1 }),
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
  const columns = useMemo(() => candidateColumns(), [])

  const saveMutation = useMutation({
    mutationFn: saveFilter,
    onSuccess: () => {
      toast.push({ tone: 'success', message: 'Filter saved' })
      queryClient.invalidateQueries({ queryKey: ['saved-filters', 'candidates'] })
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })
  const deleteMutation = useMutation({
    mutationFn: deleteFilter,
    onSuccess: () => {
      toast.push({ tone: 'success', message: 'Filter deleted' })
      queryClient.invalidateQueries({ queryKey: ['saved-filters', 'candidates'] })
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

  async function exportList() {
    try {
      await exporter.start(toQuery(filters))
    } catch (error) {
      toast.push({ tone: 'error', message: error.message })
    }
  }

  function changeColumns(next) {
    setColumnVisibility(next)
    if (user?.email) window.localStorage.setItem(columnKey(user.email), JSON.stringify(next))
  }

  const chips = buildChips(filters, meta.data, entities.data, update)

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Candidates"
        subtitle="Search profiles, review applications and export the current list."
        actions={canExport ? <Button variant="secondary" icon={ArrowDownTrayIcon} onClick={exportList}>Export</Button> : null}
      />
      <FilterToolbar
        search={<SearchInput ref={searchRef} id="candidate-search" value={filters.q} onChange={(q) => update({ q })} placeholder="Search name, email or phone" label="Search candidates" />}
        quick={
          <>
            <QuickFilter id="quick-entity" label="Entity applied to" value={filters.entity} onChange={(entity) => update({ entity })} options={[{ value: '', label: 'All entities' }, ...(entities.data ?? []).map((entity) => ({ value: entity.slug, label: entity.name }))]} />
            <QuickFilter id="quick-colour" label="Colour tag" value={filters.colour_tag} onChange={(colour_tag) => update({ colour_tag })} options={[{ value: '', label: 'All colour tags' }, ...asList(meta.data?.enums?.colour_tags).map((item) => ({ value: item.value, label: item.label }))]} />
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
        <ResultCount count={total} noun="candidates" />
        <FilterChips chips={chips} onClear={clearAll} />
      </div>
      {list.isLoading ? <Skeleton className="h-64" /> : null}
      {list.isError ? <ErrorState onRetry={() => list.refetch()} /> : null}
      {!list.isLoading && !list.isError && rows.length === 0 ? (
        <EmptyState title="No candidates match these filters" description="Try another search or clear the filters." action={<Button onClick={clearAll}>Clear filters</Button>} />
      ) : null}
      {rows.length > 0 ? (
        <DataTable
          columns={columns}
          data={rows}
          sorting={[{ id: filters.sort, desc: filters.direction === 'desc' }]}
          onSortingChange={(next) => {
            const item = next[0]
            update(item ? { sort: item.id, direction: item.desc ? 'desc' : 'asc' } : { sort: 'name', direction: 'asc' })
          }}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={changeColumns}
          getRowId={(row) => row.public_id}
          renderCard={(candidate) => <CandidateSummary candidate={candidate} />}
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
        applyLabel={`Show ${draftCount.isFetching ? '…' : draftCount.data?.meta?.total ?? 0} candidates`}
      >
        <CandidateFilters values={draft} onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))} meta={meta.data} entities={entities.data ?? []} />
      </FilterPanel>
    </div>
  )
}

function CandidateSummary({ candidate }) {
  return (
    <div>
      <Link className="font-medium text-brand-700" to={`/candidates/${candidate.public_id}`}>{candidate.name}</Link>
      <p className="mt-1 text-sm text-muted">{candidate.email}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {candidate.colour_tag ? <Badge color={candidate.colour_tag.color}>{candidate.colour_tag.label}</Badge> : null}
        {candidate.is_blacklisted ? <Badge color="red-soft">Blacklisted</Badge> : null}
        {candidate.latest_application?.entity ? <EntityBadge entity={candidate.latest_application.entity} /> : null}
      </div>
    </div>
  )
}

function CandidateFilters({ values, onChange, meta, entities }) {
  const enums = meta?.enums ?? {}
  return (
    <FilterBar className="xl:grid-cols-4">
      <FormField id="cand-entity" label="Entity applied to">
        <Select id="cand-entity" value={values.entity} onChange={(entity) => onChange({ entity })} options={[{ value: '', label: 'All entities' }, ...entities.map((entity) => ({ value: entity.slug, label: entity.name }))]} />
      </FormField>
      <FormField id="cand-role" label="Job or role">
        <Input id="cand-role" value={values.role} onChange={(event) => onChange({ role: event.target.value })} placeholder="Title or role" />
      </FormField>
      <FormField id="cand-department" label="Department">
        <Select id="cand-department" value={values.department} onChange={(department) => onChange({ department })} options={[{ value: '', label: 'All departments' }, ...asList(meta?.departments).map((department) => ({ value: String(department.id), label: department.name }))]} />
      </FormField>
      <FormField id="cand-gender" label="Gender">
        <Select id="cand-gender" value={values.gender} onChange={(gender) => onChange({ gender })} options={[{ value: '', label: 'All' }, ...asList(enums.genders).map((item) => ({ value: item.value, label: item.label }))]} />
      </FormField>
      <FormField id="cand-age-min" label="Minimum age">
        <Input id="cand-age-min" inputMode="numeric" value={values.age_min} onChange={(event) => onChange({ age_min: event.target.value.replace(/\D/g, '') })} />
      </FormField>
      <FormField id="cand-age-max" label="Maximum age">
        <Input id="cand-age-max" inputMode="numeric" value={values.age_max} onChange={(event) => onChange({ age_max: event.target.value.replace(/\D/g, '') })} />
      </FormField>
      <FormField id="cand-location" label="Location">
        <Input id="cand-location" value={values.location} onChange={(event) => onChange({ location: event.target.value })} />
      </FormField>
      <FormField id="cand-qualification" label="Highest qualification">
        <Input id="cand-qualification" value={values.qualification} onChange={(event) => onChange({ qualification: event.target.value })} />
      </FormField>
      <FormField id="cand-exp-min" label="Minimum experience">
        <Input id="cand-exp-min" inputMode="decimal" value={values.experience_min} onChange={(event) => onChange({ experience_min: event.target.value })} />
      </FormField>
      <FormField id="cand-exp-max" label="Maximum experience">
        <Input id="cand-exp-max" inputMode="decimal" value={values.experience_max} onChange={(event) => onChange({ experience_max: event.target.value })} />
      </FormField>
      <FormField id="cand-ctc-min" label="Minimum expected CTC">
        <Input id="cand-ctc-min" inputMode="decimal" value={values.ctc_min} onChange={(event) => onChange({ ctc_min: event.target.value })} />
      </FormField>
      <FormField id="cand-ctc-max" label="Maximum expected CTC">
        <Input id="cand-ctc-max" inputMode="decimal" value={values.ctc_max} onChange={(event) => onChange({ ctc_max: event.target.value })} />
      </FormField>
      <FormField id="cand-source" label="Signup source">
        <Select id="cand-source" value={values.signup_source} onChange={(signup_source) => onChange({ signup_source })} options={[{ value: '', label: 'All sources' }, ...asList(enums.signup_sources).map((item) => ({ value: item.value, label: item.label }))]} />
      </FormField>
      <FormField id="cand-colour" label="Colour tag">
        <Select id="cand-colour" value={values.colour_tag} onChange={(colour_tag) => onChange({ colour_tag })} options={[{ value: '', label: 'All tags' }, ...asList(enums.colour_tags).map((item) => ({ value: item.value, label: item.label }))]} />
      </FormField>
      <FormField id="cand-status" label="Application status">
        <Select id="cand-status" value={values.application_status} onChange={(application_status) => onChange({ application_status })} options={[{ value: '', label: 'All statuses' }, ...asList(enums.application_statuses).map((item) => ({ value: item.value, label: item.label }))]} />
      </FormField>
      <FormField id="cand-blacklisted" label="Blacklisted">
        <Select id="cand-blacklisted" value={values.blacklisted} onChange={(blacklisted) => onChange({ blacklisted })} options={yesNo('Anyone')} />
      </FormField>
      <FormField id="cand-referral" label="Has referral">
        <Select id="cand-referral" value={values.has_referral} onChange={(has_referral) => onChange({ has_referral })} options={yesNo('Anyone')} />
      </FormField>
      <FormField id="cand-block" label="Active role block">
        <Select id="cand-block" value={values.has_role_block} onChange={(has_role_block) => onChange({ has_role_block })} options={yesNo('Anyone')} />
      </FormField>
      <FormField id="cand-complete" label="Profile complete">
        <Select id="cand-complete" value={values.profile_complete} onChange={(profile_complete) => onChange({ profile_complete })} options={yesNo('Anyone')} />
      </FormField>
      <FormField id="cand-from" label="Applied from">
        <DateInput id="cand-from" value={values.applied_from} onChange={(applied_from) => onChange({ applied_from })} />
      </FormField>
      <FormField id="cand-to" label="Applied to">
        <DateInput id="cand-to" value={values.applied_to} onChange={(applied_to) => onChange({ applied_to })} />
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

function candidateColumns() {
  return [
    { id: 'name', accessorKey: 'name', header: 'Name', cell: ({ row }) => <Link className="font-medium text-brand-700" to={`/candidates/${row.original.public_id}`}>{row.original.name}</Link> },
    { id: 'email', header: 'Email', enableSorting: false, cell: ({ row }) => row.original.email },
    { id: 'location', header: 'Location', enableSorting: false, cell: ({ row }) => row.original.location || '—' },
    { id: 'experience', header: 'Experience', cell: ({ row }) => (row.original.years_experience == null ? '—' : `${row.original.years_experience} yrs`) },
    { id: 'colour', header: 'Tag', enableSorting: false, cell: ({ row }) => row.original.colour_tag ? <Badge color={row.original.colour_tag.color}>{row.original.colour_tag.label}</Badge> : '—' },
    { id: 'source', header: 'Source', enableSorting: false, cell: ({ row }) => row.original.signup_source?.label || '—' },
    { id: 'role', header: 'Latest role', enableSorting: false, cell: ({ row }) => row.original.latest_application?.role || '—' },
    { id: 'applied_at', header: 'Applied', cell: ({ row }) => formatDate(row.original.latest_application?.applied_at) },
    // A final result (Selected / Not selected) is shown in place of the status.
    { id: 'status', header: 'Status', enableSorting: false, cell: ({ row }) => row.original.latest_application?.status ? <StatusBadge status={row.original.latest_application.result || row.original.latest_application.status} /> : '—' },
    { id: 'blacklist', header: 'Blacklist', enableSorting: false, cell: ({ row }) => row.original.is_blacklisted ? <Badge color="red-soft">Blacklisted</Badge> : '—' },
  ]
}

function readFilters(params) {
  return { ...emptyFilters, ...Object.fromEntries([...params.entries()]) }
}

function toQuery(filters) {
  return {
    ...filters,
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
  if (filters.role) chips.push({ key: 'role', label: filters.role, onRemove: () => remove('role') })
  if (filters.department) chips.push({ key: 'department', label: meta?.departments?.find((item) => String(item.id) === filters.department)?.name ?? 'Department', onRemove: () => remove('department') })
  if (filters.gender) chips.push({ key: 'gender', label: label('genders', filters.gender), onRemove: () => remove('gender') })
  if (filters.location) chips.push({ key: 'location', label: filters.location, onRemove: () => remove('location') })
  if (filters.signup_source) chips.push({ key: 'signup_source', label: label('signup_sources', filters.signup_source), onRemove: () => remove('signup_source') })
  if (filters.colour_tag) chips.push({ key: 'colour_tag', label: label('colour_tags', filters.colour_tag), onRemove: () => remove('colour_tag') })
  if (filters.application_status) chips.push({ key: 'application_status', label: label('application_statuses', filters.application_status), onRemove: () => remove('application_status') })
  if (filters.blacklisted) chips.push({ key: 'blacklisted', label: filters.blacklisted === '1' ? 'Blacklisted' : 'Not blacklisted', onRemove: () => remove('blacklisted') })
  if (filters.has_referral === '1') chips.push({ key: 'has_referral', label: 'Has referral', onRemove: () => remove('has_referral') })
  if (filters.has_role_block === '1') chips.push({ key: 'has_role_block', label: 'Active role block', onRemove: () => remove('has_role_block') })
  if (filters.profile_complete) chips.push({ key: 'profile_complete', label: filters.profile_complete === '1' ? 'Profile complete' : 'Profile incomplete', onRemove: () => remove('profile_complete') })
  return chips
}

function columnKey(email) {
  return `portal.candidates.columns.${email}`
}
