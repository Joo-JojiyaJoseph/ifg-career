/** Sidebar footer: three people around a shared board, drawn in white on the brand gradient. */
export function BuildingTeamsIllustration(props) {
  return (
    <svg viewBox="0 0 200 130" fill="none" aria-hidden="true" {...props}>
      <ellipse cx="100" cy="118" rx="80" ry="8" fill="white" opacity="0.08" />
      <rect x="48" y="20" width="104" height="58" rx="10" fill="white" opacity="0.14" stroke="white" strokeOpacity="0.35" />
      <path d="M62 62l18-16 14 10 22-22 22 14" stroke="#7FD3FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="116" cy="34" r="4" fill="#F39223" />
      <g>
        <circle cx="46" cy="80" r="11" fill="#FDE7D6" />
        <path d="M35 77c1-10 21-11 22 0-6-4-16-4-22 0z" fill="#1F2937" />
        <path d="M26 118c0-20 9-30 20-30s20 10 20 30z" fill="#7FD3FF" />
      </g>
      <g>
        <circle cx="100" cy="90" r="12" fill="#E9C3A0" />
        <path d="M88 89c0-14 24-15 24 0 0 0-3-8-12-8s-12 8-12 8z" fill="#111827" />
        <path d="M78 122c0-21 10-32 22-32s22 11 22 32z" fill="white" />
      </g>
      <g>
        <circle cx="154" cy="80" r="11" fill="#C68B59" />
        <path d="M143 78c1-11 21-12 22 0-6-5-16-5-22 0z" fill="#374151" />
        <path d="M134 118c0-20 9-30 20-30s20 10 20 30z" fill="#B794F4" />
      </g>
    </svg>
  )
}
