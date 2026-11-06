import PropTypes from 'prop-types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {
  BellAlertIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'

dayjs.extend(relativeTime)

const levels = {
  success: { icon: CheckCircleIcon, tone: 'bg-green-100 text-green-700' },
  warning: { icon: ExclamationTriangleIcon, tone: 'bg-amber-100 text-amber-700' },
  danger: { icon: BellAlertIcon, tone: 'bg-red-100 text-red-700' },
  info: { icon: InformationCircleIcon, tone: 'bg-brand-100 text-brand-700' },
}

/**
 * One notification row: level icon, title, message and how long ago. Unread rows are highlighted.
 */
export function NotificationItem({ item, onSelect, compact = false }) {
  const level = levels[item.level] ?? levels.info
  const Icon = level.icon
  const unread = !item.read_at

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition duration-200 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${unread ? 'bg-brand-50/60' : ''}`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${level.tone}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={`truncate text-sm ${unread ? 'font-semibold text-navy' : 'font-medium text-text'}`}>{item.title}</span>
          {unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" aria-label="Unread" /> : null}
        </span>
        <span className={`mt-0.5 block text-sm text-muted ${compact ? 'line-clamp-2' : ''}`}>{item.message}</span>
        <span className="mt-1 block text-xs text-muted">{dayjs(item.created_at).fromNow()}</span>
      </span>
    </button>
  )
}

NotificationItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string,
    level: PropTypes.string,
    read_at: PropTypes.string,
    created_at: PropTypes.string,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  compact: PropTypes.bool,
}
