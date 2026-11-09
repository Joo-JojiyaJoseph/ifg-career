import { useRef, useState } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import PropTypes from 'prop-types'
import { Aurora } from '@shared/ui/Aurora'
import { EntityLogo } from '@shared/ui/BrandLogo'
import { EntityArt } from '@shared/ui/illustrations/EntityArt'
import { Photo } from '@shared/ui/Photo'
import { WordReveal } from '@shared/ui/WordReveal'
import { Button } from '@shared/ui/Button'
import { EmptyState, Skeleton } from '@shared/ui/Skeleton'
import { useQuickApply } from '../apply/quickApplyContext'
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
  const { openJobAlerts } = useQuickApply()
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
  const advancedCount = ['department', 'team', 'level', 'location', 'posted'].filter((key) => filters[key]).length + (filters.skills.length ? 1 : 0) + (filters.closing_soon ? 1 : 0)

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
    <>
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <Aurora tone="dark" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-dots-light bg-dots [mask-image:radial-gradient(ellipse_at_top,#000_20%,transparent_70%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-12 md:pt-16">
          {entities.data?.length >= 2 ? (
            <div className="pointer-events-none absolute right-4 top-8 hidden w-80 lg:block" aria-hidden="true">
              <div className="absolute right-24 top-6 w-56 -rotate-6"><div className="glass-dark rounded-3xl border p-1.5 motion-safe:animate-float-slow">
                {entities.data[0].theme?.photo_url ? <Photo src={entities.data[0].theme.photo_url} className="aspect-[4/3] rounded-[1.2rem]" sizes="224px" /> : <EntityArt entity={entities.data[0]} index={0} className="block h-auto w-full rounded-[1.2rem] bg-white/95" />}
              </div></div>
              <div className="absolute right-0 top-20 w-56 rotate-3"><div className="glass-dark rounded-3xl border p-1.5 motion-safe:animate-float-slow [animation-delay:-3s]">
                {entities.data[1].theme?.photo_url ? <Photo src={entities.data[1].theme.photo_url} className="aspect-[4/3] rounded-[1.2rem]" sizes="224px" /> : <EntityArt entity={entities.data[1]} index={1} className="block h-auto w-full rounded-[1.2rem] bg-white/95" />}
              </div></div>
            </div>
          ) : null}
          <header className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Careers at Infolks Group</p>
            <WordReveal as="h1" text="Open roles" className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl" />
            <p className="mt-3 text-white/75 md:text-lg">Roles across Infolks Group that are still accepting applications.</p>
          </header>
        </div>
      </section>
      <div className="relative z-10 mx-auto -mt-16 flex max-w-5xl flex-col gap-5 px-4 pb-12">
        <div className="flex flex-col gap-2 rounded-3xl border border-white/70 bg-white/[0.94] p-2 shadow-lift backdrop-blur-xl sm:flex-row sm:items-center sm:p-2.5">
          <div className="min-w-0 flex-1">
            <SearchInput ref={searchRef} value={filters.q} onChange={(q) => update({ q })} placeholder="Search by role, skill or company" label="Search roles" />
          </div>
          <div className="hidden w-44 md:block">
            <label htmlFor="level-quick" className="sr-only">Level</label>
            <Select
              id="level-quick"
              value={filters.level}
              onChange={(level) => update({ level })}
              options={[{ value: '', label: 'All levels' }, ...(meta.data?.enums?.job_levels ?? []).map((level) => ({ value: level.value, label: level.label }))]}
            />
          </div>
          <div className="flex gap-2">
            <div className="min-w-0 flex-1 sm:w-44 sm:flex-none">
              <label htmlFor="sort" className="sr-only">Sort roles</label>
              <Select
                id="sort"
                value={filters.sort}
                onChange={(sort) => update({ sort })}
                options={[
                  { value: 'newest', label: 'Newest first' },
                  { value: 'closing', label: 'Closing soonest' },
                  { value: 'title', label: 'Title A–Z' },
                ]}
              />
            </div>
            <Button variant="secondary" icon={AdjustmentsHorizontalIcon} onClick={() => { setDraft(filters); setOpen(true) }} aria-label={`More filters${advancedCount ? `, ${advancedCount} active` : ''}`}>
              <span className="hidden sm:inline">Filters</span>
              {advancedCount ? <span className="ml-1 rounded-full bg-brand-600 px-1.5 text-xs text-white">{advancedCount}</span> : null}
            </Button>
          </div>
        </div>
        {entities.data?.length ? (
          <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
            <ul className="flex w-max gap-2" aria-label="Filter by company">
              <li>
                <EntityPill active={!filters.entity} onClick={() => update({ entity: '' })} label="All companies" count={counts.entity ? Object.values(counts.entity).reduce((sum, value) => sum + value, 0) : undefined} />
              </li>
              {entities.data.map((entity) => (
                <li key={entity.slug}>
                  <EntityPill entity={entity} active={filters.entity === entity.slug} onClick={() => update({ entity: filters.entity === entity.slug ? '' : entity.slug })} label={entity.name} count={counts.entity?.[entity.slug] ?? 0} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
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
          <EmptyState
            title="No roles match these filters"
            description="Try another skill, entity or location, or get an email when a new role opens."
            action={
              <div className="flex flex-col justify-center gap-2 sm:flex-row">
                <Button onClick={clearAll}>Clear filters</Button>
                <Button variant="secondary" onClick={openJobAlerts}>Get job alerts</Button>
              </div>
            }
          />
        ) : null}
        <div className="flex flex-col gap-4">
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
    </>
  )
}

function EntityPill({ entity, active, onClick, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border py-1 pl-1 pr-3.5 text-sm font-medium transition duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${entity ? '' : 'pl-3.5'} ${active ? 'border-transparent bg-gradient-to-r from-brand-700 to-brand-500 text-white shadow-md shadow-brand-500/30' : 'border-white/70 bg-white/70 text-navy backdrop-blur hover:bg-white'}`}
    >
      {entity ? <EntityLogo entity={entity} size="sm" className="!h-8 !w-8 !rounded-full !bg-white" /> : null}
      {label}
      {count !== undefined ? <span className={`rounded-full px-1.5 text-xs tabular-nums ${active ? 'bg-white/20' : 'bg-brand-50 text-brand-700'}`}>{count}</span> : null}
    </button>
  )
}

EntityPill.propTypes = {
  entity: PropTypes.object,
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  count: PropTypes.number,
}

function FilterFields({ values, onChange, meta, entities, counts }) {
  // With a company chosen, show its departments and skills plus the group-wide ones.
  const departments = (meta?.departments ?? []).filter((department) => !values.entity || !department.entity || department.entity === values.entity)
  const departmentLabel = (department) => (department.entity_name && !values.entity ? `${department.name} · ${department.entity_name}` : department.name)
  const teams = (meta?.teams ?? []).filter((team) => !values.department || String(team.department_id) === values.department)
  const skillOptions = (meta?.skills ?? []).filter((skill) => !values.entity || !skill.entities?.length || skill.entities.includes(values.entity) || values.skills?.includes(skill.slug)).map((skill) => ({
    value: skill.slug,
    label: labelWithCount(skill.name, counts.skill?.[skill.slug]),
  }))

  return (
    <FilterBar>
      <FormField id="entity" label="Entity">
        <Select
          id="entity"
          value={values.entity}
          onChange={(entity) => {
            const department = (meta?.departments ?? []).find((item) => String(item.id) === values.department)
            onChange(department?.entity && entity && department.entity !== entity ? { entity, department: '', team: '' } : { entity })
          }}
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
            ...departments.map((department) => ({
              value: String(department.id),
              label: labelWithCount(departmentLabel(department), counts.department?.[department.id]),
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
