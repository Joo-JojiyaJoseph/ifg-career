import { useState } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDaysIcon, CheckIcon, ChevronRightIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { Badge, StatusBadge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { EntityBadge } from '@shared/ui/EntityBadge'
import { Select } from '@shared/ui/Select'
import { EmptyState } from '@shared/ui/Skeleton'
import { useToast } from '@shared/ui/Toast'
import { formatDate } from '@shared/lib/formatDate'
import { undoStatus, updateStatus } from '../applications/api'
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
    return 'Mark the current round Passed or Not selected (in Interviews) before scheduling the next one.'
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
            <li key={application.public_id} className="rounded-2xl border border-border p-4 transition duration-200 hover:border-brand-200 hover:shadow-card sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold text-ink">{application.role}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {application.entity ? <EntityBadge entity={application.entity} /> : null}
                    <StatusBadge status={application.status} />
                    {application.result_label ? <Badge color={application.result === 'selected' ? 'green' : 'red-soft'}>{application.result_label}</Badge> : null}
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
                      <span className={`flex items-center gap-1 truncate text-[11px] sm:text-xs ${index === stage ? 'font-semibold text-ink' : 'text-muted'}`}>
                        {index < stage ? <CheckIcon className="h-3 w-3 shrink-0 text-brand-600" aria-hidden="true" /> : null}
                        {name}
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              {(canUpdate && next.length) || canSchedule ? (
                <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end">
                  {canUpdate && next.length ? (
                    <div className="sm:w-56">
                      <label htmlFor={`move-${application.public_id}`} className="mb-1 block text-xs font-medium text-muted">Move to</label>
                      <Select
                        id={`move-${application.public_id}`}
                        value=""
                        placeholder="Change status"
                        onChange={(value) => {
                          const option = next.find((item) => item.value === value)
                          if (option) status.mutate({ id: application.public_id, value, label: option.label })
                        }}
                        options={next.map((item) => ({ value: item.value, label: item.label }))}
                      />
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
              {canSchedule && blocker && !closed ? (
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
    </>
  )
}

CandidateApplications.propTypes = {
  applications: PropTypes.array.isRequired,
  candidate: PropTypes.shape({ public_id: PropTypes.string.isRequired, name: PropTypes.string }).isRequired,
  canUpdate: PropTypes.bool,
  canSchedule: PropTypes.bool,
}
