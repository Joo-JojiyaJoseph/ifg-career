import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { interviewRoundSchema, toRoundPayload } from './interview'

const valid = {
  round_name: 'Technical round',
  date: dayjs().add(2, 'day').format('YYYY-MM-DD'),
  time: '10:30',
  duration_minutes: '45',
  mode: 'video',
  location_or_link: 'https://meet.example.com/x',
  interviewer_name: 'Anita',
  interviewer_email: '',
}

describe('interviewRoundSchema', () => {
  it('accepts a future round and builds the API payload', () => {
    expect(interviewRoundSchema.safeParse(valid).success).toBe(true)
    expect(toRoundPayload(valid)).toMatchObject({ duration_minutes: 45, interviewer_email: null })
  })

  it('rejects past times and a missing meeting link for video rounds', () => {
    const past = interviewRoundSchema.safeParse({ ...valid, date: dayjs().subtract(1, 'day').format('YYYY-MM-DD') })
    const noLink = interviewRoundSchema.safeParse({ ...valid, location_or_link: '' })
    expect(past.success).toBe(false)
    expect(noLink.success).toBe(false)
  })
})
