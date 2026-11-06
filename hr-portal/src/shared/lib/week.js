import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)

/** Monday of the week containing `value` (weeks run Monday to Sunday, matching the API). */
export function startOfWeek(value = undefined) {
  return dayjs(value).startOf('isoWeek')
}
