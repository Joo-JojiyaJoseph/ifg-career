import { useState } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowPathIcon, CalendarDaysIcon, ClockIcon, LinkIcon, PencilSquareIcon, UserIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { Avatar } from '@shared/ui/Avatar'
import { Badge } from '@shared/ui/Badge'
import { Button } from '@shared/ui/Button'
import { ConfirmDialog } from '@shared/ui/ConfirmDialog'
import { EntityBadge } from '@shared/ui/EntityBadge'
import { FormField } from '@shared/ui/FormField'
import { Textarea } from '@shared/ui/Input'
import { SlideOver } from '@shared/ui/Modal'
import { useToast } from '@shared/ui/Toast'
import { formatDateTime } from '@shared/lib/formatDate'
import { cancelRound, retrySync, updateRoundStatus } from './api'

/**
 * Details of one round with its status actions, feedback, calendar sync and reschedule/cancel.
 */
export function RoundDetailPanel({ round, onClose, onReschedule, canManage }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState(round?.feedback ?? '')
  const [source, setSource] = useState(round?.public_id)
  const [confirmCancel, setConfirmCancel] = useState(false)

  if (round?.public_id !== source) {
    setSource(round?.public_id)
    setFeedback(round?.feedback ?? '')
  }

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['hr-interviews'] })
    queryClient.invalidateQueries({ queryKey: ['hr-applications'] })
  }

  const status = useMutation({
    mutationFn: (next) => updateRoundStatus(round.public_id, next, feedback || null),
    onSuccess: (updated) => {
      toast.push({ tone: 'success', message: `Round marked ${updated.status.label}` })
      if (updated.application?.result?.value === 'not_selected') {
        toast.push({ tone: 'info', message: 'The candidate is marked Not selected for this role.' })
      }
      refresh()
      onClose()
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })
  const retry = useMutation({
    mutationFn: () => retrySync(round.public_id),
    onSuccess: () => {
      toast.push({ tone: 'success', message: 'Retrying the Google Calendar sync' })
      refresh()
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })
  const cancel = useMutation({
    mutationFn: () => cancelRound(round.public_id),
    onSuccess: () => {
      toast.push({ tone: 'success', message: 'Interview cancelled' })
      setConfirmCancel(false)
      refresh()
      onClose()
    },
    onError: (error) => toast.push({ tone: 'error', message: error.message }),
  })

  const candidate = round?.application?.candidate
  const decided = Boolean(round?.application?.result)

  return (
    <SlideOver open={Boolean(round)} onClose={onClose} title={round ? `Round ${round.round_number}: ${round.round_name}` : 'Interview'}>
      {round ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Avatar name={candidate?.name} src={candidate?.avatar_url} initials={candidate?.initials} />
            <div className="min-w-0">
              <Link to={`/candidates/${candidate?.public_id}`} className="font-medium text-brand-700 hover:underline">{candidate?.name}</Link>
              <p className="truncate text-sm text-muted">{round.application?.role}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <EntityBadge entity={round.application?.entity} />
            <Badge color={round.status.color}>{round.status.label}</Badge>
            <Badge color={round.mode.color}>{round.mode.label}</Badge>
          </div>
          <dl className="grid gap-3 text-sm">
            <Detail icon={CalendarDaysIcon} label="When">{formatDateTime(round.scheduled_at)} · {round.duration_minutes} min</Detail>
            <Detail icon={UserIcon} label="Interviewer">{round.interviewer_name}{round.interviewer_email ? ` (${round.interviewer_email})` : ''}</Detail>
            {round.location_or_link ? (
              <Detail icon={LinkIcon} label="Where">
                {/^https?:\/\//.test(round.location_or_link) ? (
                  <a className="break-all text-brand-700 underline" href={round.location_or_link} target="_blank" rel="noreferrer noopener">{round.location_or_link}</a>
                ) : round.location_or_link}
              </Detail>
            ) : null}
            {round.created_by ? <Detail icon={ClockIcon} label="Scheduled by">{round.created_by}</Detail> : null}
          </dl>
          <div className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-navy">Google Calendar</span>
              <Badge color={round.calendar.status.color}>{round.calendar.status.label}</Badge>
            </div>
            {round.calendar.error ? <p className="mt-2 text-sm text-muted">{round.calendar.error}</p> : null}
            {canManage && round.calendar.status.value === 'failed' ? (
              <Button className="mt-3" size="sm" variant="secondary" icon={ArrowPathIcon} loading={retry.isPending} onClick={() => retry.mutate()}>Retry sync</Button>
            ) : null}
          </div>
          {canManage && !decided && round.allowed_statuses.length > 0 ? (
            <div className="flex flex-col gap-3">
              <FormField id="round-feedback" label="Feedback" hint="Visible to HR only.">
                <Textarea id="round-feedback" rows={4} value={feedback} onChange={(event) => setFeedback(event.target.value)} />
              </FormField>
              <div className="flex flex-wrap gap-2">
                {round.allowed_statuses.map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant={option.value === 'not_selected' ? 'danger' : option.value === 'passed' ? 'primary' : 'secondary'}
                    loading={status.isPending && status.variables === option.value}
                    onClick={() => status.mutate(option.value)}
                  >
                    Mark {option.label.toLowerCase()}
                  </Button>
                ))}
              </div>
            </div>
          ) : round.feedback ? (
            <div>
              <p className="text-sm font-medium text-navy">Feedback</p>
              <p className="mt-1 whitespace-pre-line text-sm text-text">{round.feedback}</p>
            </div>
          ) : null}
          {canManage && round.status.value === 'scheduled' && !decided ? (
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Button size="sm" variant="secondary" icon={PencilSquareIcon} onClick={() => onReschedule(round)}>Reschedule</Button>
              <Button size="sm" variant="ghost" icon={XCircleIcon} onClick={() => setConfirmCancel(true)}>Cancel interview</Button>
            </div>
          ) : null}
          <ConfirmDialog
            open={confirmCancel}
            onClose={() => setConfirmCancel(false)}
            onConfirm={() => cancel.mutate()}
            loading={cancel.isPending}
            title="Cancel this interview?"
            message="The round is removed and its Google Calendar event is deleted. The candidate is not emailed."
            confirmLabel="Cancel interview"
          />
        </div>
      ) : null}
    </SlideOver>
  )
}

function Detail({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
      <div>
        <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
        <dd className="text-text">{children}</dd>
      </div>
    </div>
  )
}

Detail.propTypes = { icon: PropTypes.elementType.isRequired, label: PropTypes.string.isRequired, children: PropTypes.node }

RoundDetailPanel.propTypes = {
  round: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onReschedule: PropTypes.func.isRequired,
  canManage: PropTypes.bool,
}
