import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, StatusBadge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { Card, PageHeader } from '@shared/ui/Card'
import { ConfirmDialog } from '@shared/ui/ConfirmDialog'
import { EntityBadge } from '@shared/ui/EntityBadge'
import { ErrorState } from '@shared/ui/ErrorState'
import { FormField } from '@shared/ui/FormField'
import { Textarea } from '@shared/ui/Input'
import { Modal } from '@shared/ui/Modal'
import { ProgressBar } from '@shared/ui/ProgressBar'
import { Select } from '@shared/ui/Select'
import { EmptyState, Skeleton } from '@shared/ui/Skeleton'
import { Timeline } from '@shared/ui/Timeline'
import { useToast } from '@shared/ui/Toast'
import { formatDate } from '@shared/lib/formatDate'
import { useAuth } from '../auth/AuthProvider'
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

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={profile.name}
        subtitle={profile.email}
        actions={(
          <>
            <Link to="/candidates" className="inline-flex min-h-11 items-center rounded-full border border-brand-600 px-5 text-sm font-medium text-brand-700">Back</Link>
            {canBlacklist && !profile.is_blacklisted ? <Button variant="danger" onClick={() => ask({ kind: 'blacklist' })}>Blacklist</Button> : null}
            {canBlacklist && profile.is_blacklisted ? <Button variant="secondary" onClick={() => ask({ kind: 'remove' })}>Remove blacklist</Button> : null}
          </>
        )}
      />
      <div className="flex flex-wrap gap-2">
        {profile.colour_tag ? <Badge color={profile.colour_tag.color}>{profile.colour_tag.label}</Badge> : null}
        {profile.signup_source ? <Badge color={profile.signup_source.color}>{profile.signup_source.label}</Badge> : null}
        {profile.is_blacklisted ? <Badge color="red-soft">Blacklisted until {formatDate(profile.blacklist_until)}</Badge> : null}
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <Card>
          <h2 className="text-lg font-medium text-navy">Profile</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Phone" value={profile.phone} />
            <Field label="Location" value={profile.location} />
            <Field label="Date of birth" value={profile.date_of_birth ? `${formatDate(profile.date_of_birth)} (${profile.age})` : null} />
            <Field label="Gender" value={profile.gender?.label} />
            <Field label="Qualification" value={profile.highest_qualification} />
            <Field label="Department" value={profile.preferred_department?.name} />
            <Field label="Experience" value={profile.years_experience == null ? null : `${profile.years_experience} years`} />
            <Field label="Expected CTC" value={profile.expected_ctc == null ? null : String(profile.expected_ctc)} />
            <Field label="Current CTC" value={profile.current_ctc == null ? null : String(profile.current_ctc)} />
            <Field label="Reference" value={profile.reference_id} />
          </dl>
          <div className="mt-4 flex flex-col gap-2">
            {profile.linkedin_url ? <a className="text-brand-700 underline" href={profile.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a> : null}
            {profile.portfolio_url ? <a className="text-brand-700 underline" href={profile.portfolio_url} target="_blank" rel="noreferrer">Portfolio</a> : null}
          </div>
          <div className="mt-5">
            <ProgressBar value={profile.profile_completion_percent} label="Profile completeness" />
          </div>
          {canUpdate ? (
            <div className="mt-5 max-w-xs">
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
          <h2 className="text-lg font-medium text-navy">Resume</h2>
          {!profile.has_resume ? <p className="mt-3 text-sm text-muted">No resume has been uploaded.</p> : null}
          {profile.has_resume && !canResume ? <p className="mt-3 text-sm text-muted">You do not have permission to open resumes.</p> : null}
          {canResume && resume.data?.preview && resume.data.preview_url ? (
            <iframe title={`Resume for ${profile.name}`} src={resume.data.preview_url} className="mt-4 h-96 w-full rounded-xl border border-border" />
          ) : null}
          {canResume && resume.data?.download_url ? (
            <a className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-brand-700" href={resume.data.download_url}>
              Download {resume.data.filename || 'resume'}
            </a>
          ) : null}
        </Card>
      </div>
      <div className="flex gap-2 overflow-x-auto" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-medium ${tab === item.id ? 'bg-brand-600 text-white' : 'bg-white text-navy shadow-card'}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <Card>
        {tab === 'applications' ? <Applications applications={profile.applications ?? []} candidateId={profile.public_id} /> : null}
        {tab === 'interviews' ? <Interviews rounds={rounds} /> : null}
        {tab === 'notes' ? (
          <div className="flex flex-col gap-4">
            {canNotes ? (
              <form onSubmit={(event) => { event.preventDefault(); noteMutation.mutate() }} className="flex flex-col gap-3">
                <FormField id="candidate-note" label="Add a note">
                  <Textarea id="candidate-note" value={note} onChange={(event) => setNote(event.target.value)} />
                </FormField>
                <Button type="submit" className="self-start" loading={noteMutation.isPending} disabled={note.trim().length < 2}>Save note</Button>
              </form>
            ) : null}
            {(profile.notes ?? []).length === 0 ? <EmptyState title="No notes yet" /> : (
              <Timeline items={(profile.notes ?? []).map((item, index) => ({
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
            {profile.is_blacklisted ? (
              <p className="text-sm text-navy">Blacklisted{profile.blacklist_reason ? `: ${profile.blacklist_reason}` : ''}{profile.blacklisted_by ? ` by ${profile.blacklisted_by}` : ''}.</p>
            ) : <p className="text-sm text-muted">This candidate is not blacklisted.</p>}
            {(profile.role_blocks ?? []).length === 0 ? <EmptyState title="No role blocks" /> : (
              <ul className="flex flex-col gap-3">
                {profile.role_blocks.map((block) => (
                  <li key={`${block.role_key}-${block.blocked_until}`} className="rounded-xl border border-border p-4">
                    <p className="font-medium text-navy">{block.role_key}</p>
                    <p className="text-sm text-muted">Until {formatDate(block.blocked_until)} · {block.active ? 'Active' : 'Lifted'}</p>
                    <p className="mt-1 text-sm">{block.reason}</p>
                    {block.override_reason ? <p className="mt-1 text-sm text-muted">Override: {block.override_reason}</p> : null}
                    {canOverride && block.active ? (
                      <Button className="mt-3" size="sm" variant="secondary" onClick={() => ask({ kind: 'override', roleKey: block.role_key })}>Override block</Button>
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
      <Modal open={Boolean(pending) && !confirmOpen} onClose={() => setPending(null)} title={pending?.kind === 'override' ? 'Override role block' : pending?.kind === 'remove' ? 'Remove blacklist' : 'Blacklist candidate'}>
        <FormField id="action-reason" label="Reason">
          <Textarea id="action-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
        </FormField>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
          <Button onClick={review}>Continue</Button>
        </div>
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

function Applications({ applications, candidateId }) {
  if (applications.length === 0) return <EmptyState title="No applications yet" />
  return (
    <ul className="flex flex-col gap-3">
      {applications.map((application) => (
        <li key={application.public_id} className="flex flex-col gap-2 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-navy">{application.role}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {application.entity ? <EntityBadge entity={application.entity} /> : null}
              <StatusBadge status={application.status} />
              {application.is_flagged ? <Badge color="amber">Flagged</Badge> : null}
            </div>
          </div>
          <Link className="inline-flex min-h-11 items-center text-sm text-brand-700" to={`/applications?candidate=${candidateId}`}>
            {formatDate(application.applied_at)}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function Interviews({ rounds }) {
  if (rounds.length === 0) return <EmptyState title="No interviews yet" />
  return (
    <ul className="flex flex-col gap-3">
      {rounds.map((round) => (
        <li key={round.key} className="rounded-xl border border-border p-4">
          <p className="font-medium text-navy">{round.round_name} · {round.role}</p>
          <p className="text-sm text-muted">{formatDate(round.scheduled_at)} · {round.mode} · {round.interviewer_name}</p>
          <div className="mt-2"><Badge color={round.status_color}>{round.status_label}</Badge></div>
        </li>
      ))}
    </ul>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-sm text-navy">{value || '—'}</dd>
    </div>
  )
}
