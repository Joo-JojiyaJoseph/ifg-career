import { useState } from 'react'
import PropTypes from 'prop-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MagnifyingGlassIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Badge } from '@shared/ui/Badge'
import { EntityLogo } from '@shared/ui/BrandLogo'
import { Button } from '@shared/ui/Button'
import { Card } from '@shared/ui/Card'
import { ErrorState } from '@shared/ui/ErrorState'
import { IconButton } from '@shared/ui/IconButton'
import { FormField } from '@shared/ui/FormField'
import { Input } from '@shared/ui/Input'
import { MultiSelect } from '@shared/ui/MultiSelect'
import { Modal } from '@shared/ui/Modal'
import { Select } from '@shared/ui/Select'
import { EmptyState, Skeleton } from '@shared/ui/Skeleton'
import { Switch } from '@shared/ui/Switch'
import { Tabs } from '@shared/ui/Tabs'
import { useToast } from '@shared/ui/Toast'
import { fetchEntityContent } from '../content/api'
import { createListItem, deleteListItem, fetchList, updateListItem } from './api'

const types = [{ id: 'departments', label: 'Departments', noun: 'department' }, { id: 'teams', label: 'Teams', noun: 'team' }, { id: 'skills', label: 'Skills', noun: 'skill' }]

/**
 * Departments sit under a company (or are group-wide), teams under a department, and skills are linked to
 * companies (none = every company). The company filter shows one company's lists plus the group-wide items.
 */
export function ListsPanel() {
  const [type, setType] = useState('departments')
  const [company, setCompany] = useState('')
  const entities = useQuery({ queryKey: ['hr-content', 'entities'], queryFn: fetchEntityContent, staleTime: 300_000 })
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs items={types} value={type} onChange={setType} label="Lists" />
        <div className="sm:w-60">
          <label htmlFor="lists-company" className="sr-only">Company</label>
          <Select id="lists-company" value={company} onChange={setCompany} options={[{ value: '', label: 'All companies' }, ...(entities.data ?? []).map((entity) => ({ value: entity.slug, label: entity.name }))]} />
        </div>
      </div>
      <ListEditor key={type} type={types.find((item) => item.id === type)} company={company} entities={entities.data ?? []} />
    </div>
  )
}

function ListEditor({ type, company, entities }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const key = ['hr-list', type.id, company]
  const list = useQuery({ queryKey: key, queryFn: () => fetchList(type.id, company) })
  const departments = useQuery({ queryKey: ['hr-list', 'departments', ''], queryFn: () => fetchList('departments'), enabled: type.id === 'teams' })
  const companyName = (slug) => entities.find((entity) => entity.slug === slug)?.name
  // null = closed; { id: null } = adding; { id, name } = renaming.
  const [dialog, setDialog] = useState(null)
  const [filter, setFilter] = useState('')

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['hr-list'] })
    queryClient.invalidateQueries({ queryKey: ['hr-meta'] })
  }
  const fail = (error) => toast.push({ tone: 'error', message: error.errors ? Object.values(error.errors)[0][0] : error.message })

  const save = useMutation({
    mutationFn: ({ id, name, departmentId, entity, skillEntities }) => {
      const body = {
        name,
        ...(type.id === 'departments' ? { entity: entity || null } : {}),
        ...(type.id === 'skills' ? { entities: skillEntities ?? [] } : {}),
        ...(type.id === 'teams' && !id && departmentId ? { department_id: Number(departmentId) } : {}),
      }
      return id ? updateListItem(type.id, id, body) : createListItem(type.id, body)
    },
    onSuccess: (_, variables) => {
      toast.push({ tone: 'success', message: variables.id ? 'Saved' : `${variables.name} added` })
      setDialog(null)
      refresh()
    },
    onError: fail,
  })
  const toggle = useMutation({ mutationFn: ({ id, body }) => updateListItem(type.id, id, body), onSuccess: () => { toast.push({ tone: 'success', message: 'Saved' }); refresh() }, onError: fail })
  const remove = useMutation({ mutationFn: (id) => deleteListItem(type.id, id), onSuccess: () => { toast.push({ tone: 'success', message: 'Removed' }); refresh() }, onError: fail })

  const rows = (list.data ?? []).filter((item) => item.name.toLowerCase().includes(filter.toLowerCase()))

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
          <Input className="pl-10" aria-label={`Search ${type.label.toLowerCase()}`} placeholder={`Search ${type.label.toLowerCase()}`} value={filter} onChange={(event) => setFilter(event.target.value)} />
        </div>
        <Button icon={PlusIcon} onClick={() => setDialog({ id: null, name: '', departmentId: '', entity: company, skillEntities: company ? [company] : [] })}>Add {type.noun}</Button>
      </div>
      {list.isLoading ? <Skeleton className="h-40" /> : null}
      {list.isError ? <ErrorState onRetry={() => list.refetch()} /> : null}
      {!list.isLoading && !list.isError && rows.length === 0 ? (
        <EmptyState title={filter ? `No ${type.label.toLowerCase()} match “${filter}”` : `No ${type.label.toLowerCase()} yet`} description={`Add a ${type.noun} to use it on job posts.`} />
      ) : null}
      {rows.length ? <p className="text-sm text-muted">{rows.length} {rows.length === 1 ? type.noun : type.label.toLowerCase()}</p> : null}
      <ul className="grid gap-2">
        {rows.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-white px-4 py-2 transition duration-200 hover:border-brand-200 hover:shadow-card">
            <span className="flex min-w-0 flex-1 flex-col">
              <span className={`truncate font-medium ${item.is_active ? 'text-ink' : 'text-muted line-through'}`}>{item.name}</span>
              <span className="text-xs text-muted">{item.usage} {item.usage === 1 ? 'job' : 'jobs'}{item.department ? ` · ${item.department}` : ''}</span>
            </span>
            <CompanyTags item={item} type={type.id} entities={entities} />
            {!item.is_active ? <Badge color="slate">Inactive</Badge> : null}
            <Switch checked={item.is_active} onChange={(value) => toggle.mutate({ id: item.id, body: { is_active: value } })} label={item.is_active ? 'Active' : 'Inactive'} srOnlyLabel />
            <IconButton label={`Edit ${item.name}`} onClick={() => setDialog({ id: item.id, name: item.name, entity: item.entity?.slug ?? '', skillEntities: (item.entities ?? []).map((entity) => entity.slug) })}><PencilSquareIcon className="h-5 w-5" /></IconButton>
            <IconButton label={`Remove ${item.name}`} className="text-danger hover:bg-red-50" disabled={item.usage > 0} title={item.usage > 0 ? 'In use: deactivate it instead' : undefined} onClick={() => remove.mutate(item.id)}><TrashIcon className="h-5 w-5" /></IconButton>
          </li>
        ))}
      </ul>

      <Modal
        open={Boolean(dialog)}
        onClose={() => setDialog(null)}
        size="sm"
        icon={dialog?.id ? PencilSquareIcon : PlusIcon}
        title={dialog?.id ? `Edit ${type.noun}` : `Add a ${type.noun}`}
        description={type.id === 'departments' ? 'A department belongs to one company, or to the whole group.' : type.id === 'skills' ? 'Link the skill to the companies that use it. Leave it empty for every company.' : company ? `Showing ${companyName(company)}'s departments.` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button>
            <Button type="submit" form={`list-form-${type.id}`} loading={save.isPending} disabled={!dialog?.name?.trim()}>{dialog?.id ? 'Save' : 'Add'}</Button>
          </>
        }
      >
        {dialog ? (
          <form id={`list-form-${type.id}`} className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); if (dialog.name.trim()) save.mutate({ ...dialog, name: dialog.name.trim() }) }}>
            <FormField id={`list-name-${type.id}`} label="Name" required>
              <Input id={`list-name-${type.id}`} value={dialog.name} maxLength={100} onChange={(event) => setDialog({ ...dialog, name: event.target.value })} />
            </FormField>
            {type.id === 'departments' ? (
              <FormField id="department-company" label="Company">
                <Select id="department-company" value={dialog.entity ?? ''} onChange={(entity) => setDialog({ ...dialog, entity })} options={[{ value: '', label: 'Whole group (all companies)' }, ...entities.map((entity) => ({ value: entity.slug, label: entity.name }))]} />
              </FormField>
            ) : null}
            {type.id === 'skills' ? (
              <FormField id="skill-companies" label="Companies" hint="Empty means every company can use it.">
                <MultiSelect id="skill-companies" noun="company" placeholder="Add a company" value={dialog.skillEntities ?? []} onChange={(skillEntities) => setDialog({ ...dialog, skillEntities })} options={entities.map((entity) => ({ value: entity.slug, label: entity.name }))} />
              </FormField>
            ) : null}
            {type.id === 'teams' && !dialog.id ? (
              <FormField id="new-team-department" label="Department">
                <Select
                  id="new-team-department"
                  value={dialog.departmentId}
                  onChange={(departmentId) => setDialog({ ...dialog, departmentId })}
                  options={[
                    { value: '', label: 'No department' },
                    ...(departments.data ?? [])
                      .filter((item) => !company || !item.entity || item.entity.slug === company)
                      .map((item) => ({ value: String(item.id), label: item.entity ? `${item.name} · ${item.entity.name}` : `${item.name} · Whole group` })),
                  ]}
                />
              </FormField>
            ) : null}
          </form>
        ) : null}
      </Modal>
    </Card>
  )
}

ListEditor.propTypes = { type: PropTypes.object.isRequired, company: PropTypes.string, entities: PropTypes.array.isRequired }

/** Which companies an item belongs to: a department's company, a team's (via its department), a skill's list. */
function CompanyTags({ item, type, entities }) {
  const owners = type === 'skills' ? item.entities ?? [] : item.entity ? [item.entity] : []
  if (!owners.length) return <Badge color="slate">{type === 'skills' ? 'All companies' : 'Whole group'}</Badge>
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {owners.map((owner) => {
        const entity = entities.find((candidate) => candidate.slug === owner.slug) ?? owner
        return (
          <span key={owner.slug} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white py-0.5 pl-0.5 pr-2.5 text-xs font-medium text-navy">
            <EntityLogo entity={entity} size="sm" className="!h-6 !w-6 !text-[9px]" />
            {owner.name}
          </span>
        )
      })}
    </span>
  )
}

CompanyTags.propTypes = { item: PropTypes.object.isRequired, type: PropTypes.string.isRequired, entities: PropTypes.array.isRequired }
