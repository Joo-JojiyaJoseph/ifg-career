import { useState } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRightIcon, CalendarDaysIcon, CheckBadgeIcon, CheckIcon, ChevronRightIcon, InformationCircleIcon, LockClosedIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Badge, StatusBadge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { EntityBadge } from '@shared/ui/EntityBadge'
import { FormField } from '@shared/ui/FormField'
import { Textarea } from '@shared/ui/Input'
import { EmptyState } from '@shared/ui/Skeleton'
import { useToast } from '@shared/ui/Toast'
import { formatDate } from '@shared/lib/formatDate'
import { undoStatus, updateStatus } from '../applications/api'
import { StatusChangeDialog } from '../applications/StatusChangeDialog'
import { updateRoundStatus } from '../interviews/api'
import { ScheduleRoundPanel } from '../interviews/ScheduleRoundPanel'

const stages = ['Applied', 'Under review', 'Shortlisted', 'Interview', 'Result']

/** Where the application is on the hiring path, as an index into `stages`. */
function stageOf(application) {
  if (application.result) return 4
  if (application.rounds?.length) return 3
  return { applied: 0, under_review: 1, shortlisted: 2 }[application.status] ?? 0
}

/**
 * Why an interview cannot be scheduled yet, or null when it can. Mirrors the server's rules
 * (InterviewService::assertSchedulable), so HR sees the reason before trying.
 */
function scheduleBlocker(application) {
  if (application.is_flagged) return 'This candidate is blacklisted, so interviews cannot be scheduled.'
  if (application.result) return 'This application already has a final result.'
  if (application.status === 'rejected') return null
  if (application.status !== 'shortlisted') return 'Shortlist the application to schedule an interview.'
  if (application.rounds?.some((round) => ['scheduled', 'completed', 'not_selected'].includes(round.status))) {
    return 'Record the result of the current round (above) before scheduling the next one.'
  }
  return null
}

/**
 * The candidate's applications, each with its progress, a "Move to" status control and "Schedule interview".
 */
export function CandidateApplications({ applications, candidate, canUpdate, canSchedule }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [scheduleFor, setScheduleFor] = useState(null)
  // The status change waiting for HR to confirm: { application, option }.
  const [pending, setPending] = useState(null)

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['hr-candidate', candidate.public_id] })
    queryClient.invalidateQueries({ queryKey: ['hr-candidate-activity', candidate.public_id] })
    queryClient.invalidateQueries({ queryKey: ['hr-applications'] })
  }

  const undo = useMutation({
    mutationFn: (id) => undoStatus(id),
    onSuccess: () => {
      toast.push({ tone: 'success', message: 'Status change undone' })
      refresh()
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })
  const status = useMutation({
    mutationFn: ({ id, value }) => updateStatus(id, value),
    onSuccess: (_data, { id, label }) => {
      toast.push({ tone: 'success', message: `Moved to ${label}`, duration: 5000, action: { label: 'Undo', onClick: () => undo.mutate(id) } })
      setPending(null)
      refresh()
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })

  if (applications.length === 0) return <EmptyState title="No applications yet" />

  return (
    <>
      <ul className="flex flex-col gap-4">
        {applications.map((application) => {
          const stage = stageOf(application)
          const next = application.allowed_statuses ?? []
          const blocker = scheduleBlocker(application)
          const closed = application.status === 'rejected'
          return (
            <li key={application.public_id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-brand-200 hover:shadow-card sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold text-ink">{application.role}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {application.entity ? <EntityBadge entity={application.entity} /> : null}
                    {/* A final result replaces the status. */}
                    <StatusBadge status={application.result || application.status} />
                    {application.is_flagged ? <Badge color="amber">Flagged</Badge> : null}
                  </div>
                </div>
                <Link className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium text-brand-700 hover:underline" to={`/applications?candidate=${candidate.public_id}`}>
                  Applied {formatDate(application.applied_at)}
                  <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              {closed ? null : (
                <ol className="mt-4 grid grid-cols-5 gap-1" aria-label="Progress">
                  {stages.map((name, index) => (
                    <li key={name} className="flex flex-col gap-1.5" aria-current={index === stage ? 'step' : undefined}>
                      <span className={`h-1.5 rounded-full ${index <= stage ? 'bg-brand-600' : 'bg-slate-200'}`} />
                      <span className={`flex items-center gap-1 truncate text-[11px] sm:text-xs ${index === stage ? 'font-semibold text-brand-800' : index < stage ? 'font-medium text-slate-700' : 'text-slate-500'}`}>
                        {index < stage ? <CheckIcon className="h-3 w-3 shrink-0 text-brand-600" aria-hidden="true" /> : null}
                        {name}
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              {canSchedule && !closed && !application.result ? <CurrentRound application={application} onDone={refresh} /> : null}

              {application.result ? (
                <p className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-slate-50 px-3 py-2.5 text-sm text-muted">
                  <LockClosedIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    Final result: <span className="font-medium text-ink">{application.result_label}</span>. This application is complete, so its status no longer changes.
                  </span>
                </p>
              ) : closed ? (
                <RejectedNote application={application} blocks={candidate.role_blocks ?? []} />
              ) : (canUpdate && next.length) || canSchedule ? (
                <div className="mt-4 flex flex-col gap-4 border-t border-slate-200 pt-4 lg:flex-row lg:items-end lg:justify-between">
                  {canUpdate && next.length ? (
                    <div role="group" aria-labelledby={`move-${application.public_id}`}>
                      <p id={`move-${application.public_id}`} className="mb-2 text-sm font-semibold text-ink">Move to</p>
                      <div className="flex flex-wrap gap-2">
                        {next.map((option) => {
                          const reject = option.value === 'rejected'
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setPending({ application, option })}
                              className={`group inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                                reject
                                  ? 'border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100 focus-visible:ring-red-500'
                                  : 'border-brand-200 bg-brand-50 text-brand-800 hover:border-brand-300 hover:bg-brand-100 focus-visible:ring-brand-500'
                              }`}
                            >
                              {reject ? <XMarkIcon className="h-4 w-4" aria-hidden="true" /> : <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />}
                              {reject ? 'Reject' : option.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}
                  {canSchedule && !closed ? (
                    <Button
                      variant={blocker ? 'secondary' : 'primary'}
                      icon={CalendarDaysIcon}
                      disabled={Boolean(blocker)}
                      onClick={() => setScheduleFor({ ...application, candidate: { name: candidate.name } })}
                    >
                      Schedule interview
                    </Button>
                  ) : null}
                </div>
              ) : null}
              {canSchedule && blocker && !closed && !application.result ? (
                <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
                  <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {blocker}
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>
      <ScheduleRoundPanel open={Boolean(scheduleFor)} onClose={() => setScheduleFor(null)} application={scheduleFor} />
      <StatusChangeDialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        loading={status.isPending}
        onConfirm={() => status.mutate({ id: pending.application.public_id, value: pending.option.value, label: pending.option.label })}
        from={pending?.application.status}
        to={pending?.option}
        candidate={candidate.name}
        role={pending?.application.role}
      />
    </>
  )
}

/**
 * A rejected application: closed, and when the rejection came after shortlisting, the 6-month block on the same
 * role (AR-03) with its end date. HR can override the block in the "Blocks & blacklist" tab.
 */
function RejectedNote({ application, blocks }) {
  const block = blocks.find((item) => item.source_application === application.public_id && item.active)
  return (
    <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-900">
      <XMarkIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">Rejected. This application is closed.</p>
        <p className="mt-0.5 text-red-800">
          {block
            ? `They cannot apply for this role again until ${formatDate(block.blocked_until)} (6-month rule). Other roles are open to them. You can lift the block in Blocks & blacklist.`
            : 'They can still apply for other roles.'}
        </p>
      </div>
    </div>
  )
}

RejectedNote.propTypes = { application: PropTypes.object.isRequired, blocks: PropTypes.array.isRequired }

CandidateApplications.propTypes = {
  applications: PropTypes.array.isRequired,
  candidate: PropTypes.shape({ public_id: PropTypes.string.isRequired, name: PropTypes.string, role_blocks: PropTypes.array }).isRequired,
  canUpdate: PropTypes.bool,
  canSchedule: PropTypes.bool,
}

/**
 * The round waiting for a result, with buttons to record it (Passed, Not selected, or Completed while feedback is
 * still coming) and optional feedback. Shown on the candidate's application so HR need not go to Interviews.
 */
function CurrentRound({ application, onDone }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const round = (application.rounds ?? []).find((item) => item.allowed_statuses?.length)
  const [feedback, setFeedback] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)

  const record = useMutation({
    mutationFn: (value) => updateRoundStatus(round.public_id, value, feedback.trim() || null),
    onSuccess: (updated) => {
      toast.push({ tone: 'success', message: `${round.round_name} marked ${updated.status?.label ?? 'updated'}` })
      if (updated.application?.result?.value === 'not_selected') toast.push({ tone: 'info', message: 'The candidate is marked Not selected for this role.' })
      setFeedback('')
      setShowFeedback(false)
      queryClient.invalidateQueries({ queryKey: ['hr-interviews'] })
      onDone()
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })

  if (!round?.public_id) return null
  const styleOf = { passed: { variant: 'primary', icon: CheckBadgeIcon }, not_selected: { variant: 'danger', icon: XMarkIcon }, completed: { variant: 'secondary', icon: CheckIcon } }

  return (
    <section className="mt-4 rounded-xl border border-brand-100 bg-brand-50/60 p-3 sm:p-4" aria-label="Current interview round">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">Current round</p>
          <p className="truncate font-medium text-ink">
            Round {round.round_number} · {round.round_name}
          </p>
          <p className="text-sm text-muted">
            {formatDate(round.scheduled_at)}
            {round.interviewer_name ? ` · ${round.interviewer_name}` : ''}
          </p>
        </div>
        <Badge color={round.status_color}>{round.status_label}</Badge>
      </div>
      {showFeedback ? (
        <div className="mt-3">
          <FormField id={`feedback-${round.public_id}`} label="Feedback" hint="Visible to HR only.">
            <Textarea id={`feedback-${round.public_id}`} rows={3} value={feedback} onChange={(event) => setFeedback(event.target.value)} />
          </FormField>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {round.allowed_statuses.map((option) => {
          const look = styleOf[option.value] ?? { variant: 'secondary', icon: CheckIcon }
          return (
            <Button key={option.value} size="sm" variant={look.variant} icon={look.icon} loading={record.isPending && record.variables === option.value} disabled={record.isPending} onClick={() => record.mutate(option.value)}>
              Mark {option.label.toLowerCase()}
            </Button>
          )
        })}
        {!showFeedback ? (
          <Button size="sm" variant="ghost" onClick={() => setShowFeedback(true)}>
            Add feedback
          </Button>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-muted">
        The candidate sees this round's date, time and joining link under My Applications on the careers site, and later the final result (Selected or Not selected). They never see round outcomes or feedback.
      </p>
    </section>
  )
}

CurrentRound.propTypes = { application: PropTypes.object.isRequired, onDone: PropTypes.func.isRequired }
