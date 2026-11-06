import { useId } from 'react'
import PropTypes from 'prop-types'

/*
 * One illustration per entity, each showing the real work of that company:
 * Infolks annotates images, Webfolks builds web and mobile software, Dataways collects AI datasets,
 * Medrays labels medical scans with doctors. All share a 320×220 canvas, soft glass panels and
 * take the entity's own colours, so they sit together as one family.
 */

const defaults = {
  infolks: ['#1976D2', '#29B6F6'],
  webfolks: ['#0F766E', '#2DD4BF'],
  dataways: ['#6D28D9', '#A78BFA'],
  medrays: ['#0E7490', '#22D3EE'],
}

function Frame({ id, primary, accent, children, label, className }) {
  return (
    <svg viewBox="0 0 320 220" className={className} role="img" aria-label={label} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={primary} stopOpacity="0.16" />
          <stop offset="1" stopColor={accent} stopOpacity="0.10" />
        </linearGradient>
        <linearGradient id={`${id}-brand`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={accent} />
          <stop offset="1" stopColor={primary} />
        </linearGradient>
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#071C3E" floodOpacity="0.16" />
        </filter>
      </defs>
      <rect width="320" height="220" rx="22" fill={`url(#${id}-bg)`} />
      <circle cx="286" cy="28" r="58" fill={accent} opacity="0.14" />
      <circle cx="26" cy="206" r="46" fill={primary} opacity="0.10" />
      {children}
    </svg>
  )
}

Frame.propTypes = {
  id: PropTypes.string.isRequired,
  primary: PropTypes.string.isRequired,
  accent: PropTypes.string.isRequired,
  children: PropTypes.node,
  label: PropTypes.string.isRequired,
  className: PropTypes.string,
}

/** Infolks: a street photo with annotation boxes, labels and a class list. */
export function AnnotationArt({ primary = defaults.infolks[0], accent = defaults.infolks[1], className = '' }) {
  const id = useId().replace(/:/g, '')
  return (
    <Frame id={id} primary={primary} accent={accent} className={className} label="Image annotation: a street photo with labelled boxes around a car and a person">
      <g filter={`url(#${id}-shadow)`}>
        <rect x="22" y="26" width="196" height="150" rx="14" fill="#fff" />
        <clipPath id={`${id}-photo`}><rect x="30" y="34" width="180" height="134" rx="9" /></clipPath>
        <g clipPath={`url(#${id}-photo)`}>
          <rect x="30" y="34" width="180" height="134" fill="#DCEBFB" />
          <rect x="30" y="34" width="180" height="70" fill="#BFDCF8" />
          <circle cx="182" cy="58" r="12" fill="#FFE29A" />
          <path d="M30 104 L72 74 L102 92 L138 66 L174 90 L210 76 L210 110 L30 110Z" fill="#9CC3EE" />
          <rect x="30" y="110" width="180" height="58" fill="#7E93AE" />
          <rect x="30" y="134" width="180" height="4" fill="#fff" opacity="0.7" />
          {/* car */}
          <path d="M58 128 q4 -16 18 -18 h34 q14 2 20 18 v10 h-72Z" fill={primary} />
          <rect x="74" y="114" width="18" height="10" rx="2" fill="#E8F3FF" />
          <rect x="96" y="114" width="18" height="10" rx="2" fill="#E8F3FF" />
          <circle cx="74" cy="140" r="7" fill="#1F2A3D" /><circle cx="116" cy="140" r="7" fill="#1F2A3D" />
          {/* person */}
          <circle cx="164" cy="104" r="6" fill="#F2B48C" />
          <rect x="157" y="111" width="14" height="22" rx="6" fill="#F39223" />
          <rect x="158" y="131" width="5" height="16" rx="2" fill="#24324A" /><rect x="165" y="131" width="5" height="16" rx="2" fill="#24324A" />
        </g>
        {/* boxes */}
        <rect x="52" y="104" width="86" height="46" rx="3" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="2" strokeDasharray="5 3" />
        <rect x="52" y="93" width="44" height="12" rx="3" fill={accent} />
        <rect x="56" y="97" width="24" height="4" rx="2" fill="#fff" />
        <rect x="150" y="94" width="28" height="58" rx="3" fill="#F39223" fillOpacity="0.12" stroke="#F39223" strokeWidth="2" strokeDasharray="5 3" />
        <rect x="150" y="83" width="38" height="12" rx="3" fill="#F39223" />
        <rect x="154" y="87" width="20" height="4" rx="2" fill="#fff" />
        {[[52, 104], [138, 104], [52, 150], [138, 150]].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x - 3} y={y - 3} width="6" height="6" rx="1.5" fill="#fff" stroke={accent} strokeWidth="1.5" />
        ))}
      </g>
      {/* class list */}
      <g filter={`url(#${id}-shadow)`}>
        <rect x="230" y="46" width="72" height="112" rx="14" fill="#fff" fillOpacity="0.92" />
        {[[accent, 64], ['#F39223', 86], [primary, 108], ['#22C3A6', 130]].map(([c, y], i) => (
          <g key={y}>
            <circle cx="244" cy={y} r="4.5" fill={c} />
            <rect x="254" y={y - 3} width={36 - i * 4} height="6" rx="3" fill="#CBD5E1" />
          </g>
        ))}
      </g>
      {/* cursor */}
      <path d="M196 156 l0 24 l6 -6 l5 11 l5 -2 l-5 -11 l9 0Z" fill="#071C3E" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
    </Frame>
  )
}

/** Webfolks: a code editor beside a live website, with a phone build in front. */
export function CodeArt({ primary = defaults.webfolks[0], accent = defaults.webfolks[1], className = '' }) {
  const id = useId().replace(/:/g, '')
  const code = [
    [12, 34, accent], [12, 52, '#A78BFA'], [24, 40, '#F7B04B'], [24, 26, '#CBD5E1'], [36, 48, accent], [24, 30, '#F7B04B'], [12, 22, '#A78BFA'], [12, 44, '#CBD5E1'],
  ]
  return (
    <Frame id={id} primary={primary} accent={accent} className={className} label="Web and software: a code editor next to a finished website and a phone app">
      <g filter={`url(#${id}-shadow)`}>
        <rect x="18" y="28" width="236" height="152" rx="14" fill="#fff" />
        <rect x="18" y="28" width="236" height="22" rx="14" fill="#F1F5F9" />
        <rect x="18" y="40" width="236" height="10" fill="#F1F5F9" />
        <circle cx="32" cy="39" r="3.5" fill="#F87171" /><circle cx="44" cy="39" r="3.5" fill="#FBBF24" /><circle cx="56" cy="39" r="3.5" fill="#34D399" />
        <rect x="74" y="34" width="110" height="10" rx="5" fill="#fff" />
        {/* editor */}
        <rect x="26" y="58" width="98" height="114" rx="8" fill="#0B1B33" />
        {code.map(([x, w, c], i) => (
          <rect key={i} x={34 + x} y={68 + i * 12.5} width={w} height="5" rx="2.5" fill={c} opacity="0.95" />
        ))}
        <rect x="34" y="68" width="6" height="96" rx="2" fill="#fff" opacity="0.06" />
        {/* preview */}
        <rect x="132" y="58" width="114" height="114" rx="8" fill="#F8FAFC" />
        <rect x="140" y="66" width="98" height="40" rx="6" fill={`url(#${id}-brand)`} />
        <rect x="148" y="76" width="50" height="6" rx="3" fill="#fff" />
        <rect x="148" y="87" width="34" height="5" rx="2.5" fill="#fff" opacity="0.7" />
        <rect x="140" y="114" width="30" height="24" rx="5" fill="#E2E8F0" />
        <rect x="174" y="114" width="30" height="24" rx="5" fill="#E2E8F0" />
        <rect x="208" y="114" width="30" height="24" rx="5" fill="#E2E8F0" />
        <rect x="140" y="146" width="62" height="6" rx="3" fill="#CBD5E1" />
        <rect x="140" y="157" width="44" height="6" rx="3" fill="#E2E8F0" />
      </g>
      {/* phone */}
      <g filter={`url(#${id}-shadow)`}>
        <rect x="236" y="92" width="64" height="110" rx="14" fill="#0B1B33" />
        <rect x="241" y="99" width="54" height="96" rx="10" fill="#fff" />
        <rect x="258" y="102" width="20" height="4" rx="2" fill="#0B1B33" />
        <rect x="247" y="112" width="42" height="26" rx="6" fill={`url(#${id}-brand)`} />
        <rect x="247" y="144" width="42" height="7" rx="3.5" fill="#E2E8F0" />
        <rect x="247" y="156" width="30" height="7" rx="3.5" fill="#E2E8F0" />
        <rect x="247" y="172" width="42" height="14" rx="7" fill={primary} />
      </g>
      {/* tag */}
      <g filter={`url(#${id}-shadow)`}>
        <rect x="104" y="160" width="56" height="34" rx="12" fill="#fff" />
        <path d="M120 172 l-6 5 l6 5 M136 172 l6 5 l-6 5 M131 170 l-6 14" stroke={primary} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </Frame>
  )
}

/** Dataways: dataset tiles for images, audio, text and 3D point clouds filling up a collection. */
export function DataArt({ primary = defaults.dataways[0], accent = defaults.dataways[1], className = '' }) {
  const id = useId().replace(/:/g, '')
  const bars = [10, 22, 34, 18, 40, 28, 14, 36, 24, 12, 30, 20]
  // A LiDAR-style dotted terrain: rows recede and rise gently, like a scanned street.
  const cloud = []
  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 19; col += 1) {
      const x = 126 + col * 9 + row * 3
      const y = 184 - row * 10 - Math.sin(col * 0.55 + row) * 3
      cloud.push([x, y, 1.1 + row * 0.18, row])
    }
  }
  return (
    <Frame id={id} primary={primary} accent={accent} className={className} label="AI data collection: image, audio, text and 3D point cloud datasets being gathered">
      <g filter={`url(#${id}-shadow)`}>
        {/* image tile */}
        <rect x="20" y="24" width="88" height="80" rx="14" fill="#fff" />
        <rect x="28" y="32" width="72" height="50" rx="8" fill="#EDE9FE" />
        <path d="M28 76 L52 54 L68 68 L80 58 L100 76 V82 H28Z" fill={accent} opacity="0.8" />
        <circle cx="86" cy="44" r="6" fill="#FDE68A" />
        <rect x="28" y="88" width="40" height="6" rx="3" fill="#CBD5E1" />
        {/* audio tile */}
        <rect x="116" y="24" width="96" height="80" rx="14" fill="#fff" />
        {bars.map((h, i) => (
          <rect key={i} x={126 + i * 6.6} y={64 - h / 2} width="3.6" height={h} rx="1.8" fill={i < 7 ? primary : '#CBD5E1'} />
        ))}
        <rect x="126" y="88" width="46" height="6" rx="3" fill="#CBD5E1" />
        {/* text tile */}
        <rect x="20" y="112" width="88" height="84" rx="14" fill="#fff" />
        {[52, 66, 44, 60, 36].map((w, i) => (
          <rect key={i} x="30" y={124 + i * 12} width={w} height="5" rx="2.5" fill={i === 1 ? accent : '#CBD5E1'} />
        ))}
        {/* point cloud tile */}
        <rect x="116" y="112" width="184" height="84" rx="14" fill="#0B1B33" />
        {cloud.map(([x, y, r, row], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={row > 3 ? '#fff' : accent} opacity={0.35 + row * 0.1} />
        ))}
        {/* 3D box around a scanned object */}
        <g stroke={accent} strokeWidth="1.6" fill="none" strokeLinejoin="round">
          <rect x="196" y="132" width="44" height="30" rx="2" fill={accent} fillOpacity="0.16" />
          <rect x="210" y="122" width="44" height="30" rx="2" strokeDasharray="3 2" />
          <path d="M196 132 L210 122 M240 132 L254 122 M240 162 L254 152 M196 162 L210 152" />
        </g>
        <rect x="196" y="118" width="30" height="10" rx="3" fill={accent} />
        <rect x="200" y="121.5" width="18" height="3" rx="1.5" fill="#0B1B33" opacity="0.7" />
      </g>
      {/* collection progress */}
      <g filter={`url(#${id}-shadow)`}>
        <rect x="220" y="24" width="82" height="80" rx="14" fill="#fff" />
        <circle cx="261" cy="58" r="22" fill="none" stroke="#EDE9FE" strokeWidth="8" />
        <circle cx="261" cy="58" r="22" fill="none" stroke={`url(#${id}-brand)`} strokeWidth="8" strokeLinecap="round" strokeDasharray="104 139" transform="rotate(-90 261 58)" />
        <path d="M252 58 l6 6 l11 -12" stroke={primary} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="236" y="88" width="50" height="6" rx="3" fill="#CBD5E1" />
      </g>
    </Frame>
  )
}

/** Medrays: a chest X-ray with a doctor's annotation, and the reviewing doctor. */
export function MedicalArt({ primary = defaults.medrays[0], accent = defaults.medrays[1], className = '' }) {
  const id = useId().replace(/:/g, '')
  return (
    <Frame id={id} primary={primary} accent={accent} className={className} label="Medical data labeling: a chest X-ray annotated and reviewed by a doctor">
      <defs>
        <radialGradient id={`${id}-xray`} cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#3A5578" />
          <stop offset="1" stopColor="#0B1B33" />
        </radialGradient>
      </defs>
      <g filter={`url(#${id}-shadow)`}>
        <rect x="22" y="22" width="178" height="176" rx="16" fill={`url(#${id}-xray)`} />
        {/* lungs and ribs */}
        <path d="M78 60 q-30 20 -26 74 q2 22 24 22 q14 -2 16 -20 v-64 q-2 -14 -14 -12Z" fill="#9FB7D6" opacity="0.55" />
        <path d="M144 60 q30 20 26 74 q-2 22 -24 22 q-14 -2 -16 -20 v-64 q2 -14 14 -12Z" fill="#9FB7D6" opacity="0.55" />
        <rect x="107" y="44" width="8" height="124" rx="4" fill="#DCE7F5" opacity="0.7" />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} stroke="#DCE7F5" strokeWidth="3" fill="none" opacity="0.55" strokeLinecap="round">
            <path d={`M107 ${70 + i * 18} q-26 -4 -44 ${10 + i}`} />
            <path d={`M115 ${70 + i * 18} q26 -4 44 ${10 + i}`} />
          </g>
        ))}
        {/* annotation */}
        <path d="M140 96 l18 -6 l12 12 l-4 20 l-18 4 l-12 -12Z" fill={accent} fillOpacity="0.2" stroke={accent} strokeWidth="2" strokeLinejoin="round" />
        {[[140, 96], [158, 90], [170, 102], [166, 122], [148, 126], [136, 114]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="#fff" stroke={accent} strokeWidth="1.5" />
        ))}
        <rect x="128" y="138" width="58" height="16" rx="5" fill={accent} />
        <rect x="134" y="144" width="34" height="4" rx="2" fill="#0B1B33" opacity="0.7" />
        <rect x="32" y="32" width="38" height="8" rx="4" fill="#fff" opacity="0.25" />
      </g>
      {/* doctor card */}
      <g filter={`url(#${id}-shadow)`}>
        <rect x="212" y="40" width="90" height="140" rx="16" fill="#fff" />
        <circle cx="257" cy="76" r="20" fill="#E0F2FE" />
        <circle cx="257" cy="72" r="9" fill="#F2B48C" />
        <path d="M241 92 q16 -14 32 0 v4 h-32Z" fill="#fff" stroke="#CBD5E1" />
        <path d="M250 86 q-4 10 4 12 M264 86 q4 10 -4 12" stroke={primary} strokeWidth="2" fill="none" />
        <rect x="230" y="108" width="54" height="6" rx="3" fill="#CBD5E1" />
        <rect x="238" y="120" width="38" height="5" rx="2.5" fill="#E2E8F0" />
        {[136, 152].map((y) => (
          <g key={y}>
            <rect x="226" y={y} width="12" height="12" rx="3" fill={primary} />
            <path d={`M229 ${y + 6} l2.5 2.5 l4 -5`} stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="244" y={y + 3} width="44" height="6" rx="3" fill="#E2E8F0" />
          </g>
        ))}
      </g>
      {/* pulse */}
      <path d="M212 200 h26 l6 -12 l8 22 l6 -16 l4 6 h44" stroke={primary} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </Frame>
  )
}

const bySlug = { infolks: AnnotationArt, webfolks: CodeArt, dataways: DataArt, medrays: MedicalArt }
const fallbackOrder = [AnnotationArt, CodeArt, DataArt, MedicalArt]

/**
 * The illustration for an entity, coloured with its theme. Unknown entities get one of the four by position.
 */
export function EntityArt({ entity, index = 0, className = '' }) {
  const Art = bySlug[entity?.slug] ?? fallbackOrder[index % fallbackOrder.length]
  const [p, a] = defaults[entity?.slug] ?? defaults.infolks
  return <Art primary={entity?.theme?.primary ?? p} accent={entity?.theme?.accent ?? a} className={className} />
}

EntityArt.propTypes = { entity: PropTypes.object, index: PropTypes.number, className: PropTypes.string }

const artProps = { primary: PropTypes.string, accent: PropTypes.string, className: PropTypes.string }
AnnotationArt.propTypes = artProps
CodeArt.propTypes = artProps
DataArt.propTypes = artProps
MedicalArt.propTypes = artProps
