/** Empty states: stacked cards and a magnifying glass. */
export function EmptySearchIllustration(props) {
  return (
    <svg viewBox="0 0 200 140" fill="none" aria-hidden="true" {...props}>
      <ellipse cx="100" cy="128" rx="70" ry="7" fill="#1F3A68" opacity="0.07" />
      <rect x="44" y="34" width="96" height="70" rx="12" fill="#DCEBFB" transform="rotate(-6 92 69)" />
      <rect x="54" y="26" width="96" height="74" rx="12" fill="white" stroke="#DCEBFB" strokeWidth="2" />
      <circle cx="74" cy="48" r="9" fill="#1E88E5" opacity="0.25" />
      <rect x="90" y="42" width="44" height="6" rx="3" fill="#1F3A68" opacity="0.35" />
      <rect x="90" y="53" width="30" height="5" rx="2.5" fill="#94A3B8" opacity="0.6" />
      <rect x="66" y="70" width="72" height="5" rx="2.5" fill="#CBD5E1" />
      <rect x="66" y="80" width="56" height="5" rx="2.5" fill="#CBD5E1" />
      <circle cx="146" cy="92" r="20" fill="white" stroke="#1976D2" strokeWidth="6" />
      <path d="M160 106l16 16" stroke="#1976D2" strokeWidth="8" strokeLinecap="round" />
      <circle cx="40" cy="30" r="4" fill="#F39223" />
      <circle cx="170" cy="40" r="3" fill="#22C3A6" />
    </svg>
  )
}
