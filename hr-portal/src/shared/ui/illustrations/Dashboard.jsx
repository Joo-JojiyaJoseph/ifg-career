/** Portal sign-in: an HR dashboard on a laptop with floating cards (applicants, interviews, a hire). */
export function DashboardIllustration(props) {
  return (
    <svg viewBox="0 0 460 340" fill="none" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="db-screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E8F2FE" />
        </linearGradient>
        <linearGradient id="db-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1E88E5" stopOpacity="0.45" />
          <stop offset="1" stopColor="#1E88E5" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="230" cy="306" rx="190" ry="16" fill="#020C28" opacity="0.25" />
      <rect x="70" y="58" width="320" height="206" rx="16" fill="#0A3D85" />
      <rect x="82" y="70" width="296" height="182" rx="10" fill="url(#db-screen)" />
      <rect x="82" y="70" width="58" height="182" rx="10" fill="#0B4FA3" />
      <rect x="94" y="88" width="34" height="8" rx="4" fill="white" opacity="0.8" />
      <rect x="94" y="110" width="34" height="6" rx="3" fill="white" opacity="0.35" />
      <rect x="94" y="124" width="28" height="6" rx="3" fill="white" opacity="0.35" />
      <rect x="94" y="138" width="30" height="6" rx="3" fill="white" opacity="0.35" />
      <rect x="152" y="84" width="66" height="40" rx="8" fill="white" stroke="#DCEBFB" />
      <rect x="226" y="84" width="66" height="40" rx="8" fill="white" stroke="#DCEBFB" />
      <rect x="300" y="84" width="66" height="40" rx="8" fill="white" stroke="#DCEBFB" />
      <rect x="160" y="94" width="26" height="6" rx="3" fill="#94A3B8" /><rect x="160" y="106" width="36" height="10" rx="3" fill="#1F3A68" />
      <rect x="234" y="94" width="26" height="6" rx="3" fill="#94A3B8" /><rect x="234" y="106" width="30" height="10" rx="3" fill="#1F3A68" />
      <rect x="308" y="94" width="26" height="6" rx="3" fill="#94A3B8" /><rect x="308" y="106" width="34" height="10" rx="3" fill="#1F3A68" />
      <path d="M156 226c20-14 34-30 56-26s30-24 52-30 34 14 54 6 26-24 46-30v80H156z" fill="url(#db-area)" />
      <path d="M156 226c20-14 34-30 56-26s30-24 52-30 34 14 54 6 26-24 46-30" stroke="#1E88E5" strokeWidth="3" strokeLinecap="round" />
      <path d="M40 264h380l-22 18H62z" fill="#1F3A68" />
      <g transform="translate(14 30)">
        <rect width="118" height="58" rx="14" fill="white" opacity="0.94" />
        <circle cx="26" cy="29" r="14" fill="#DCEBFB" /><path d="M20 30a6 6 0 1 1 12 0v6H20z" fill="#1976D2" />
        <rect x="48" y="18" width="52" height="7" rx="3.5" fill="#94A3B8" /><rect x="48" y="31" width="40" height="11" rx="4" fill="#1F3A68" />
      </g>
      <g transform="translate(330 178)">
        <rect width="118" height="62" rx="14" fill="white" opacity="0.94" />
        <circle cx="24" cy="31" r="13" fill="#DCFCE7" /><path d="M18 31l4 4 8-9" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="46" y="20" width="56" height="7" rx="3.5" fill="#94A3B8" /><rect x="46" y="33" width="36" height="11" rx="4" fill="#16A34A" opacity="0.8" />
      </g>
      <g transform="translate(316 14)">
        <rect width="112" height="52" rx="14" fill="white" opacity="0.94" />
        <rect x="14" y="14" width="24" height="24" rx="7" fill="#FEF3C7" /><rect x="19" y="21" width="14" height="10" rx="2" stroke="#F59E0B" strokeWidth="2" />
        <rect x="46" y="16" width="50" height="7" rx="3.5" fill="#94A3B8" /><rect x="46" y="28" width="34" height="10" rx="4" fill="#1F3A68" />
      </g>
    </svg>
  )
}
