import { useState } from 'react'
import PropTypes from 'prop-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { Card } from '@shared/ui/Card'
import { ErrorState } from '@shared/ui/ErrorState'
import { IconButton } from '@shared/ui/IconButton'
import { Input } from '@shared/ui/Input'
import { Select } from '@shared/ui/Select'
import { Skeleton } from '@shared/ui/Skeleton'
import { Switch } from '@shared/ui/Switch'
import { Tabs } from '@shared/ui/Tabs'
import { useToast } from '@shared/ui/Toast'
import { createListItem, deleteListItem, fetchList, updateListItem } from './api'

const types = [{ id: 'departments', label: 'Departments', noun: 'department' }, { id: 'teams', label: 'Teams', noun: 'team' }, { id: 'skills', label: 'Skills', noun: 'skill' }]

export function ListsPanel() {
  const [type, setType] = useState('departments')
  return (
    <div className="flex flex-col gap-4">
      <Tabs items={types} value={type} onChange={setType} label="Lists" />
      <ListEditor key={type} type={types.find((item) => item.id === type)} />
    </div>
  )
}

function ListEditor({ type }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const key = ['hr-list', type.id]
  const list = useQuery({ queryKey: key, queryFn: () => fetchList(type.id) })
  const departments = useQuery({ queryKey: ['hr-list', 'departments'], queryFn: () => fetchList('departments'), enabled: type.id === 'teams' })
  const [name, setName] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('')

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: key })
    queryClient.invalidateQueries({ queryKey: ['hr-meta'] })
  }
  const fail = (error) => toast.push({ tone: 'error', message: error.errors ? Object.values(error.errors)[0][0] : error.message })

  const create = useMutation({
    mutationFn: () => createListItem(type.id, { name, ...(type.id === 'teams' && departmentId ? { department_id: Number(departmentId) } : {}) }),
    onSuccess: () => { toast.push({ tone: 'success', message: `${name} added` }); setName(''); refresh() },
    onError: fail,
  })
  const update = useMutation({ mutationFn: ({ id, body }) => updateListItem(type.id, id, body), onSuccess: () => { toast.push({ tone: 'success', message: 'Saved' }); setEditing(null); refresh() }, onError: fail })
  const remove = useMutation({ mutationFn: (id) => deleteListItem(type.id, id), onSuccess: () => { toast.push({ tone: 'success', message: 'Removed' }); refresh() }, onError: fail })

  const rows = (list.data ?? []).filter((item) => item.name.toLowerCase().includes(filter.toLowerCase()))

  return (
    <Card className="flex flex-col gap-4">
      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); if (name.trim()) create.mutate() }}>
        <label htmlFor={`new-${type.id}`} className="sr-only">New {type.noun}</label>
        <Input id={`new-${type.id}`} value={name} onChange={(event) => setName(event.target.value)} placeholder={`New ${type.noun}`} maxLength={100} />
        {type.id === 'teams' ? (
          <div className="sm:w-56"><Select id="new-team-department" value={departmentId} onChange={setDepartmentId} options={[{ value: '', label: 'No department' }, ...(departments.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))]} /></div>
        ) : null}
        <Button type="submit" icon={PlusIcon} loading={create.isPending} disabled={!name.trim()}>Add</Button>
      </form>
      <Input aria-label={`Filter ${type.label.toLowerCase()}`} placeholder={`Filter ${type.label.toLowerCase()}`} value={filter} onChange={(event) => setFilter(event.target.value)} />
      {list.isLoading ? <Skeleton className="h-40" /> : null}
      {list.isError ? <ErrorState onRetry={() => list.refetch()} /> : null}
      <p className="text-sm text-muted">{rows.length} {type.label.toLowerCase()}</p>
      <ul className="divide-y divide-border">
        {rows.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-3 py-2">
            {editing?.id === item.id ? (
              <form className="flex flex-1 gap-2" onSubmit={(event) => { event.preventDefault(); update.mutate({ id: item.id, body: { name: editing.name } }) }}>
                <Input aria-label="Name" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} />
                <Button size="sm" type="submit" loading={update.isPending}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              </form>
            ) : (
              <>
                <span className={`flex-1 ${item.is_active ? 'text-text' : 'text-muted line-through'}`}>{item.name}</span>
                {item.department ? <Badge color="slate">{item.department}</Badge> : null}
                <span className="text-xs text-muted">{item.usage} jobs</span>
                <Switch checked={item.is_active} onChange={(value) => update.mutate({ id: item.id, body: { is_active: value } })} label={item.is_active ? 'Active' : 'Inactive'} srOnlyLabel />
                <IconButton label={`Rename ${item.name}`} onClick={() => setEditing({ id: item.id, name: item.name })}><PencilSquareIcon className="h-5 w-5" /></IconButton>
                <IconButton label={`Remove ${item.name}`} className="text-danger hover:bg-red-50" disabled={item.usage > 0} title={item.usage > 0 ? 'In use: deactivate it instead' : undefined} onClick={() => remove.mutate(item.id)}><TrashIcon className="h-5 w-5" /></IconButton>
              </>
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
}

ListEditor.propTypes = { type: PropTypes.object.isRequired }
