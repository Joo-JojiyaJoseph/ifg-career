/** Quick apply: a resume card taking off as a paper plane, with a dotted flight path. */
export function PaperPlaneIllustration(props) {
  return (
    <svg viewBox="0 0 320 240" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="pp-wing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#CFE6FF" />
        </linearGradient>
        <linearGradient id="pp-card" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <path d="M36 196c40-6 70-30 96-62s58-56 118-60" stroke="white" strokeOpacity="0.55" strokeWidth="2.5" strokeDasharray="3 9" strokeLinecap="round" />
      <g transform="translate(24 120) rotate(-8)">
        <rect width="104" height="128" rx="14" fill="url(#pp-card)" />
        <circle cx="26" cy="28" r="12" fill="#1E88E5" opacity="0.85" />
        <rect x="46" y="20" width="44" height="7" rx="3.5" fill="#1F3A68" opacity="0.7" />
        <rect x="46" y="32" width="30" height="6" rx="3" fill="#94A3B8" />
        <rect x="14" y="54" width="76" height="6" rx="3" fill="#CBD5E1" />
        <rect x="14" y="66" width="64" height="6" rx="3" fill="#CBD5E1" />
        <rect x="14" y="78" width="70" height="6" rx="3" fill="#CBD5E1" />
        <rect x="14" y="98" width="40" height="14" rx="7" fill="#F39223" />
      </g>
      <g transform="translate(206 30)">
        <path d="M0 52L92 0 70 86 44 62z" fill="url(#pp-wing)" />
        <path d="M44 62L92 0 34 70z" fill="#9FCBFF" />
        <path d="M34 70l10-8 4 24z" fill="#5AA9F5" />
      </g>
      <circle cx="270" cy="168" r="5" fill="#FFC233" />
      <circle cx="292" cy="140" r="3" fill="white" opacity="0.7" />
      <circle cx="160" cy="48" r="4" fill="white" opacity="0.6" />
    </svg>
  )
}
