import { useState } from 'react'
import PropTypes from 'prop-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Button } from '@shared/ui/Button'
import { ConfirmDialog } from '@shared/ui/ConfirmDialog'
import { ErrorState } from '@shared/ui/ErrorState'
import { IconButton } from '@shared/ui/IconButton'
import { SlideOver } from '@shared/ui/Modal'
import { EmptyState, Skeleton } from '@shared/ui/Skeleton'
import { SafeHtml } from '@shared/ui/SafeHtml'
import { SortableList } from '@shared/ui/SortableList'
import { Switch } from '@shared/ui/Switch'
import { useToast } from '@shared/ui/Toast'
import { iconFor } from '@shared/ui/heroiconMap'
import { formatDate } from '@shared/lib/formatDate'
import { FieldInput } from './FieldInput'
import { deleteItem, fetchItems, reorderItems, saveItem } from './api'
import { sections } from './fields'

/**
 * Generic editor for one list-style content section: add, edit, publish, reorder and delete.
 */
export function ListEditor({ type, entities }) {
  const section = sections[type]
  const toast = useToast()
  const queryClient = useQueryClient()
  const key = ['hr-content', type]
  const list = useQuery({ queryKey: key, queryFn: () => fetchItems(type), refetchInterval: (query) => (query.state.data?.some((item) => item.image_processing) ? 3000 : false) })
  const [editing, setEditing] = useState(null)
  const [removing, setRemoving] = useState(null)

  const refresh = () => queryClient.invalidateQueries({ queryKey: key })
  const onError = (error) => toast.push({ tone: 'error', message: error.message })

  const reorder = useMutation({
    mutationFn: (ids) => reorderItems(type, ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (current) => ids.map((id) => current.find((item) => item.id === id)))
      return { previous }
    },
    onError: (error, _ids, context) => {
      queryClient.setQueryData(key, context?.previous)
      onError(error)
    },
    onSuccess: () => toast.push({ tone: 'success', message: 'Order saved' }),
  })
  const toggle = useMutation({
    mutationFn: (item) => saveItem(type, { is_published: !item.is_published }, item.id),
    onSuccess: (item) => {
      toast.push({ tone: 'success', message: item.is_published ? 'Published on the careers site' : 'Hidden from the careers site' })
      refresh()
    },
    onError,
  })
  const remove = useMutation({
    mutationFn: (item) => deleteItem(type, item.id),
    onSuccess: () => {
      toast.push({ tone: 'success', message: `The ${section.noun} was removed` })
      setRemoving(null)
      refresh()
    },
    onError,
  })

  const items = list.data ?? []

  return (
    <section className="flex flex-col gap-4" aria-labelledby={`${type}-title`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={`${type}-title`} className="font-display text-xl font-semibold text-navy">{section.title}</h2>
          {section.hint ? <p className="text-sm text-muted">{section.hint}</p> : null}
        </div>
        <Button icon={PlusIcon} onClick={() => setEditing({})}>Add {section.noun}</Button>
      </div>
      {list.isLoading ? <Skeleton className="h-40" /> : null}
      {list.isError ? <ErrorState onRetry={() => list.refetch()} /> : null}
      {!list.isLoading && !list.isError && items.length === 0 ? <EmptyState title={`No ${section.noun}s yet`} action={<Button onClick={() => setEditing({})}>Add the first one</Button>} /> : null}
      {items.length ? (
        <SortableList
          items={items}
          disabled={reorder.isPending}
          onReorder={(ids) => reorder.mutate(ids)}
          renderItem={(item, index) => {
            const summary = section.summary(item, index)
            const Icon = summary.icon ? iconFor(summary.icon) : null
            return (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {summary.image ? <img src={summary.image} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover" loading="lazy" /> : null}
                {item.image_processing ? <span className="inline-flex h-16 w-20 shrink-0 animate-pulse items-center justify-center rounded-lg bg-slate-100 text-xs text-muted">Processing</span> : null}
                {Icon ? <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700"><Icon className="h-6 w-6" aria-hidden="true" /></span> : null}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-navy">{summary.title}</p>
                  {summary.date ? <p className="text-xs text-muted">{formatDate(summary.date)}</p> : null}
                  {summary.text ? <p className="line-clamp-2 text-sm text-muted">{summary.text}</p> : null}
                  {summary.html ? <SafeHtml html={summary.html} className="prose prose-sm line-clamp-2 max-w-none text-muted" /> : null}
                  {type === 'employee-stories' && !item.publish_permission_confirmed ? <p className="mt-1 text-xs font-medium text-amber-700">Waiting for the employee's permission</p> : null}
                </div>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={item.is_published}
                    disabled={toggle.isPending || (type === 'employee-stories' && !item.publish_permission_confirmed && !item.is_published)}
                    onChange={() => toggle.mutate(item)}
                    label={item.is_published ? 'Published' : 'Hidden'}
                  />
                  <IconButton label={`Edit ${summary.title}`} onClick={() => setEditing(item)}><PencilSquareIcon className="h-5 w-5" /></IconButton>
                  <IconButton label={`Remove ${summary.title}`} onClick={() => setRemoving(item)} className="text-danger hover:bg-red-50"><TrashIcon className="h-5 w-5" /></IconButton>
                </div>
              </div>
            )
          }}
        />
      ) : null}
      <ItemForm type={type} item={editing} entities={entities} onClose={() => setEditing(null)} onSaved={refresh} />
      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={() => remove.mutate(removing)}
        loading={remove.isPending}
        title={`Remove this ${section.noun}?`}
        message="It disappears from the careers site straight away."
        confirmLabel="Remove"
      />
    </section>
  )
}

function ItemForm({ type, item, entities, onClose, onSaved }) {
  const section = sections[type]
  const toast = useToast()
  const creating = !item?.id
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [source, setSource] = useState(null)

  if (item !== source) {
    setSource(item)
    setErrors({})
    const fixed = Object.fromEntries(section.fields.filter((field) => field.type === 'hidden').map((field) => [field.name, field.value]))
    setValues(item ? { ...Object.fromEntries(section.fields.map((field) => [field.name, field.type === 'entity' ? item.entity?.slug ?? '' : field.type === 'image' ? null : item[field.name] ?? (field.type === 'switch' ? false : '')])), ...fixed } : fixed)
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = { ...values }
      section.fields.forEach((field) => {
        if (field.type === 'image' && !(payload[field.name] instanceof File)) delete payload[field.name]
        if (field.showIf && !field.showIf(values)) delete payload[field.name]
      })
      return saveItem(type, payload, item?.id)
    },
    onSuccess: () => {
      toast.push({ tone: 'success', message: creating ? `The ${section.noun} was added` : 'Changes saved' })
      onSaved()
      onClose()
    },
    onError: (error) => {
      setErrors(Object.fromEntries(Object.entries(error.errors ?? {}).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])))
      toast.push({ tone: 'error', message: error.message })
    },
  })

  return (
    <SlideOver open={item !== null} onClose={onClose} title={creating ? `Add ${section.noun}` : `Edit ${section.noun}`}>
      <form className="flex flex-col gap-4" noValidate onSubmit={(event) => { event.preventDefault(); save.mutate() }}>
        {section.fields.filter((field) => field.type !== 'hidden' && (!field.showIf || field.showIf(values))).map((field) => (
          <FieldInput
            key={field.name}
            field={field}
            creating={creating}
            value={values[field.name]}
            error={errors[field.name] ?? (field.type === 'image' ? errors.image : undefined) ?? (field.name === 'publish_permission_confirmed' ? errors.is_published : undefined)}
            entities={entities}
            currentImage={item?.image_url}
            processing={item?.image_processing}
            onChange={(value) => setValues((current) => ({ ...current, [field.name]: value }))}
          />
        ))}
        <div className="mt-2 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={save.isPending}>{creating ? 'Add' : 'Save'}</Button>
        </div>
      </form>
    </SlideOver>
  )
}

ListEditor.propTypes = { type: PropTypes.string.isRequired, entities: PropTypes.array }
ItemForm.propTypes = { type: PropTypes.string.isRequired, item: PropTypes.object, entities: PropTypes.array, onClose: PropTypes.func.isRequired, onSaved: PropTypes.func.isRequired }
