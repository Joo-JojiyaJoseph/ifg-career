import PropTypes from 'prop-types'
import dayjs from 'dayjs'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { Button } from '@shared/ui/Button'
import { IconButton } from '@shared/ui/IconButton'
import { Skeleton } from '@shared/ui/Skeleton'
import { formatTime } from '@shared/lib/formatDate'
import { startOfWeek } from '@shared/lib/week'

const chipTone = {
  scheduled: 'border-violet/40 bg-violet-50 text-violet-900',
  completed: 'border-sky-300 bg-sky-50 text-sky-900',
  passed: 'border-green-300 bg-green-50 text-green-900',
  not_selected: 'border-red-200 bg-red-50 text-red-800',
}

/**
 * Week calendar: seven day columns on desktop, a day-by-day agenda on small screens.
 */
export function CalendarWeek({ weekStart, rounds, loading, onSelect, onNavigate }) {
  const days = Array.from({ length: 7 }, (_, index) => dayjs(weekStart).add(index, 'day'))
  const byDay = days.map((day) => rounds.filter((round) => dayjs(round.scheduled_at).isSame(day, 'day')))
  const label = `${days[0].format('DD MMM')} – ${days[6].format('DD MMM YYYY')}`

  return (
    <section className="rounded-2xl border border-border bg-white p-4 shadow-card" aria-label="Interview calendar">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-navy">{label}</h2>
        <div className="flex items-center gap-2">
          <IconButton label="Previous week" onClick={() => onNavigate(dayjs(weekStart).subtract(1, 'week'))}>
            <ChevronLeftIcon className="h-5 w-5" />
          </IconButton>
          <Button size="sm" variant="secondary" onClick={() => onNavigate(startOfWeek())}>This week</Button>
          <IconButton label="Next week" onClick={() => onNavigate(dayjs(weekStart).add(1, 'week'))}>
            <ChevronRightIcon className="h-5 w-5" />
          </IconButton>
        </div>
      </div>
      {loading ? <Skeleton className="h-72" /> : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
          {days.map((day, index) => {
            const today = day.isSame(dayjs(), 'day')
            const items = byDay[index]
            return (
              <div key={day.format('YYYY-MM-DD')} className={`flex min-h-24 flex-col gap-2 rounded-xl p-2 md:min-h-64 ${today ? 'bg-brand-50 ring-1 ring-brand-500/40' : 'bg-slate-50'} ${items.length === 0 ? 'max-md:hidden' : ''}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${today ? 'text-brand-700' : 'text-muted'}`}>
                  {day.format('ddd')} <span className="text-base text-navy">{day.format('DD')}</span>
                </p>
                {items.map((round) => (
                  <button
                    key={round.public_id}
                    type="button"
                    onClick={() => onSelect(round)}
                    className={`min-h-11 rounded-lg border px-2 py-1.5 text-left text-xs transition duration-200 hover:-translate-y-0.5 hover:shadow-card ${chipTone[round.status.value] ?? 'border-border bg-white'}`}
                  >
                    <span className="block font-semibold">{formatTime(round.scheduled_at)} · {round.round_name}</span>
                    <span className="block truncate">{round.application?.candidate?.name}</span>
                    {round.calendar.status.value === 'failed' ? <span className="mt-0.5 block font-medium text-danger">Sync failed</span> : null}
                  </button>
                ))}
              </div>
            )
          })}
          {rounds.length === 0 ? <p className="py-6 text-center text-sm text-muted md:col-span-7">No interviews this week.</p> : null}
        </div>
      )}
    </section>
  )
}

CalendarWeek.propTypes = {
  weekStart: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  rounds: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onNavigate: PropTypes.func.isRequired,
}
