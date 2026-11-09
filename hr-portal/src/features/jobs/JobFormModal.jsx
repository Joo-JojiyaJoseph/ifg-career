import { Fragment, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import PropTypes from 'prop-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowPathRoundedSquareIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@shared/ui/Button'
import { ConfirmDialog } from '@shared/ui/ConfirmDialog'
import { DateInput } from '@shared/ui/DateInput'
import { todayIso } from '@shared/lib/formatDate'
import { ErrorState } from '@shared/ui/ErrorState'
import { FormField } from '@shared/ui/FormField'
import { Input, Textarea } from '@shared/ui/Input'
import { Modal } from '@shared/ui/Modal'
import { MultiSelect } from '@shared/ui/MultiSelect'
import { Select } from '@shared/ui/Select'
import { Skeleton } from '@shared/ui/Skeleton'
import { StatusBadge } from '@shared/ui/Badge'
import { useToast } from '@shared/ui/Toast'
import { useDebounce } from '@shared/hooks/useDebounce'
import { jobDraftSchema, jobPublishSchema } from '@shared/validation/job'
import { useAuth } from '../auth/AuthProvider'
import { createListItem } from '../settings/api'
import { createJob, deleteJob, fetchEntities, fetchHrMeta, fetchJob, jobAction, updateJob } from './api'

const emptyForm = {
  title: '',
  entity: '',
  department_id: '',
  team_id: '',
  level: '',
  location: '',
  summary: '',
  qualification: '',
  experience: '',
  why_join_us: '',
  last_date_to_apply: '',
  skills: [],
}

/**
 * Create or edit a role in a large modal over the jobs list (routes /jobs/new and /jobs/:publicId/edit).
 * Drafts save themselves as you type; Publish and Done stay pinned at the bottom, other actions sit under "More".
 */
export function JobFormModal() {
  const { publicId: routeId } = useParams()
  const navigate = useNavigate()
  const { search } = useLocation()
  // Once a new role's first draft is saved, keep editing it here without changing the address,
  // so the modal does not close and reopen.
  const [createdId, setCreatedId] = useState(null)
  const publicId = routeId ?? createdId
  const isNew = !publicId
  const [open, setOpen] = useState(true)
  const toast = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const canManageLists = user?.permissions?.includes('settings.lists') ?? false

  /** Creates a skill from the Skills box and returns its slug, so it's chosen straight away. */
  async function addSkill(name) {
    try {
      const created = (await createListItem('skills', { name })).data
      await queryClient.invalidateQueries({ queryKey: ['hr-meta'] })
      toast.push({ tone: 'success', message: `Added "${created.name}" to the skills list.` })
      return created.slug
    } catch (error) {
      toast.push({ tone: 'error', message: error.errors?.name?.[0] ?? error.message })
      return null
    }
  }
  const canManage = user?.permissions?.includes('jobs.manage')
  const canPublish = user?.permissions?.includes('jobs.publish')
  const [confirm, setConfirm] = useState(null)
  const [extendOpen, setExtendOpen] = useState(false)
  const [extendDate, setExtendDate] = useState('')
  const [saveState, setSaveState] = useState('Saved drafts appear here')
  const lastSaved = useRef(JSON.stringify(emptyForm))
  const hydrated = useRef(null)
  const savedId = useRef(publicId ?? null)
  const latest = useRef('')
  const lock = useRef(false)

  const meta = useQuery({ queryKey: ['hr-meta'], queryFn: fetchHrMeta, staleTime: 600_000 })
  const entities = useQuery({ queryKey: ['public-entities'], queryFn: fetchEntities, staleTime: 600_000 })
  const jobQuery = useQuery({
    queryKey: ['hr-job', publicId],
    queryFn: () => fetchJob(publicId),
    enabled: !isNew,
  })
  const form = useForm({ resolver: zodResolver(jobDraftSchema), defaultValues: emptyForm })
  const values = useWatch({ control: form.control, defaultValue: emptyForm })
  const snapshot = JSON.stringify(values)
  const debounced = useDebounce(snapshot, 800)

  useEffect(() => {
    if (!jobQuery.data || hydrated.current === jobQuery.data.public_id) return
    const next = jobToForm(jobQuery.data)
    form.reset(next)
    lastSaved.current = JSON.stringify(next)
    hydrated.current = jobQuery.data.public_id
    savedId.current = jobQuery.data.public_id
    setExtendDate(next.last_date_to_apply)
  }, [jobQuery.data, form])

  useEffect(() => {
    latest.current = debounced
    if (!canManage || lock.current) return undefined
    lock.current = true
    let active = true

    async function saveLoop() {
      try {
        while (active && latest.current !== lastSaved.current) {
          const current = latest.current
          const parsed = jobDraftSchema.safeParse(JSON.parse(current))
          if (!parsed.success) break
          const payload = toPayload(parsed.data)
          setSaveState('Saving draft…')
          if (!savedId.current) {
            const created = await createJob(payload)
            savedId.current = created.public_id
            lastSaved.current = current
            if (!active) return
            setSaveState('Draft saved')
            // The form already holds what was saved; don't reload it from the server mid-typing.
            hydrated.current = created.public_id
            setCreatedId(created.public_id)
            queryClient.setQueryData(['hr-job', created.public_id], created)
            queryClient.invalidateQueries({ queryKey: ['hr-jobs'] })
            toast.push({ tone: 'success', message: 'Draft saved' })
            continue
          }
          await updateJob(savedId.current, payload)
          lastSaved.current = current
          if (active) {
            setSaveState('Draft saved')
            toast.push({ tone: 'success', message: 'Draft saved' })
          }
        }
      } catch (error) {
        if (active) {
          setSaveState('Draft could not be saved')
          toast.push({ tone: 'error', message: error.message })
        }
      } finally {
        lock.current = false
      }
    }

    saveLoop()
    return () => {
      active = false
    }
  }, [canManage, debounced, queryClient, toast])

  const action = useMutation({
    mutationFn: ({ name, payload }) => jobAction(publicId, name, payload),
    onSuccess: (job, variables) => {
      toast.push({ tone: 'success', message: actionMessage(variables.name) })
      if (variables.name === 'duplicate') {
        navigate(`/jobs/${job.public_id}/edit${search}`)
        return
      }
      queryClient.setQueryData(['hr-job', publicId], job)
      queryClient.invalidateQueries({ queryKey: ['hr-jobs'] })
      setExtendOpen(false)
      setConfirm(null)
    },
    onError: (error) => {
      applyServerErrors(error, form)
      toast.push({ tone: 'error', message: error.message })
    },
  })

  function close() {
    setOpen(false)
    queryClient.invalidateQueries({ queryKey: ['hr-jobs'] })
    // Let the closing animation finish before leaving the route.
    setTimeout(() => navigate(`/jobs${search}`), 200)
  }

  const job = jobQuery.data
  const teams = (meta.data?.teams ?? []).filter((team) => !values.department_id || String(team.department_id) === values.department_id)
  const errors = form.formState.errors

  async function publish() {
    const parsed = jobPublishSchema.safeParse(form.getValues())
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => form.setError(String(issue.path[0] || 'title'), { message: issue.message }))
      toast.push({ tone: 'error', message: 'Complete the role before publishing.' })
      return
    }
    try {
      const payload = toPayload(parsed.data)
      let id = savedId.current
      if (!id) {
        const created = await createJob(payload)
        id = created.public_id
        savedId.current = id
      } else {
        await updateJob(id, payload)
      }
      const published = await jobAction(id, 'publish')
      lastSaved.current = JSON.stringify(form.getValues())
      queryClient.setQueryData(['hr-job', id], published)
      queryClient.invalidateQueries({ queryKey: ['hr-jobs'] })
      toast.push({ tone: 'success', message: 'Role published' })
      if (!routeId) {
        hydrated.current = id
        setCreatedId(id)
      }
    } catch (error) {
      applyServerErrors(error, form)
      toast.push({ tone: 'error', message: error.message })
    }
  }

  function preview() {
    if (!job?.preview_url) return
    const careers = import.meta.env.VITE_CAREERS_URL || 'http://localhost:5173'
    window.open(`${careers}${job.path}?preview=${encodeURIComponent(job.preview_url)}`, '_blank', 'noopener')
  }

  const more = [
    canPublish && job?.status === 'published' && { label: 'Unpublish', icon: EyeSlashIcon, run: () => setConfirm('unpublish') },
    canPublish && job && job.status !== 'closed' && { label: 'Close role', icon: LockClosedIcon, run: () => setConfirm('close') },
    canPublish && job && { label: 'Extend last date', icon: CalendarDaysIcon, run: () => setExtendOpen(true) },
    canManage && job && { label: 'Duplicate', icon: DocumentDuplicateIcon, run: () => action.mutate({ name: 'duplicate' }) },
    job && { label: 'Preview as candidate', icon: EyeIcon, run: preview },
    canManage && job?.status === 'draft' && { label: 'Delete draft', icon: TrashIcon, run: () => setConfirm('delete'), danger: true },
  ].filter(Boolean)

  const loading = !isNew && jobQuery.isLoading
  const failed = !isNew && jobQuery.isError

  return (
    <Modal
      open={open}
      onClose={close}
      size="xl"
      icon={BriefcaseIcon}
      title={isNew ? 'New role' : job?.title || 'Edit role'}
      description={
        <span className="inline-flex flex-wrap items-center gap-2">
          {job ? <StatusBadge status={job.status} /> : null}
          <span className="inline-flex items-center gap-1" aria-live="polite">
            {saveState === 'Saving draft…' ? <ArrowPathRoundedSquareIcon className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : saveState === 'Draft saved' ? <CheckCircleIcon className="h-4 w-4 text-success" aria-hidden="true" /> : null}
            {saveState}
          </span>
          {job?.role_key ? <span className="text-xs">Role key {job.role_key}</span> : null}
        </span>
      }
      footer={
        loading || failed ? null : (
          <>
            {more.length ? (
              <Menu as="div" className="relative sm:mr-auto">
                <MenuButton className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-white px-5 text-sm font-medium text-ink transition duration-200 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:w-auto">
                  More actions
                  <ChevronUpIcon className="h-4 w-4" aria-hidden="true" />
                </MenuButton>
                <MenuItems anchor="top start" transition className="z-[60] w-60 rounded-2xl border border-border bg-white p-1.5 shadow-lift transition duration-150 [--anchor-gap:8px] focus:outline-none data-[closed]:translate-y-1 data-[closed]:opacity-0">
                  {more.map((item) => (
                    <MenuItem key={item.label} as={Fragment}>
                      <button type="button" onClick={item.run} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm data-[focus]:bg-brand-50 ${item.danger ? 'text-danger' : 'text-ink'}`}>
                        <item.icon className="h-5 w-5 opacity-70" aria-hidden="true" />
                        {item.label}
                      </button>
                    </MenuItem>
                  ))}
                </MenuItems>
              </Menu>
            ) : null}
            <Button variant="secondary" onClick={close}>Done</Button>
            {canPublish ? <Button onClick={publish} loading={action.isPending}>{job?.status === 'published' ? 'Save and keep published' : 'Publish'}</Button> : null}
          </>
        )
      }
    >
      {loading ? <Skeleton className="h-96" /> : null}
      {failed ? <ErrorState title="This role could not be loaded" onRetry={() => jobQuery.refetch()} /> : null}
      {loading || failed ? null : (
        <form id="job-form" className="flex flex-col gap-8" onSubmit={(event) => event.preventDefault()}>
          <FormSection number="1" title="Basics" hint="Where the role sits and who it is for.">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <FormField id="title" label="Title" required error={errors.title?.message}>
                  <Input id="title" placeholder="For example: Junior Data Annotator" {...form.register('title')} invalid={Boolean(errors.title)} />
                </FormField>
              </div>
              <FormField id="entity" label="Entity" required error={errors.entity?.message}>
                <Select id="entity" value={values.entity} onChange={(entity) => form.setValue('entity', entity, { shouldDirty: true })} options={[{ value: '', label: 'Choose an entity' }, ...(entities.data ?? []).map((entity) => ({ value: entity.slug, label: entity.name }))]} />
              </FormField>
              <FormField id="level" label="Level" required error={errors.level?.message}>
                <Select id="level" value={values.level} onChange={(level) => form.setValue('level', level, { shouldDirty: true })} options={[{ value: '', label: 'Choose a level' }, ...(meta.data?.enums?.job_levels ?? []).map((level) => ({ value: level.value, label: level.label }))]} />
              </FormField>
              <FormField id="department_id" label="Department">
                <Select id="department_id" value={values.department_id} onChange={(department_id) => { form.setValue('department_id', department_id, { shouldDirty: true }); form.setValue('team_id', '') }} options={[{ value: '', label: 'No department' }, ...(meta.data?.departments ?? []).map((department) => ({ value: String(department.id), label: department.name }))]} />
              </FormField>
              <FormField id="team_id" label="Team">
                <Select id="team_id" value={values.team_id} onChange={(team_id) => form.setValue('team_id', team_id, { shouldDirty: true })} options={[{ value: '', label: 'No team' }, ...teams.map((team) => ({ value: String(team.id), label: team.name }))]} />
              </FormField>
              <FormField id="location" label="Location" required error={errors.location?.message}>
                <Input id="location" placeholder="City, state" {...form.register('location')} invalid={Boolean(errors.location)} />
              </FormField>
              <FormField id="last_date_to_apply" label="Last date to apply" required error={errors.last_date_to_apply?.message}>
                <DateInput id="last_date_to_apply" min={todayIso()} value={values.last_date_to_apply} onChange={(value) => form.setValue('last_date_to_apply', value, { shouldDirty: true })} invalid={Boolean(errors.last_date_to_apply)} />
              </FormField>
            </div>
          </FormSection>

          <FormSection number="2" title="Description" hint="What candidates read on the job page.">
            <div className="flex flex-col gap-4">
              <FormField id="summary" label="Summary" required error={errors.summary?.message}>
                <Textarea id="summary" rows={4} {...form.register('summary')} invalid={Boolean(errors.summary)} />
              </FormField>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField id="qualification" label="Qualification" required error={errors.qualification?.message}>
                  <Textarea id="qualification" rows={3} {...form.register('qualification')} invalid={Boolean(errors.qualification)} />
                </FormField>
                <FormField id="why_join_us" label="Why join us">
                  <Textarea id="why_join_us" rows={3} {...form.register('why_join_us')} />
                </FormField>
              </div>
              <FormField id="experience" label="Experience" required error={errors.experience?.message}>
                <Input id="experience" placeholder="For example: 0–2 years" {...form.register('experience')} invalid={Boolean(errors.experience)} />
              </FormField>
            </div>
          </FormSection>

          <FormSection number="3" title="Skills" hint="Type to search; press Enter to add.">
            <FormField id="skills" label="Skills" error={errors.skills?.message}>
              <MultiSelect
                id="skills"
                noun="skill"
                placeholder="Type a skill, then press Enter"
                value={values.skills}
                onChange={(skills) => form.setValue('skills', skills, { shouldDirty: true, shouldValidate: form.formState.isSubmitted })}
                options={(meta.data?.skills ?? []).map((skill) => ({ value: skill.slug, label: skill.name }))}
                invalid={Boolean(errors.skills)}
                onCreate={canManageLists ? addSkill : undefined}
                createHint={canManageLists ? null : 'Ask an Admin to add it in Settings → Lists.'}
              />
            </FormField>
          </FormSection>
        </form>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={confirm === 'delete' ? 'Delete this draft?' : confirm === 'close' ? 'Close this role?' : 'Unpublish this role?'}
        message={confirm === 'delete' ? 'Drafts with applications cannot be deleted.' : 'Candidates will no longer see this role as open.'}
        confirmLabel={confirm === 'delete' ? 'Delete' : confirm === 'close' ? 'Close role' : 'Unpublish'}
        loading={action.isPending}
        onConfirm={async () => {
          if (confirm === 'delete') {
            try {
              await deleteJob(publicId)
              toast.push({ tone: 'success', message: 'Draft deleted' })
              setConfirm(null)
              close()
            } catch (error) {
              toast.push({ tone: 'error', message: error.message })
            }
            return
          }
          action.mutate({ name: confirm })
        }}
      />
      <Modal
        open={extendOpen}
        onClose={() => setExtendOpen(false)}
        size="sm"
        icon={CalendarDaysIcon}
        title="Extend the last date"
        footer={
          <>
            <Button variant="secondary" onClick={() => setExtendOpen(false)}>Cancel</Button>
            <Button loading={action.isPending} onClick={() => action.mutate({ name: 'extend', payload: { last_date_to_apply: extendDate } })}>Save date</Button>
          </>
        }
      >
        <FormField id="extend-date" label="New last date">
          <DateInput id="extend-date" min={todayIso()} value={extendDate} onChange={setExtendDate} />
        </FormField>
      </Modal>
    </Modal>
  )
}

/** A numbered block inside a long form, so people can see how far through they are. */
function FormSection({ number, title, hint, children }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
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

FormSection.propTypes = {
  number: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  hint: PropTypes.string,
  children: PropTypes.node,
}

function jobToForm(job) {
  return {
    title: job.title ?? '',
    entity: job.entity?.slug ?? '',
    department_id: job.department?.id ? String(job.department.id) : '',
    team_id: job.team?.id ? String(job.team.id) : '',
    level: job.level?.value ?? '',
    location: job.location ?? '',
    summary: job.summary ?? '',
    qualification: job.qualification ?? '',
    experience: job.experience ?? '',
    why_join_us: job.why_join_us ?? '',
    last_date_to_apply: job.last_date_to_apply ?? '',
    skills: (job.skills ?? []).map((skill) => skill.slug),
  }
}

function toPayload(values) {
  return {
    ...values,
    department_id: values.department_id ? Number(values.department_id) : null,
    team_id: values.team_id ? Number(values.team_id) : null,
    why_join_us: values.why_join_us || null,
  }
}

function applyServerErrors(error, form) {
  Object.entries(error.errors ?? {}).forEach(([key, messages]) => {
    const field = key.startsWith('skills') ? 'skills' : key
    form.setError(field, { message: messages[0] })
  })
}

function actionMessage(name) {
  if (name === 'publish') return 'Role published'
  if (name === 'unpublish') return 'Role unpublished'
  if (name === 'close') return 'Role closed'
  if (name === 'extend') return 'Last date extended'
  if (name === 'duplicate') return 'Role duplicated'
  return 'Role updated'
}
