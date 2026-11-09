import { useState } from 'react'
import PropTypes from 'prop-types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BuildingOffice2Icon, EyeSlashIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Badge } from '@shared/ui/Badge'
import { EntityLogo } from '@shared/ui/BrandLogo'
import { Button } from '@shared/ui/Button'
import { ConfirmDialog } from '@shared/ui/ConfirmDialog'
import { FormField } from '@shared/ui/FormField'
import { ImageField } from '@shared/ui/ImageField'
import { Input, Textarea } from '@shared/ui/Input'
import { Modal } from '@shared/ui/Modal'
import { Photo } from '@shared/ui/Photo'
import { EmptyState } from '@shared/ui/Skeleton'
import { Switch } from '@shared/ui/Switch'
import { useToast } from '@shared/ui/Toast'
import { useAuth } from '../auth/AuthProvider'
import { createEntity, deleteEntity, saveEntity } from './api'

const colours = [
  ['primary_color', 'Primary', 'Buttons and badges (white text sits on it).'],
  ['secondary_color', 'Dark background', 'Card shading and job page header.'],
  ['accent_color', 'Accent', 'Highlights, glows and taglines.'],
]

const blank = { name: '', slug: '', motto: '', short_description: '', website_url: '', primary_color: '#1976D2', secondary_color: '#0A2540', accent_color: '#29B6F6', is_active: true }

/**
 * The companies in the group, as shown on the careers page. Everyone with Website Content access can edit a
 * company's text, colours and images; Admin (entities.manage) can also add, rename, hide and delete companies.
 */
export function EntitiesEditor({ entities = [] }) {
  const { user } = useAuth()
  const canManage = Boolean(user?.permissions?.includes('entities.manage'))
  const toast = useToast()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(null)
  const [removing, setRemoving] = useState(null)

  const remove = useMutation({
    mutationFn: (entity) => deleteEntity(entity.slug),
    onSuccess: (_, entity) => {
      toast.push({ tone: 'success', message: `${entity.name} deleted` })
      setRemoving(null)
      refresh(queryClient)
    },
    onError: (error) => {
      toast.push({ tone: 'error', message: error.errors?.entity?.[0] ?? error.message })
      setRemoving(null)
    },
  })

  return (
    <section className="flex flex-col gap-4" aria-labelledby="companies-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="companies-title" className="font-display text-lg font-semibold text-ink">Companies</h2>
          <p className="text-sm text-muted">{entities.length} {entities.length === 1 ? 'company' : 'companies'} in the group. Each one's colours theme its jobs on the careers site.</p>
        </div>
        {canManage ? <Button icon={PlusIcon} onClick={() => setEditing(blank)}>Add company</Button> : null}
      </div>

      {entities.length === 0 ? <EmptyState title="No companies yet" description="Add the first company in the group." /> : null}

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {entities.map((entity) => {
          const history = (entity.jobs_count ?? 0) + (entity.applications_count ?? 0)
          return (
            <li key={entity.slug} className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift" style={{ '--p': entity.primary_color, '--d': entity.secondary_color, '--a': entity.accent_color }}>
              <div className="relative h-32 bg-gradient-to-br from-[var(--d)] via-[var(--p)] to-[var(--a)]">
                {entity.theme?.photo_url ? <Photo src={entity.theme.photo_url} alt="" className="!absolute inset-0 opacity-70" sizes="300px" /> : null}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--d)] to-transparent" aria-hidden="true" />
                {!entity.is_active ? <span className="absolute right-3 top-3"><Badge color="slate"><EyeSlashIcon className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />Hidden</Badge></span> : null}
                <EntityLogo entity={entity} size="md" className="absolute -bottom-5 left-4 !bg-white shadow-card" />
              </div>
              <div className="flex flex-1 flex-col gap-1 px-4 pb-4 pt-7">
                <p className="font-display text-lg font-semibold text-ink">{entity.name}</p>
                <p className="text-sm text-muted">{entity.motto || 'No tagline yet'}</p>
                <p className="mt-1 text-xs text-muted">{entity.jobs_count ?? 0} jobs · {entity.applications_count ?? 0} applications</p>
                <div className="mt-auto flex gap-2 pt-3">
                  <Button size="sm" variant="secondary" icon={PencilSquareIcon} className="flex-1" onClick={() => setEditing(entity)}>Edit</Button>
                  {canManage ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={TrashIcon}
                      className="text-danger hover:bg-red-50"
                      disabled={history > 0}
                      title={history > 0 ? 'This company has jobs or applications. Hide it instead.' : undefined}
                      aria-label={`Delete ${entity.name}`}
                      onClick={() => setRemoving(entity)}
                    />
                  ) : null}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {editing ? <EntityModal entity={editing} canManage={canManage} onClose={() => setEditing(null)} /> : null}
      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title={`Delete ${removing?.name ?? 'this company'}?`}
        message="It disappears from the careers site and the HR portal. This cannot be undone."
        confirmLabel="Delete company"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(removing)}
      />
    </section>
  )
}

EntitiesEditor.propTypes = { entities: PropTypes.array }

function refresh(queryClient) {
  queryClient.invalidateQueries({ queryKey: ['hr-content', 'entities'] })
  queryClient.invalidateQueries({ queryKey: ['hr-entities'] })
  queryClient.invalidateQueries({ queryKey: ['public-entities'] })
}

/** Add or edit one company: details, colours (with a live preview) and images. */
function EntityModal({ entity, canManage, onClose }) {
  const creating = !entity.slug
  const toast = useToast()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(true)
  const [values, setValues] = useState({ ...blank, ...entity, is_active: entity.is_active ?? true })
  const [files, setFiles] = useState({ logo: null, pattern: null, photo: null })
  const [errors, setErrors] = useState({})
  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }))
  const close = () => {
    setOpen(false)
    setTimeout(onClose, 200)
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        motto: values.motto ?? '',
        short_description: values.short_description ?? '',
        primary_color: values.primary_color,
        secondary_color: values.secondary_color,
        accent_color: values.accent_color,
        website_url: values.website_url ?? '',
        ...(canManage ? { name: values.name, is_active: Boolean(values.is_active) } : {}),
        ...(creating && values.slug ? { slug: values.slug } : {}),
        ...(files.logo ? { logo: files.logo } : {}),
        ...(files.pattern ? { pattern: files.pattern } : {}),
        ...(files.photo ? { photo: files.photo } : {}),
      }
      return creating ? createEntity(payload) : saveEntity(entity.slug, payload)
    },
    onSuccess: () => {
      toast.push({ tone: 'success', message: creating ? `${values.name} added` : `${values.name} saved` })
      refresh(queryClient)
      close()
    },
    onError: (error) => {
      setErrors(Object.fromEntries(Object.entries(error.errors ?? {}).map(([key, value]) => [key, value[0]])))
      toast.push({ tone: 'error', message: error.message })
    },
  })

  const id = (key) => `entity-${key}`
  const preview = { ...values, theme: { ...entity.theme, primary: values.primary_color } }

  return (
    <Modal
      open={open}
      onClose={close}
      size="xl"
      icon={BuildingOffice2Icon}
      title={creating ? 'Add a company' : `Edit ${entity.name}`}
      description={creating ? 'It appears on the careers site as soon as it is saved and visible.' : 'Changes show on the careers site straight away.'}
      footer={
        <>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button type="submit" form="entity-form" loading={save.isPending}>{creating ? 'Add company' : 'Save changes'}</Button>
        </>
      }
    >
      <form id="entity-form" noValidate className="flex flex-col gap-8" onSubmit={(event) => { event.preventDefault(); save.mutate() }}>
        <Part number="1" title="Details">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id={id('name')} label="Company name" required error={errors.name} hint={canManage ? undefined : 'Only an Admin can rename a company.'}>
              <Input id={id('name')} maxLength={50} value={values.name ?? ''} onChange={set('name')} disabled={!canManage} invalid={Boolean(errors.name)} />
            </FormField>
            {creating ? (
              <FormField id={id('slug')} label="Web address (optional)" error={errors.slug} hint={`Used in links like /jobs?entity=${values.slug || 'company-name'}. Made from the name if left empty.`}>
                <Input id={id('slug')} maxLength={50} value={values.slug ?? ''} onChange={(event) => setValues((current) => ({ ...current, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} />
              </FormField>
            ) : (
              <FormField id={id('website')} label="Website" error={errors.website_url}>
                <Input id={id('website')} type="url" placeholder="https://" value={values.website_url ?? ''} onChange={set('website_url')} />
              </FormField>
            )}
            <FormField id={id('motto')} label="Tagline" hint="What the company does, for example “AI Data Annotation Company”." error={errors.motto}>
              <Input id={id('motto')} maxLength={150} value={values.motto ?? ''} onChange={set('motto')} />
            </FormField>
            {creating ? (
              <FormField id={id('website')} label="Website" error={errors.website_url}>
                <Input id={id('website')} type="url" placeholder="https://" value={values.website_url ?? ''} onChange={set('website_url')} />
              </FormField>
            ) : null}
            <div className="md:col-span-2">
              <FormField id={id('description')} label="Line about working here" hint="One or two sentences shown on the company's card." error={errors.short_description}>
                <Textarea id={id('description')} rows={3} maxLength={400} value={values.short_description ?? ''} onChange={set('short_description')} />
              </FormField>
            </div>
            {canManage ? (
              <div className="md:col-span-2">
                <Switch checked={Boolean(values.is_active)} onChange={(is_active) => setValues((current) => ({ ...current, is_active }))} label="Show this company on the careers site" />
              </div>
            ) : null}
          </div>
        </Part>

        <Part number="2" title="Colours" hint="Each job at this company is shown in these colours.">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="grid gap-4">
              {colours.map(([key, label, hint]) => (
                <FormField key={key} id={id(key)} label={label} hint={hint} error={errors[key]}>
                  <div className="flex items-center gap-2">
                    <input type="color" aria-label={`${label} colour picker`} className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-border bg-white p-1" value={values[key] || '#1976D2'} onChange={set(key)} />
                    <Input id={id(key)} value={values[key] ?? ''} onChange={set(key)} maxLength={7} invalid={Boolean(errors[key])} />
                  </div>
                </FormField>
              ))}
            </div>
            <div aria-label="Preview" className="flex min-h-48 flex-col justify-end overflow-hidden rounded-3xl bg-gradient-to-b from-[color-mix(in_srgb,var(--a)_25%,var(--d))] to-[var(--d)] to-70% p-3 text-white shadow-lift" style={{ '--p': values.primary_color, '--d': values.secondary_color, '--a': values.accent_color }}>
              <div className="rounded-2xl border border-white/20 bg-black/25 p-4 backdrop-blur">
                <div className="flex items-center gap-2">
                  <EntityLogo entity={preview} size="sm" className="!bg-white" />
                  <p className="font-display font-semibold">{values.name || 'Company name'}</p>
                </div>
                <p className="mt-1 text-sm text-[var(--a)]">{values.motto || 'Tagline'}</p>
                <span className="mt-3 inline-flex rounded-full bg-[var(--p)] px-3 py-1 text-xs font-medium">{values.name || 'Badge'}</span>
              </div>
            </div>
          </div>
        </Part>

        <Part number="3" title="Images" hint="Large photos are resized before uploading.">
          <div className="grid gap-5">
            <FormField id={id('photo')} label="Card photo" error={errors.photo}>
              <ImageField id={id('photo')} currentUrl={entity.theme?.photo_url} file={files.photo} onChange={(photo) => setFiles((current) => ({ ...current, photo }))} hint="Shown on the company's card and job pages. A landscape team photo works best. JPG, PNG or WebP." />
            </FormField>
            <div className="grid gap-5 md:grid-cols-2">
              <FormField id={id('logo')} label="Logo" error={errors.logo}>
                <ImageField id={id('logo')} accept="image/svg+xml,image/png,image/webp,image/jpeg" currentUrl={entity.theme?.logo_url} file={files.logo} onChange={(logo) => setFiles((current) => ({ ...current, logo }))} hint="SVG or a transparent PNG looks best; JPG works too." />
              </FormField>
              <FormField id={id('pattern')} label="Pattern (optional)" error={errors.pattern}>
                <ImageField id={id('pattern')} accept="image/svg+xml,image/png,image/webp,image/jpeg" currentUrl={entity.theme?.pattern_url} file={files.pattern} onChange={(pattern) => setFiles((current) => ({ ...current, pattern }))} hint="A subtle background texture for job pages." />
              </FormField>
            </div>
          </div>
        </Part>
      </form>
    </Modal>
  )
}

EntityModal.propTypes = {
  entity: PropTypes.object.isRequired,
  canManage: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
}

function Part({ number, title, hint, children }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-8">
      <div className="flex items-start gap-3 lg:flex-col lg:gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 font-display text-sm font-semibold text-white" aria-hidden="true">{number}</span>
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
          {hint ? <p className="text-sm text-muted">{hint}</p> : null}
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

Part.propTypes = { number: PropTypes.string.isRequired, title: PropTypes.string.isRequired, hint: PropTypes.string, children: PropTypes.node }
