import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline'
import { AnimatedNumber } from './Motion'
import { Skeleton } from './Skeleton'
import { Sparkline } from './Sparkline'
import { useSpotlight } from '../hooks/useSpotlight'

const tones = {
  blue: { circle: 'from-brand-400 to-brand-700 shadow-brand-500/30', line: '#1E88E5', spot: 'rgba(30,136,229,0.14)' },
  cyan: { circle: 'from-cyan-300 to-cyan-600 shadow-cyan-500/30', line: '#29B6F6', spot: 'rgba(41,182,246,0.16)' },
  amber: { circle: 'from-amber-300 to-accent-orange shadow-amber-500/30', line: '#F59E0B', spot: 'rgba(245,158,11,0.16)' },
  teal: { circle: 'from-teal-300 to-teal-600 shadow-teal-500/30', line: '#22C3A6', spot: 'rgba(34,195,166,0.16)' },
}

/**
 * Dashboard stat: tinted icon, big number, trend against the previous period and a sparkline.
 */
export function StatCard({ icon: Icon, label, value, delta, deltaKind = 'percent', period, spark = [], tone = 'blue', to, loading = false }) {
  const colours = tones[tone] ?? tones.blue
  const spot = useSpotlight()
  const up = (delta ?? 0) >= 0
  const Arrow = up ? ArrowUpIcon : ArrowDownIcon
  const body = (
    <div
      {...spot}
      className="glass spotlight group flex h-full flex-col gap-3 rounded-3xl p-5 transition duration-200 hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-lift"
      style={{ '--spot-color': colours.spot }}
    >
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition duration-200 group-hover:scale-105 ${colours.circle}`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="min-w-0 text-sm font-semibold leading-tight text-navy">{label}</p>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          {loading ? <Skeleton className="h-9 w-20" /> : (
            <p className="font-display text-3xl font-semibold leading-none tracking-tight text-ink"><AnimatedNumber value={value ?? 0} /></p>
          )}
          {!loading && delta !== undefined && delta !== null ? (
            <p className={`mt-2 flex items-center gap-1 whitespace-nowrap text-xs ${up ? 'text-success' : 'text-danger'}`}>
              <Arrow className="h-3.5 w-3.5" aria-hidden="true" />
              {up ? '+' : ''}{delta}{deltaKind === 'percent' ? '%' : ''} <span className="text-muted">{period}</span>
            </p>
          ) : null}
        </div>
        {!loading ? <div className="shrink-0"><Sparkline values={spark} color={colours.line} width={88} height={40} /></div> : null}
      </div>
    </div>
  )

  return to ? <Link to={to} className="block h-full rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">{body}</Link> : body
}

StatCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.number,
  delta: PropTypes.number,
  deltaKind: PropTypes.oneOf(['percent', 'count']),
  period: PropTypes.string,
  spark: PropTypes.arrayOf(PropTypes.number),
  tone: PropTypes.oneOf(['blue', 'cyan', 'amber', 'teal']),
  to: PropTypes.string,
  loading: PropTypes.bool,
}
