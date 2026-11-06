import dayjs from 'dayjs'
import { z } from 'zod'

const requiredText = (message) => z.string().trim().min(1, message)

/** Schedule or reschedule an interview round. Mirrors InterviewRoundRequest on the API. */
export const interviewRoundSchema = z
  .object({
    round_name: requiredText('Add a round name.').max(100, 'Use 100 characters or fewer.'),
    date: requiredText('Choose a date.'),
    time: requiredText('Choose a time.').regex(/^\d{2}:\d{2}$/, 'Use the format HH:MM.'),
    duration_minutes: z.string(),
    mode: requiredText('Choose a mode.'),
    location_or_link: z.string().trim().max(255, 'Use 255 characters or fewer.'),
    interviewer_name: requiredText('Add the interviewer.').max(100, 'Use 100 characters or fewer.'),
    interviewer_email: z.union([z.literal(''), z.string().trim().email('Enter a valid email.')]),
  })
  .superRefine((values, context) => {
    const start = dayjs(`${values.date}T${values.time}`)
    if (values.date && values.time && (!start.isValid() || start.isBefore(dayjs()))) {
      context.addIssue({ code: 'custom', path: ['time'], message: 'Choose a date and time in the future.' })
    }
    if (['video', 'in_person'].includes(values.mode) && !values.location_or_link) {
      context.addIssue({ code: 'custom', path: ['location_or_link'], message: 'Add the meeting link or the interview location.' })
    }
  })

export function toRoundPayload(values) {
  return {
    round_name: values.round_name,
    scheduled_at: dayjs(`${values.date}T${values.time}`).format(),
    duration_minutes: Number(values.duration_minutes) || 60,
    mode: values.mode,
    location_or_link: values.location_or_link || null,
    interviewer_name: values.interviewer_name,
    interviewer_email: values.interviewer_email || null,
  }
}

export function fromRound(round) {
  if (!round) {
    return {
      round_name: '',
      date: '',
      time: '10:00',
      duration_minutes: '60',
      mode: 'video',
      location_or_link: '',
      interviewer_name: '',
      interviewer_email: '',
    }
  }
  const start = dayjs(round.scheduled_at)
  return {
    round_name: round.round_name ?? '',
    date: start.format('YYYY-MM-DD'),
    time: start.format('HH:mm'),
    duration_minutes: String(round.duration_minutes ?? 60),
    mode: round.mode?.value ?? 'video',
    location_or_link: round.location_or_link ?? '',
    interviewer_name: round.interviewer_name ?? '',
    interviewer_email: round.interviewer_email ?? '',
  }
}
