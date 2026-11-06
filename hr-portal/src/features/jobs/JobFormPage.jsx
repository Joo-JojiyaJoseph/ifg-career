import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@shared/ui/Button'
import { Card, PageHeader } from '@shared/ui/Card'
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

export function JobFormPage() {
  const { publicId } = useParams()
  const isNew = !publicId
  const navigate = useNavigate()
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
            toast.push({ tone: 'success', message: 'Draft saved' })
            navigate(`/jobs/${created.public_id}/edit`, { replace: true })
            return
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
  }, [canManage, debounced, navigate, toast])

  const action = useMutation({
    mutationFn: ({ name, payload }) => jobAction(publicId, name, payload),
    onSuccess: (job, variables) => {
      toast.push({ tone: 'success', message: actionMessage(variables.name) })
      if (variables.name === 'duplicate') {
        navigate(`/jobs/${job.public_id}/edit`)
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

  if (!isNew && jobQuery.isLoading) return <Skeleton className="h-80" />
  if (!isNew && jobQuery.isError) return <ErrorState title="This role could not be loaded" onRetry={() => jobQuery.refetch()} />

  const job = jobQuery.data
  const teams = (meta.data?.teams ?? []).filter((team) => !values.department_id || String(team.department_id) === values.department_id)

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
      if (isNew) navigate(`/jobs/${id}/edit`, { replace: true })
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

  return (
    <form className="flex flex-col gap-5" onSubmit={(event) => event.preventDefault()}>
      <PageHeader
        title={isNew ? 'New role' : job?.title || 'Edit role'}
        subtitle={saveState}
        actions={
          <div className="flex flex-wrap gap-2">
            {job ? <StatusBadge status={job.status} /> : null}
            <Link to="/jobs" className="inline-flex min-h-11 items-center rounded-full px-4 text-sm text-brand-700">Back to jobs</Link>
          </div>
        }
      />
      <Card>
        <h2 className="font-display text-xl text-navy">Basics</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FormField id="title" label="Title" required error={form.formState.errors.title?.message}>
            <Input id="title" {...form.register('title')} invalid={Boolean(form.formState.errors.title)} />
          </FormField>
          <FormField id="entity" label="Entity" required error={form.formState.errors.entity?.message}>
            <Select id="entity" value={values.entity} onChange={(entity) => form.setValue('entity', entity, { shouldDirty: true })} options={[{ value: '', label: 'Choose an entity' }, ...(entities.data ?? []).map((entity) => ({ value: entity.slug, label: entity.name }))]} />
          </FormField>
          <FormField id="department_id" label="Department">
            <Select id="department_id" value={values.department_id} onChange={(department_id) => { form.setValue('department_id', department_id, { shouldDirty: true }); form.setValue('team_id', '') }} options={[{ value: '', label: 'No department' }, ...(meta.data?.departments ?? []).map((department) => ({ value: String(department.id), label: department.name }))]} />
          </FormField>
          <FormField id="team_id" label="Team">
            <Select id="team_id" value={values.team_id} onChange={(team_id) => form.setValue('team_id', team_id, { shouldDirty: true })} options={[{ value: '', label: 'No team' }, ...teams.map((team) => ({ value: String(team.id), label: team.name }))]} />
          </FormField>
          <FormField id="level" label="Level" required error={form.formState.errors.level?.message}>
            <Select id="level" value={values.level} onChange={(level) => form.setValue('level', level, { shouldDirty: true })} options={[{ value: '', label: 'Choose a level' }, ...(meta.data?.enums?.job_levels ?? []).map((level) => ({ value: level.value, label: level.label }))]} />
          </FormField>
          <FormField id="location" label="Location" required error={form.formState.errors.location?.message}>
            <Input id="location" {...form.register('location')} invalid={Boolean(form.formState.errors.location)} />
          </FormField>
        </div>
      </Card>
      <Card>
        <h2 className="font-display text-xl text-navy">Description</h2>
        <div className="mt-4 flex flex-col gap-4">
          <FormField id="summary" label="Summary" required error={form.formState.errors.summary?.message}>
            <Textarea id="summary" {...form.register('summary')} invalid={Boolean(form.formState.errors.summary)} />
          </FormField>
          <FormField id="qualification" label="Qualification" required error={form.formState.errors.qualification?.message}>
            <Textarea id="qualification" {...form.register('qualification')} invalid={Boolean(form.formState.errors.qualification)} />
          </FormField>
          <FormField id="experience" label="Experience" required error={form.formState.errors.experience?.message}>
            <Input id="experience" {...form.register('experience')} invalid={Boolean(form.formState.errors.experience)} />
          </FormField>
          <FormField id="why_join_us" label="Why join us">
            <Textarea id="why_join_us" {...form.register('why_join_us')} />
          </FormField>
        </div>
      </Card>
      <Card>
        <h2 className="font-display text-xl text-navy">Skills</h2>
        <div className="mt-4">
          <FormField id="skills" label="Skills" error={form.formState.errors.skills?.message}>
            <MultiSelect
              id="skills"
              noun="skill"
              placeholder="Type a skill, then press Enter"
              value={values.skills}
              onChange={(skills) => form.setValue('skills', skills, { shouldDirty: true, shouldValidate: form.formState.isSubmitted })}
              options={(meta.data?.skills ?? []).map((skill) => ({ value: skill.slug, label: skill.name }))}
              invalid={Boolean(form.formState.errors.skills)}
              onCreate={canManageLists ? addSkill : undefined}
              createHint={canManageLists ? null : 'Ask an Admin to add it in Settings → Lists.'}
            />
          </FormField>
        </div>
      </Card>
      <Card>
        <h2 className="font-display text-xl text-navy">Dates & status</h2>
        <div className="mt-4 max-w-sm">
          <FormField id="last_date_to_apply" label="Last date to apply" required error={form.formState.errors.last_date_to_apply?.message}>
            <DateInput id="last_date_to_apply" min={todayIso()} value={values.last_date_to_apply} onChange={(value) => form.setValue('last_date_to_apply', value, { shouldDirty: true })} invalid={Boolean(form.formState.errors.last_date_to_apply)} />
          </FormField>
        </div>
        {job?.role_key ? <p className="mt-4 text-sm text-muted">Role key: {job.role_key}</p> : null}
      </Card>
      <div className="flex flex-wrap gap-2">
        {canPublish ? <Button onClick={publish} loading={action.isPending}>Publish</Button> : null}
        {canPublish && job?.status === 'published' ? <Button variant="secondary" onClick={() => setConfirm('unpublish')}>Unpublish</Button> : null}
        {canPublish && job && job.status !== 'closed' ? <Button variant="secondary" onClick={() => setConfirm('close')}>Close</Button> : null}
        {canPublish && job ? <Button variant="secondary" onClick={() => setExtendOpen(true)}>Extend last date</Button> : null}
        {canManage && job ? <Button variant="secondary" onClick={() => action.mutate({ name: 'duplicate' })}>Duplicate</Button> : null}
        {job ? <Button variant="secondary" onClick={preview}>Preview as candidate</Button> : null}
        {canManage && job?.status === 'draft' ? <Button variant="danger" onClick={() => setConfirm('delete')}>Delete draft</Button> : null}
      </div>
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
              navigate('/jobs')
            } catch (error) {
              toast.push({ tone: 'error', message: error.message })
            }
            return
          }
          action.mutate({ name: confirm })
        }}
      />
      <Modal open={extendOpen} onClose={() => setExtendOpen(false)} title="Extend the last date">
        <FormField id="extend-date" label="New last date">
          <DateInput id="extend-date" min={todayIso()} value={extendDate} onChange={setExtendDate} />
        </FormField>
        <div className="mt-4">
          <Button loading={action.isPending} onClick={() => action.mutate({ name: 'extend', payload: { last_date_to_apply: extendDate } })}>Save date</Button>
        </div>
      </Modal>
    </form>
  )
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
