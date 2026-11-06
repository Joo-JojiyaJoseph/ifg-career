import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

/** Display dates as DD-MM-YYYY. */
export function formatDate(value) {
  if (!value) return '—'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('DD-MM-YYYY') : '—'
}

/** Parse a DD-MM-YYYY string into Y-m-d, or return an empty string. */
export function toIsoDate(display) {
  const parsed = dayjs(display, 'DD-MM-YYYY', true)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : ''
}

export function toDisplayDate(iso) {
  if (!iso) return ''
  const parsed = dayjs(iso, 'YYYY-MM-DD', true)
  return parsed.isValid() ? parsed.format('DD-MM-YYYY') : ''
}

/** Display a moment as DD-MM-YYYY, HH:MM (24-hour, local time). */
export function formatDateTime(value) {
  if (!value) return '—'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('DD-MM-YYYY, HH:mm') : '—'
}

/** Time only, HH:MM. */
export function formatTime(value) {
  if (!value) return ''
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('HH:mm') : ''
}

/** Today's date as Y-m-d in the user's own time zone, for date pickers' `min` / `max`. */
export function todayIso() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
