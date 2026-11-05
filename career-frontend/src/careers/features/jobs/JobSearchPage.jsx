import { useRef, useState } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import { Button } from '@shared/ui/Button'
import { EmptyState, Skeleton } from '@shared/ui/Skeleton'
import { ErrorState } from '@shared/ui/ErrorState'
import { FilterBar } from '@shared/ui/FilterBar'
import { FilterChips } from '@shared/ui/FilterChips'
import { FormField } from '@shared/ui/FormField'
import { JobCard } from '@shared/ui/JobCard'
import { MultiSelect } from '@shared/ui/MultiSelect'
import { ResultCount } from '@shared/ui/ResultCount'
import { SearchInput } from '@shared/ui/SearchInput'
import { Select } from '@shared/ui/Select'
import { Checkbox } from '@shared/ui/Input'
import { SlideOver } from '@shared/ui/Modal'
import { useSlashFocus } from '@shared/hooks/useSlashFocus'
import { fetchEntities, fetchPublicJobs, fetchPublicJob, fetchPublicMeta } from './api'

const emptyFilters = {
  q: '',
  entity: '',
  department: '',
  team: '',
  level: '',
  location: '',
  skills: [],
  posted: '',
  closing_soon: false,
  sort: 'newest',
}

export function JobSearchPage() {
  const [params, setParams] = useSearchParams()
  const filters = readFilters(params)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(filters)
  const searchRef = useRef(null)
  const queryClient = useQueryClient()
  useSlashFocus(searchRef)

  const meta = useQuery({ queryKey: ['public-meta'], queryFn: fetchPublicMeta, staleTime: 600_000 })
  const entities = useQuery({ queryKey: ['public-entities'], queryFn: fetchEntities, staleTime: 600_000 })
  const list = useInfiniteQuery({
    queryKey: ['public-jobs', filters],
    queryFn: ({ pageParam }) => fetchPublicJobs({ ...toQuery(filters), cursor: pageParam, per_page: 12 }),
    initialPageParam: undefined,
    getNextPageParam: (last) => last.meta?.next_cursor || undefined,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
  const draftCount = useQuery({
    queryKey: ['public-jobs-count', draft],
    queryFn: () => fetchPublicJobs({ ...toQuery(draft), per_page: 1 }),
    enabled: open,
  })

  const jobs = list.data?.pages.flatMap((page) => page.data) ?? []
  const total = list.data?.pages[0]?.meta?.total ?? 0
  const counts = list.data?.pages[0]?.counts ?? {}
  const chips = buildChips(filters, meta.data, entities.data, update)

  function update(patch) {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([key, value]) => {
      const text = Array.isArray(value) ? value.join(',') : value === true ? '1' : value ? String(value) : ''
      if (!text || (key === 'sort' && text === 'newest')) next.delete(key)
      else next.set(key, text)
    })
    setParams(next, { replace: true })
  }

  function clearAll() {
    setParams(new URLSearchParams(), { replace: true })
  }

  function prefetch(job) {
    queryClient.prefetchQuery({
      queryKey: ['public-job', job.public_id, null],
      queryFn: () => fetchPublicJob(job.public_id),
      staleTime: 60_000,
    })
  }

  const fields = (values, onChange) => (
    <FilterFields values={values} onChange={onChange} meta={meta.data} entities={entities.data ?? []} counts={counts} />
  )

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-8">
      <header>
        <h1 className="font-display text-3xl text-navy">Open roles</h1>
        <p className="mt-1 text-muted">Roles across Infolks Group that are still accepting applications.</p>
      </header>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <SearchInput ref={searchRef} value={filters.q} onChange={(q) => update({ q })} placeholder="Search by role, skill or entity" label="Search roles" />
        </div>
        <div className="w-full sm:w-56">
          <Select
            value={filters.sort}
            onChange={(sort) => update({ sort })}
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'closing', label: 'Closing soonest' },
              { value: 'title', label: 'Title A–Z' },
            ]}
          />
        </div>
        <Button className="md:hidden" variant="secondary" icon={AdjustmentsHorizontalIcon} onClick={() => { setDraft(filters); setOpen(true) }}>
          Filters
        </Button>
      </div>
      <div className="hidden md:block">{fields(filters, update)}</div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ResultCount count={total} noun="roles" />
        <FilterChips chips={chips} onClear={clearAll} />
      </div>
      {list.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : null}
      {list.isError ? <ErrorState onRetry={() => list.refetch()} /> : null}
      {!list.isLoading && !list.isError && jobs.length === 0 ? (
        <EmptyState title="No roles match these filters" description="Try another skill, entity or location." action={<Button onClick={clearAll}>Clear filters</Button>} />
      ) : null}
      <div className="flex flex-col gap-3">
        {jobs.map((job) => (
          <JobCard key={job.public_id} job={job} onHover={() => prefetch(job)} />
        ))}
      </div>
      {list.hasNextPage ? (
        <Button variant="secondary" loading={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>
          Load more
        </Button>
      ) : null}
      <SlideOver open={open} onClose={() => setOpen(false)} title="Filters">
        <div className="flex flex-col gap-4">
          {fields(draft, (patch) => setDraft((current) => ({ ...current, ...patch })))}
          <Button
            className="sticky bottom-0 w-full"
            onClick={() => {
              update(draft)
              setOpen(false)
            }}
          >
            Apply filters ({draftCount.isFetching ? '…' : draftCount.data?.meta?.total ?? 0})
          </Button>
        </div>
      </SlideOver>
    </div>
  )
}

function FilterFields({ values, onChange, meta, entities, counts }) {
  const teams = (meta?.teams ?? []).filter((team) => !values.department || String(team.department_id) === values.department)
  const skillOptions = (meta?.skills ?? []).map((skill) => ({
    value: skill.slug,
    label: labelWithCount(skill.name, counts.skill?.[skill.slug]),
  }))

  return (
    <FilterBar>
      <FormField id="entity" label="Entity">
        <Select
          id="entity"
          value={values.entity}
          onChange={(entity) => onChange({ entity })}
          placeholder="All entities"
          options={[
            { value: '', label: 'All entities' },
            ...entities.map((entity) => ({ value: entity.slug, label: labelWithCount(entity.name, counts.entity?.[entity.slug]) })),
          ]}
        />
      </FormField>
      <FormField id="department" label="Department">
        <Select
          id="department"
          value={values.department}
          onChange={(department) => onChange({ department, team: '' })}
          options={[
            { value: '', label: 'All departments' },
            ...(meta?.departments ?? []).map((department) => ({
              value: String(department.id),
              label: labelWithCount(department.name, counts.department?.[department.id]),
            })),
          ]}
        />
      </FormField>
      <FormField id="team" label="Team">
        <Select
          id="team"
          value={values.team}
          onChange={(team) => onChange({ team })}
          options={[{ value: '', label: 'All teams' }, ...teams.map((team) => ({ value: String(team.id), label: labelWithCount(team.name, counts.team?.[team.id]) }))]}
        />
      </FormField>
      <FormField id="level" label="Level">
        <Select
          id="level"
          value={values.level}
          onChange={(level) => onChange({ level })}
          options={[
            { value: '', label: 'All levels' },
            ...(meta?.enums?.job_levels ?? []).map((level) => ({
              value: level.value,
              label: labelWithCount(level.label, counts.level?.[level.value]),
            })),
          ]}
        />
      </FormField>
      <FormField id="location" label="Location">
        <Select
          id="location"
          value={values.location}
          onChange={(location) => onChange({ location })}
          options={[
            { value: '', label: 'All locations' },
            ...(meta?.locations ?? []).map((location) => ({ value: location, label: labelWithCount(location, counts.location?.[location]) })),
          ]}
        />
      </FormField>
      <FormField id="posted" label="Date posted">
        <Select
          id="posted"
          value={values.posted}
          onChange={(posted) => onChange({ posted })}
          options={[
            { value: '', label: 'Any time' },
            { value: '24h', label: labelWithCount('Last 24 hours', counts.posted?.['24h']) },
            { value: '7d', label: labelWithCount('Last 7 days', counts.posted?.['7d']) },
            { value: '30d', label: labelWithCount('Last 30 days', counts.posted?.['30d']) },
          ]}
        />
      </FormField>
      <FormField id="skills" label="Skills">
        <MultiSelect id="skills" value={values.skills} options={skillOptions} onChange={(skills) => onChange({ skills })} placeholder="Type a skill" />
      </FormField>
      <Checkbox label={`Closing soon${counts.closing_soon != null ? ` (${counts.closing_soon})` : ''}`} checked={values.closing_soon} onChange={(event) => onChange({ closing_soon: event.target.checked })} />
    </FilterBar>
  )
}

function labelWithCount(label, count) {
  return count == null ? label : `${label} (${count})`
}

function readFilters(params) {
  return {
    ...emptyFilters,
    q: params.get('q') ?? '',
    entity: params.get('entity') ?? '',
    department: params.get('department') ?? '',
    team: params.get('team') ?? '',
    level: params.get('level') ?? '',
    location: params.get('location') ?? '',
    skills: (params.get('skills') ?? '').split(',').filter(Boolean),
    posted: params.get('posted') ?? '',
    closing_soon: params.get('closing_soon') === '1',
    sort: params.get('sort') || 'newest',
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
    skills: filters.skills.join(','),
    posted: filters.posted,
    closing_soon: filters.closing_soon ? 1 : undefined,
    sort: filters.sort === 'newest' ? undefined : filters.sort,
  }
}

function buildChips(filters, meta, entities, update) {
  const chips = []
  const remove = (key) => update({ [key]: emptyFilters[key] })
  if (filters.q) chips.push({ key: 'q', label: `Search: ${filters.q}`, onRemove: () => remove('q') })
  if (filters.entity) chips.push({ key: 'entity', label: entities?.find((entity) => entity.slug === filters.entity)?.name ?? filters.entity, onRemove: () => remove('entity') })
  if (filters.department) {
    const name = meta?.departments?.find((department) => String(department.id) === filters.department)?.name ?? 'Department'
    chips.push({ key: 'department', label: name, onRemove: () => remove('department') })
  }
  if (filters.team) {
    const name = meta?.teams?.find((team) => String(team.id) === filters.team)?.name ?? 'Team'
    chips.push({ key: 'team', label: name, onRemove: () => remove('team') })
  }
  if (filters.level) chips.push({ key: 'level', label: meta?.enums?.job_levels?.find((level) => level.value === filters.level)?.label ?? filters.level, onRemove: () => remove('level') })
  if (filters.location) chips.push({ key: 'location', label: filters.location, onRemove: () => remove('location') })
  if (filters.posted) chips.push({ key: 'posted', label: filters.posted === '24h' ? 'Last 24 hours' : filters.posted === '7d' ? 'Last 7 days' : 'Last 30 days', onRemove: () => remove('posted') })
  if (filters.closing_soon) chips.push({ key: 'closing_soon', label: 'Closing soon', onRemove: () => remove('closing_soon') })
  filters.skills.forEach((slug) => {
    const name = meta?.skills?.find((skill) => skill.slug === slug)?.name ?? slug
    chips.push({
      key: `skill-${slug}`,
      label: name,
      onRemove: () => update({ skills: filters.skills.filter((item) => item !== slug) }),
    })
  })
  return chips
}
