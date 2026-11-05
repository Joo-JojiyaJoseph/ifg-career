import dayjs from 'dayjs'
import { z } from 'zod'

const requiredText = (message) => z.string().trim().min(1, message)

export const jobDraftSchema = z.object({
  title: requiredText('Add a title.').max(150, 'Use 150 characters or fewer.'),
  entity: requiredText('Choose an entity.'),
  department_id: z.string(),
  team_id: z.string(),
  level: requiredText('Choose a level.'),
  location: requiredText('Add a location.').max(120, 'Use 120 characters or fewer.'),
  summary: requiredText('Add a summary.'),
  qualification: requiredText('Add the qualification.'),
  experience: requiredText('Add the experience.').max(150, 'Use 150 characters or fewer.'),
  why_join_us: z.string(),
  last_date_to_apply: requiredText('Choose a last date to apply.'),
  skills: z.array(z.string()),
})

export const jobPublishSchema = jobDraftSchema.extend({
  last_date_to_apply: requiredText('Choose a last date to apply.').refine(
    (value) => !dayjs(value).isBefore(dayjs(), 'day'),
    'Choose today or a later date.',
  ),
  skills: z.array(z.string()).min(1, 'Add at least one skill.'),
})
