import PropTypes from 'prop-types'

const tones = {
  blue: 'bg-brand-100 text-brand-900',
  sky: 'bg-sky-100 text-sky-800',
  green: 'bg-green-100 text-green-800',
  emerald: 'bg-emerald-100 text-emerald-800',
  violet: 'bg-violet-100 text-violet-800',
  'red-soft': 'bg-red-100 text-red-700',
  danger: 'bg-red-100 text-red-700',
  slate: 'bg-slate-100 text-slate-700',
  'slate-dark': 'bg-slate-300 text-slate-800',
  amber: 'bg-amber-100 text-amber-800',
  cyan: 'bg-cyan-100 text-cyan-900',
  navy: 'bg-brand-100 text-navy',
  teal: 'bg-teal-100 text-teal-800',
}

export function Badge({ color = 'slate', children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tones[color] ?? tones.slate}`}>
      {children}
    </span>
  )
}

Badge.propTypes = {
  color: PropTypes.string,
  children: PropTypes.node,
}

const statusMap = {
  applied: { label: 'Applied', color: 'blue' },
  under_review: { label: 'Under review', color: 'sky' },
  in_review: { label: 'In review', color: 'sky' },
  shortlisted: { label: 'Shortlisted', color: 'green' },
  interview_scheduled: { label: 'Interview scheduled', color: 'violet' },
  selected: { label: 'Selected', color: 'emerald' },
  rejected: { label: 'Rejected', color: 'red-soft' },
  not_selected: { label: 'Not selected', color: 'red-soft' },
  draft: { label: 'Draft', color: 'slate' },
  published: { label: 'Published', color: 'green' },
  closed: { label: 'Closed', color: 'slate-dark' },
  scheduled: { label: 'Scheduled', color: 'violet' },
  completed: { label: 'Completed', color: 'sky' },
  passed: { label: 'Passed', color: 'green' },
}

/** The only place status colours are chosen in the UI. */
export function StatusBadge({ status }) {
  const item = statusMap[status] ?? { label: status, color: 'slate' }
  return <Badge color={item.color}>{item.label}</Badge>
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
}
