import { useState } from 'react'
import PropTypes from 'prop-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MagnifyingGlassIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { Card } from '@shared/ui/Card'
import { ErrorState } from '@shared/ui/ErrorState'
import { IconButton } from '@shared/ui/IconButton'
import { FormField } from '@shared/ui/FormField'
import { Input } from '@shared/ui/Input'
import { Modal } from '@shared/ui/Modal'
import { Select } from '@shared/ui/Select'
import { EmptyState, Skeleton } from '@shared/ui/Skeleton'
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
  // null = closed; { id: null } = adding; { id, name } = renaming.
  const [dialog, setDialog] = useState(null)
  const [filter, setFilter] = useState('')

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: key })
    queryClient.invalidateQueries({ queryKey: ['hr-meta'] })
  }
  const fail = (error) => toast.push({ tone: 'error', message: error.errors ? Object.values(error.errors)[0][0] : error.message })

  const save = useMutation({
    mutationFn: ({ id, name, departmentId }) =>
      id
        ? updateListItem(type.id, id, { name })
        : createListItem(type.id, { name, ...(type.id === 'teams' && departmentId ? { department_id: Number(departmentId) } : {}) }),
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
        <Button icon={PlusIcon} onClick={() => setDialog({ id: null, name: '', departmentId: '' })}>Add {type.noun}</Button>
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
            {!item.is_active ? <Badge color="slate">Inactive</Badge> : null}
            <Switch checked={item.is_active} onChange={(value) => toggle.mutate({ id: item.id, body: { is_active: value } })} label={item.is_active ? 'Active' : 'Inactive'} srOnlyLabel />
            <IconButton label={`Rename ${item.name}`} onClick={() => setDialog({ id: item.id, name: item.name })}><PencilSquareIcon className="h-5 w-5" /></IconButton>
            <IconButton label={`Remove ${item.name}`} className="text-danger hover:bg-red-50" disabled={item.usage > 0} title={item.usage > 0 ? 'In use: deactivate it instead' : undefined} onClick={() => remove.mutate(item.id)}><TrashIcon className="h-5 w-5" /></IconButton>
          </li>
        ))}
      </ul>

      <Modal
        open={Boolean(dialog)}
        onClose={() => setDialog(null)}
        size="sm"
        icon={dialog?.id ? PencilSquareIcon : PlusIcon}
        title={dialog?.id ? `Rename ${type.noun}` : `Add a ${type.noun}`}
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
            {type.id === 'teams' && !dialog.id ? (
              <FormField id="new-team-department" label="Department">
                <Select id="new-team-department" value={dialog.departmentId} onChange={(departmentId) => setDialog({ ...dialog, departmentId })} options={[{ value: '', label: 'No department' }, ...(departments.data ?? []).map((item) => ({ value: String(item.id), label: item.name }))]} />
              </FormField>
            ) : null}
          </form>
        ) : null}
      </Modal>
    </Card>
  )
}

ListEditor.propTypes = { type: PropTypes.object.isRequired }
