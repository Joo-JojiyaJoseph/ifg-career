/** Shared design tokens for the careers site and the HR portal. */
import colors from 'tailwindcss/colors'

const preset = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF5FD',
          100: '#DCEBFB',
          200: '#B6D6F6',
          300: '#82B9EE',
          400: '#42A0EA',
          500: '#1E88E5',
          600: '#1976D2',
          700: '#0B4FA3',
          800: '#0A4594',
          900: '#0A3D85',
        },
        navy: '#1F3A68',
        ink: '#071C3E',
        accent: {
          orange: '#F39223',
        },
        // Brand accents are the DEFAULT shade; the full Tailwind scale stays available (bg-teal-100 etc.).
        cyan: { ...colors.cyan, DEFAULT: '#29B6F6' },
        teal: { ...colors.teal, DEFAULT: '#22C3A6' },
        amber: { ...colors.amber, DEFAULT: '#FFC233' },
        violet: { ...colors.violet, DEFAULT: '#9C6ADE' },
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
        info: '#0EA5E9',
        card: '#FFFFFF',
        border: '#E2E8F0',
        text: '#0F172A',
        muted: '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 30px rgba(25,118,210,0.08)',
        'card-hover': '0 12px 40px rgba(25,118,210,0.16)',
        glow: '0 0 24px rgba(30,136,229,0.45)',
        glass: '0 1px 0 0 rgba(255,255,255,0.65) inset, 0 12px 40px -8px rgba(11,79,163,0.18)',
        'glass-dark': '0 1px 0 0 rgba(255,255,255,0.18) inset, 0 20px 50px -12px rgba(2,12,40,0.55)',
        lift: '0 24px 60px -20px rgba(11,79,163,0.35)',
      },
      backgroundImage: {
        dots: 'radial-gradient(rgba(31,58,104,0.10) 1px, transparent 1px)',
        'dots-light': 'radial-gradient(rgba(255,255,255,0.16) 1px, transparent 1px)',
        'brand-sheen': 'linear-gradient(135deg, #0B4FA3 0%, #1976D2 45%, #0A3D85 100%)',
      },
      backgroundSize: {
        dots: '22px 22px',
      },
      letterSpacing: {
        tightest: '-0.035em',
      },
      borderRadius: {
        card: '1rem',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        aurora: {
          '0%': { transform: 'translate3d(-8%, -6%, 0) rotate(0deg) scale(1)' },
          '33%': { transform: 'translate3d(6%, -10%, 0) rotate(40deg) scale(1.08)' },
          '66%': { transform: 'translate3d(-4%, 8%, 0) rotate(-20deg) scale(0.96)' },
          '100%': { transform: 'translate3d(-8%, -6%, 0) rotate(0deg) scale(1)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shine: {
          '0%': { transform: 'translateX(-120%) skewX(-20deg)' },
          '100%': { transform: 'translateX(220%) skewX(-20deg)' },
        },
        'border-spin': {
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        // Slow drift and zoom on full-bleed photos.
        'ken-burns': {
          '0%': { transform: 'scale(1.12) translate3d(-1.5%, -1%, 0)' },
          '100%': { transform: 'scale(1) translate3d(0, 0, 0)' },
        },
        heartbeat: {
          '0%, 40%, 100%': { transform: 'scale(1)' },
          '10%, 30%': { transform: 'scale(1.18)' },
          '20%': { transform: 'scale(0.96)' },
        },
        'scroll-cue': {
          '0%': { transform: 'translateY(-4px)', opacity: '0' },
          '40%': { opacity: '1' },
          '100%': { transform: 'translateY(10px)', opacity: '0' },
        },
        // Table rows and list items settle in one after another (delay from --row-delay).
        'row-in': {
          '0%': { transform: 'translateY(6px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        float: 'float 16s ease-in-out infinite',
        'float-slow': 'float 22s ease-in-out infinite',
        shimmer: 'shimmer 1.4s ease-in-out infinite',
        aurora: 'aurora 28s ease-in-out infinite',
        'aurora-slow': 'aurora 40s ease-in-out infinite reverse',
        marquee: 'marquee 40s linear infinite',
        shine: 'shine 0.9s ease-out',
        'border-spin': 'border-spin 8s linear infinite',
        'pulse-ring': 'pulse-ring 2.4s ease-out infinite',
        'ken-burns': 'ken-burns 18s ease-out both',
        heartbeat: 'heartbeat 2.2s ease-in-out infinite',
        'scroll-cue': 'scroll-cue 1.8s ease-in-out infinite',
        'row-in': 'row-in 220ms ease-out var(--row-delay, 0ms) both',
      },
    },
  },
  plugins: [],
}

export default preset
