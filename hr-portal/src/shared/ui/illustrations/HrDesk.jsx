import { useId } from 'react'
import PropTypes from 'prop-types'

/**
 * HR portal welcome art: a candidate profile, a booked interview slot and the hiring pipeline,
 * floating as glass cards. Decorative.
 */
export function HrDeskIllustration({ className = '' }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 360 200" className={className} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#29B6F6" />
          <stop offset="1" stopColor="#0B4FA3" />
        </linearGradient>
        <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#071C3E" floodOpacity="0.14" />
        </filter>
      </defs>
      <circle cx="250" cy="96" r="88" fill="#29B6F6" opacity="0.10" />
      <circle cx="100" cy="150" r="52" fill="#9C6ADE" opacity="0.08" />

      {/* pipeline */}
      <g filter={`url(#${id}-s)`}>
        <rect x="18" y="38" width="150" height="128" rx="16" fill="#fff" />
        <rect x="32" y="52" width="58" height="7" rx="3.5" fill="#0B4FA3" />
        {[[96, '#1E88E5'], [74, '#29B6F6'], [50, '#22C3A6'], [30, '#F39223']].map(([w, c], i) => (
          <g key={c}>
            <rect x="32" y={72 + i * 21} width="122" height="12" rx="6" fill="#EEF4FB" />
            <rect x="32" y={72 + i * 21} width={w + 26} height="12" rx="6" fill={c} />
          </g>
        ))}
      </g>

      {/* candidate card */}
      <g filter={`url(#${id}-s)`}>
        <rect x="150" y="18" width="150" height="92" rx="16" fill="#fff" />
        <circle cx="178" cy="48" r="16" fill="#DCEBFB" />
        <circle cx="178" cy="44" r="7" fill="#D9A07A" />
        <path d="M166 58 q12 -10 24 0 v2 h-24Z" fill="#1E88E5" />
        <rect x="202" y="38" width="70" height="7" rx="3.5" fill="#1F3A68" />
        <rect x="202" y="51" width="48" height="6" rx="3" fill="#CBD5E1" />
        <rect x="166" y="76" width="44" height="16" rx="8" fill="#DCFCE7" />
        <rect x="174" y="82" width="28" height="4" rx="2" fill="#16A34A" />
        <rect x="216" y="76" width="48" height="16" rx="8" fill="#E0F2FE" />
        <rect x="224" y="82" width="32" height="4" rx="2" fill="#0284C7" />
      </g>

      {/* interview slot */}
      <g filter={`url(#${id}-s)`}>
        <rect x="206" y="104" width="136" height="80" rx="16" fill="#fff" />
        <rect x="206" y="104" width="136" height="24" rx="16" fill={`url(#${id}-b)`} />
        <rect x="206" y="116" width="136" height="12" fill={`url(#${id}-b)`} />
        <rect x="220" y="112" width="40" height="6" rx="3" fill="#fff" />
        {[0, 1, 2, 3, 4].map((d) => (
          <rect key={d} x={220 + d * 23} y="138" width="16" height="12" rx="4" fill={d === 2 ? '#F39223' : '#EEF4FB'} />
        ))}
        <rect x="220" y="160" width="76" height="12" rx="6" fill="#EEF4FB" />
        <circle cx="228" cy="166" r="3" fill="#22C3A6" />
        <rect x="236" y="164" width="50" height="4" rx="2" fill="#94A3B8" />
      </g>

      {/* sparkle */}
      <path d="M128 18 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3Z" fill="#F7B04B" />
      <path d="M332 70 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2Z" fill="#29B6F6" />
    </svg>
  )
}

HrDeskIllustration.propTypes = { className: PropTypes.string }
