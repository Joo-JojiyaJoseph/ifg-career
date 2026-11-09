import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  AcademicCapIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  BanknotesIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  CakeIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  IdentificationIcon,
  InboxStackIcon,
  LockOpenIcon,
  MapPinIcon,
  NoSymbolIcon,
  PhoneIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar } from '@shared/ui/Avatar'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { Card } from '@shared/ui/Card'
import { ConfirmDialog } from '@shared/ui/ConfirmDialog'
import { ErrorState } from '@shared/ui/ErrorState'
import { FormField } from '@shared/ui/FormField'
import { Textarea } from '@shared/ui/Input'
import { Modal } from '@shared/ui/Modal'
import { ProgressBar } from '@shared/ui/ProgressBar'
import { Select } from '@shared/ui/Select'
import { EmptyState, Skeleton } from '@shared/ui/Skeleton'
import { Tabs } from '@shared/ui/Tabs'
import { Timeline } from '@shared/ui/Timeline'
import { useToast } from '@shared/ui/Toast'
import { formatDate } from '@shared/lib/formatDate'
import { useAuth } from '../auth/AuthProvider'
import { CandidateApplications } from './CandidateApplications'
import {
  addNote,
  blacklistCandidate,
  fetchActivity,
  fetchCandidate,
  fetchHrMeta,
  fetchResume,
  overrideBlock,
  removeBlacklist,
  updateColour,
} from './api'

const tabs = [
  { id: 'applications', label: 'Applications' },
  { id: 'interviews', label: 'Interviews' },
  { id: 'notes', label: 'Notes' },
  { id: 'blocks', label: 'Blocks & blacklist' },
  { id: 'activity', label: 'Activity' },
]

export function CandidatePage() {
  const { publicId } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('applications')
  const [reason, setReason] = useState('')
  const [pending, setPending] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [note, setNote] = useState('')

  const candidate = useQuery({ queryKey: ['hr-candidate', publicId], queryFn: () => fetchCandidate(publicId) })
  const meta = useQuery({ queryKey: ['hr-meta'], queryFn: fetchHrMeta, staleTime: 600_000 })
  const resume = useQuery({
    queryKey: ['hr-candidate-resume', publicId],
    queryFn: () => fetchResume(publicId),
    enabled: Boolean(candidate.data?.has_resume) && user?.permissions?.includes('candidates.resume'),
    staleTime: 4 * 60 * 1000,
  })
  const activity = useQuery({
    queryKey: ['hr-candidate-activity', publicId],
    queryFn: () => fetchActivity(publicId),
    enabled: tab === 'activity',
  })

  const canUpdate = user?.permissions?.includes('candidates.update')
  const canNotes = user?.permissions?.includes('candidates.notes')
  const canBlacklist = user?.permissions?.includes('candidates.blacklist')
  const canOverride = user?.permissions?.includes('blocks.override')
  const canResume = user?.permissions?.includes('candidates.resume')
  const profile = candidate.data

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['hr-candidate', publicId] })
    queryClient.invalidateQueries({ queryKey: ['hr-candidate-activity', publicId] })
  }

  const colourMutation = useMutation({
    mutationFn: (colour) => updateColour(publicId, colour),
    onSuccess: () => {
      toast.push({ tone: 'success', message: 'Colour tag updated' })
      refresh()
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })
  const noteMutation = useMutation({
    mutationFn: () => addNote(publicId, note),
    onSuccess: () => {
      toast.push({ tone: 'success', message: 'Note added' })
      setNote('')
      refresh()
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })
  const blacklistMutation = useMutation({
    mutationFn: () => (pending?.kind === 'remove' ? removeBlacklist(publicId, reason) : blacklistCandidate(publicId, reason)),
    onSuccess: () => {
      toast.push({ tone: 'success', message: pending?.kind === 'remove' ? 'Blacklist removed' : 'Candidate blacklisted' })
      setConfirmOpen(false)
      setPending(null)
      setReason('')
      refresh()
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })
  const overrideMutation = useMutation({
    mutationFn: () => overrideBlock(publicId, pending.roleKey, reason),
    onSuccess: () => {
      toast.push({ tone: 'success', message: 'Role block overridden' })
      setConfirmOpen(false)
      setPending(null)
      setReason('')
      refresh()
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })

  if (candidate.isLoading) return <Skeleton className="h-64" />
  if (candidate.isError) return <ErrorState onRetry={() => candidate.refetch()} />
  if (!profile) return null

  const rounds = (profile.applications ?? []).flatMap((application) => (application.rounds ?? []).map((round) => ({
    ...round,
    role: application.role,
    key: `${application.public_id}-${round.round_number}`,
  })))

  function ask(next) {
    setPending(next)
    setReason('')
  }

  function review() {
    if (reason.trim().length < 3) {
      toast.push({ tone: 'error', message: 'Add a reason before continuing.' })
      return
    }
    setConfirmOpen(true)
  }

  const applications = profile.applications ?? []
  const notes = profile.notes ?? []
  const blocks = profile.role_blocks ?? []
  const tabItems = tabs.map((item) => ({
    ...item,
    count: item.id === 'applications' ? applications.length : item.id === 'interviews' ? rounds.length : item.id === 'notes' ? notes.length : item.id === 'blocks' ? blocks.filter((block) => block.active).length : undefined,
  }))
  const stats = [
    { label: 'Applications', value: applications.length, icon: InboxStackIcon },
    { label: 'Interview rounds', value: rounds.length, icon: CalendarDaysIcon },
    { label: 'Experience', value: profile.years_experience == null ? '—' : `${profile.years_experience} yrs`, icon: BriefcaseIcon },
    { label: 'Expected CTC', value: profile.expected_ctc == null ? '—' : formatMoney(profile.expected_ctc), icon: BanknotesIcon },
  ]

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted">
        <Link to="/candidates" className="inline-flex min-h-11 items-center gap-1 rounded-full pr-2 font-medium text-brand-700 hover:text-brand-900">
          <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
          Candidates
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-ink" aria-current="page">{profile.name}</span>
      </nav>

      {/* Profile header */}
      <section className="glass relative overflow-hidden rounded-[1.75rem] shadow-card">
        <div className="h-24 bg-gradient-to-r from-brand-700 via-brand-500 to-cyan sm:h-28" aria-hidden="true">
          <div className="h-full w-full bg-dots-light bg-dots opacity-40" />
        </div>
        <div className="flex flex-col gap-5 px-5 pb-5 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
            <span className="-mt-12 self-start rounded-full bg-white p-1.5 shadow-lift">
              <Avatar name={profile.name} src={profile.avatar_url} size="xl" />
            </span>
            <div className="min-w-0 sm:pt-4">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{profile.name}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5"><EnvelopeIcon className="h-4 w-4" aria-hidden="true" />{profile.email}</span>
                {profile.location ? <span className="inline-flex items-center gap-1.5"><MapPinIcon className="h-4 w-4" aria-hidden="true" />{profile.location}</span> : null}
                {profile.reference_id ? <span className="inline-flex items-center gap-1.5"><IdentificationIcon className="h-4 w-4" aria-hidden="true" />{profile.reference_id}</span> : null}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.colour_tag ? <Badge color={profile.colour_tag.color}>{profile.colour_tag.label}</Badge> : null}
                {profile.signup_source ? <Badge color={profile.signup_source.color}>{profile.signup_source.label}</Badge> : null}
                {profile.is_blacklisted ? <Badge color="red-soft">Blacklisted until {formatDate(profile.blacklist_until)}</Badge> : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`mailto:${profile.email}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-medium text-ink transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50">
              <EnvelopeIcon className="h-5 w-5 text-brand-600" aria-hidden="true" />Email
            </a>
            {profile.phone ? (
              <a href={`tel:${profile.phone}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-medium text-ink transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50">
                <PhoneIcon className="h-5 w-5 text-brand-600" aria-hidden="true" />Call
              </a>
            ) : null}
            {canResume && resume.data?.download_url ? (
              <a href={resume.data.download_url} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-r from-brand-700 to-brand-500 px-4 text-sm font-medium text-white shadow-md shadow-brand-500/30 transition duration-200 hover:-translate-y-0.5">
                <ArrowDownTrayIcon className="h-5 w-5" aria-hidden="true" />Resume
              </a>
            ) : null}
            {canBlacklist && !profile.is_blacklisted ? <Button variant="danger" icon={NoSymbolIcon} onClick={() => ask({ kind: 'blacklist' })}>Blacklist</Button> : null}
            {canBlacklist && profile.is_blacklisted ? <Button variant="secondary" onClick={() => ask({ kind: 'remove' })}>Remove blacklist</Button> : null}
          </div>
        </div>
      </section>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="glass flex items-center gap-3 rounded-2xl p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700" aria-hidden="true"><item.icon className="h-5 w-5" /></span>
            <div className="min-w-0">
              <dt className="text-xs text-muted">{item.label}</dt>
              <dd className="truncate font-display text-xl font-semibold text-ink">{item.value}</dd>
            </div>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <Tabs items={tabItems} value={tab} onChange={setTab} label="Candidate sections" />
          <Card className="min-h-[16rem]">
            {tab === 'applications' ? <CandidateApplications applications={applications} candidate={profile} canUpdate={Boolean(user?.permissions?.includes('applications.update'))} canSchedule={Boolean(user?.permissions?.includes('interviews.manage'))} /> : null}
            {tab === 'interviews' ? <Interviews rounds={rounds} /> : null}
            {tab === 'notes' ? (
              <div className="flex flex-col gap-5">
                {canNotes ? (
                  <form onSubmit={(event) => { event.preventDefault(); noteMutation.mutate() }} className="flex flex-col gap-3 rounded-2xl bg-brand-50/60 p-4">
                    <FormField id="candidate-note" label="Add a note">
                      <Textarea id="candidate-note" rows={3} placeholder="Only HR can see notes." value={note} onChange={(event) => setNote(event.target.value)} />
                    </FormField>
                    <Button type="submit" className="self-end" loading={noteMutation.isPending} disabled={note.trim().length < 2}>Save note</Button>
                  </form>
                ) : null}
                {notes.length === 0 ? <EmptyState title="No notes yet" /> : (
                  <Timeline items={notes.map((item, index) => ({
                    key: `${item.created_at}-${index}`,
                    title: item.author || 'HR',
                    meta: formatDate(item.created_at),
                    body: item.body,
                  }))} />
                )}
              </div>
            ) : null}
            {tab === 'blocks' ? (
              <div className="flex flex-col gap-4">
                <p className={`rounded-2xl p-4 text-sm ${profile.is_blacklisted ? 'bg-red-50 text-danger' : 'bg-brand-50/60 text-muted'}`}>
                  {profile.is_blacklisted
                    ? `Blacklisted${profile.blacklist_reason ? `: ${profile.blacklist_reason}` : ''}${profile.blacklisted_by ? ` by ${profile.blacklisted_by}` : ''}.`
                    : 'This candidate is not blacklisted.'}
                </p>
                {blocks.length === 0 ? <EmptyState title="No role blocks" description="A block is added when a shortlisted candidate is not selected for a role." /> : (
                  <ul className="flex flex-col gap-3">
                    {blocks.map((block) => (
                      <li key={`${block.role_key}-${block.blocked_until}`} className="flex flex-col gap-2 rounded-2xl border border-border p-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-medium text-ink">{block.role_key}</p>
                          <p className="text-sm text-muted">Until {formatDate(block.blocked_until)} · {block.active ? 'Active' : 'Lifted'}</p>
                          <p className="mt-1 text-sm">{block.reason}</p>
                          {block.override_reason ? <p className="mt-1 text-sm text-muted">Override: {block.override_reason}</p> : null}
                        </div>
                        {canOverride && block.active ? (
                          <Button size="sm" variant="secondary" onClick={() => ask({ kind: 'override', roleKey: block.role_key })}>Override block</Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
            {tab === 'activity' ? (
              activity.isLoading ? <Skeleton className="h-32" /> : activity.isError ? <ErrorState onRetry={() => activity.refetch()} /> : (activity.data ?? []).length === 0 ? <EmptyState title="No activity yet" /> : (
                <Timeline items={(activity.data ?? []).map((item, index) => ({
                  key: `${item.created_at}-${index}`,
                  title: item.label,
                  meta: [item.actor, formatDate(item.created_at)].filter(Boolean).join(' · '),
                  body: item.summary || undefined,
                }))} />
              )
            ) : null}
          </Card>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24" aria-label="Candidate details">
          <Card>
            <h2 className="font-display text-lg font-semibold text-ink">Details</h2>
            <dl className="mt-3 divide-y divide-border/70">
              <Field icon={PhoneIcon} label="Phone" value={profile.phone} />
              <Field icon={CakeIcon} label="Date of birth" value={profile.date_of_birth ? `${formatDate(profile.date_of_birth)} (${profile.age})` : null} />
              <Field icon={UserIcon} label="Gender" value={profile.gender?.label} />
              <Field icon={AcademicCapIcon} label="Qualification" value={profile.highest_qualification} />
              <Field icon={BuildingOffice2Icon} label="Department" value={profile.preferred_department?.name} />
              <Field icon={BanknotesIcon} label="Current CTC" value={profile.current_ctc == null ? null : formatMoney(profile.current_ctc)} />
            </dl>
            {profile.linkedin_url || profile.portfolio_url ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.linkedin_url ? <a className="inline-flex min-h-11 items-center gap-1 rounded-full bg-brand-50 px-4 text-sm font-medium text-brand-700" href={profile.linkedin_url} target="_blank" rel="noreferrer">LinkedIn<ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" /></a> : null}
                {profile.portfolio_url ? <a className="inline-flex min-h-11 items-center gap-1 rounded-full bg-brand-50 px-4 text-sm font-medium text-brand-700" href={profile.portfolio_url} target="_blank" rel="noreferrer">Portfolio<ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" /></a> : null}
              </div>
            ) : null}
            <div className="mt-4">
              <ProgressBar value={profile.profile_completion_percent} label="Profile completeness" />
            </div>
            {canUpdate ? (
              <div className="mt-4">
                <FormField id="colour-tag" label="Colour tag">
                  <Select
                    id="colour-tag"
                    value={profile.colour_tag?.value ?? ''}
                    onChange={(value) => colourMutation.mutate(value)}
                    options={(meta.data?.enums?.colour_tags ?? []).map((item) => ({ value: item.value, label: item.label }))}
                  />
                </FormField>
              </div>
            ) : null}
          </Card>
          <Card>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink"><DocumentTextIcon className="h-5 w-5 text-brand-600" aria-hidden="true" />Resume</h2>
            {!profile.has_resume ? <p className="mt-3 text-sm text-muted">No resume has been uploaded.</p> : null}
            {profile.has_resume && !canResume ? <p className="mt-3 text-sm text-muted">You do not have permission to open resumes.</p> : null}
            {canResume && resume.isLoading ? <Skeleton className="mt-3 h-40" /> : null}
            {canResume && resume.data?.preview && resume.data.preview_url ? (
              <iframe title={`Resume for ${profile.name}`} src={resume.data.preview_url} className="mt-3 h-80 w-full rounded-xl border border-border" />
            ) : null}
            {canResume && resume.data?.download_url ? (
              <a className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand-700" href={resume.data.download_url}>
                <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                Download {resume.data.filename || 'resume'}
              </a>
            ) : null}
          </Card>
        </aside>
      </div>

      <Modal
        open={Boolean(pending) && !confirmOpen}
        onClose={() => setPending(null)}
        size="sm"
        icon={pending?.kind === 'override' ? LockOpenIcon : NoSymbolIcon}
        title={pending?.kind === 'override' ? 'Override role block' : pending?.kind === 'remove' ? 'Remove blacklist' : 'Blacklist candidate'}
        description="The reason is saved in the activity log."
        footer={
          <>
            <Button variant="secondary" onClick={() => setPending(null)}>Cancel</Button>
            <Button onClick={review}>Continue</Button>
          </>
        }
      >
        <FormField id="action-reason" label="Reason" required>
          <Textarea id="action-reason" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />
        </FormField>
      </Modal>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        loading={blacklistMutation.isPending || overrideMutation.isPending}
        title={pending?.kind === 'override' ? 'Override this block?' : pending?.kind === 'remove' ? 'Remove the blacklist?' : 'Blacklist this candidate?'}
        message={reason}
        confirmLabel="Confirm"
        onConfirm={() => (pending?.kind === 'override' ? overrideMutation.mutate() : blacklistMutation.mutate())}
      />
    </div>
  )
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value))
}

function Interviews({ rounds }) {
  if (rounds.length === 0) return <EmptyState title="No interviews yet" />
  return (
    <ul className="flex flex-col gap-3">
      {rounds.map((round) => (
        <li key={round.key} className="rounded-2xl border border-border p-4">
          <p className="font-medium text-ink">{round.round_name} · {round.role}</p>
          <p className="text-sm text-muted">{formatDate(round.scheduled_at)} · {round.mode} · {round.interviewer_name}</p>
          <div className="mt-2"><Badge color={round.status_color}>{round.status_label}</Badge></div>
        </li>
      ))}
    </ul>
  )
}

function Field({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Icon className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
      <dt className="w-28 shrink-0 text-sm text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{value || '—'}</dd>
    </div>
  )
}

Field.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
}
