/** Shared design tokens for the careers site and the HR portal. */

const preset = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF5FD',
          100: '#DCEBFB',
          500: '#1E88E5',
          600: '#1976D2',
          700: '#0B4FA3',
          900: '#0A3D85',
        },
        navy: '#1F3A68',
        accent: {
          orange: '#F39223',
        },
        cyan: '#29B6F6',
        teal: '#22C3A6',
        amber: '#FFC233',
        violet: '#9C6ADE',
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
      },
      animation: {
        float: 'float 16s ease-in-out infinite',
        shimmer: 'shimmer 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default preset
