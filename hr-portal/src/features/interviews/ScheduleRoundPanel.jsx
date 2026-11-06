import { useEffect } from 'react'
import PropTypes from 'prop-types'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@shared/ui/Button'
import { DateInput } from '@shared/ui/DateInput'
import { todayIso } from '@shared/lib/formatDate'
import { FormField } from '@shared/ui/FormField'
import { Input } from '@shared/ui/Input'
import { SlideOver } from '@shared/ui/Modal'
import { Select } from '@shared/ui/Select'
import { useToast } from '@shared/ui/Toast'
import { applyApiErrors } from '@shared/lib/formErrors'
import { fromRound, interviewRoundSchema, toRoundPayload } from '@shared/validation/interview'
import { fetchHrMeta } from '../applications/api'
import { scheduleRound, updateRound } from './api'

const durations = [15, 30, 45, 60, 90, 120].map((minutes) => ({ value: String(minutes), label: `${minutes} minutes` }))

/**
 * Slide-over form to schedule a new round (pass `application`) or reschedule one (pass `round`).
 */
export function ScheduleRoundPanel({ open, onClose, application, round }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const meta = useQuery({ queryKey: ['hr-meta'], queryFn: fetchHrMeta, staleTime: 600_000 })
  const form = useForm({ resolver: zodResolver(interviewRoundSchema), defaultValues: fromRound(round) })
  const values = useWatch({ control: form.control })
  const errors = form.formState.errors
  const editing = Boolean(round)

  useEffect(() => {
    if (open) form.reset(fromRound(round))
  }, [open, round, form])

  const mutation = useMutation({
    mutationFn: (payload) => (editing ? updateRound(round.public_id, payload) : scheduleRound(application.public_id, payload)),
    onSuccess: (result) => {
      toast.push({ tone: 'success', message: editing ? 'Interview rescheduled' : 'Interview scheduled. Adding it to Google Calendar…' })
      result?.warnings?.forEach((message) => toast.push({ tone: 'warning', message }))
      queryClient.invalidateQueries({ queryKey: ['hr-interviews'] })
      queryClient.invalidateQueries({ queryKey: ['hr-applications'] })
      queryClient.invalidateQueries({ queryKey: ['hr-candidate'] })
      onClose()
    },
    onError: (error) => {
      const serverErrors = { ...(error.errors ?? {}) }
      if (serverErrors.scheduled_at) serverErrors.time = serverErrors.scheduled_at
      const fieldKeys = Object.keys(serverErrors).filter((key) => key in fromRound())
      if (fieldKeys.length) {
        applyApiErrors({ ...error, errors: Object.fromEntries(fieldKeys.map((key) => [key, serverErrors[key]])) }, form.setError)
      } else {
        toast.push({ tone: 'error', message: error.message })
      }
    },
  })

  const modes = (meta.data?.enums?.interview_modes ?? []).map((item) => ({ value: item.value, label: item.label }))
  const where = values.mode === 'video' ? 'Meeting link' : values.mode === 'phone' ? 'Phone number or note' : 'Location'
  const who = application?.candidate?.name ?? round?.application?.candidate?.name

  return (
    <SlideOver open={open} onClose={onClose} title={editing ? 'Reschedule interview' : 'Schedule interview'}>
      <form className="flex flex-col gap-4" noValidate onSubmit={form.handleSubmit((data) => mutation.mutate(toRoundPayload(data)))}>
        {who ? (
          <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-navy">
            {who} · {application?.role ?? round?.application?.role}
          </p>
        ) : null}
        <FormField id="round_name" label="Round name" required error={errors.round_name?.message} hint="For example Technical round or HR round.">
          <Input id="round_name" {...form.register('round_name')} invalid={Boolean(errors.round_name)} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField id="round_date" label="Date" required error={errors.date?.message}>
            <DateInput id="round_date" min={todayIso()} value={values.date} invalid={Boolean(errors.date)} onChange={(date) => form.setValue('date', date, { shouldValidate: form.formState.isSubmitted })} />
          </FormField>
          <FormField id="round_time" label="Time" required error={errors.time?.message}>
            <Input id="round_time" type="time" {...form.register('time')} invalid={Boolean(errors.time)} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField id="round_duration" label="Duration">
            <Select id="round_duration" value={values.duration_minutes} onChange={(value) => form.setValue('duration_minutes', value)} options={durations} />
          </FormField>
          <FormField id="round_mode" label="Mode" required error={errors.mode?.message}>
            <Select id="round_mode" value={values.mode} onChange={(value) => form.setValue('mode', value, { shouldValidate: form.formState.isSubmitted })} options={modes} />
          </FormField>
        </div>
        <FormField id="round_where" label={where} required={values.mode !== 'phone'} error={errors.location_or_link?.message}>
          <Input id="round_where" {...form.register('location_or_link')} invalid={Boolean(errors.location_or_link)} />
        </FormField>
        <FormField id="interviewer_name" label="Interviewer" required error={errors.interviewer_name?.message}>
          <Input id="interviewer_name" autoComplete="off" {...form.register('interviewer_name')} invalid={Boolean(errors.interviewer_name)} />
        </FormField>
        <FormField id="interviewer_email" label="Interviewer email" error={errors.interviewer_email?.message} hint="Used for the calendar event. The candidate is never emailed.">
          <Input id="interviewer_email" type="email" autoComplete="off" {...form.register('interviewer_email')} invalid={Boolean(errors.interviewer_email)} />
        </FormField>
        <div className="mt-2 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>{editing ? 'Save changes' : 'Schedule'}</Button>
        </div>
      </form>
    </SlideOver>
  )
}

ScheduleRoundPanel.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  application: PropTypes.object,
  round: PropTypes.object,
}
