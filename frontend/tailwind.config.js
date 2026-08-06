/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Neutral surface/text scale (was "navy") — clean slate, not tinted.
        navy: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        // Primary brand color (was "emerald") — indigo.
        emerald: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        // Secondary accent (was "cyan") — sky.
        cyan: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
        violet: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        // Warning accent (was "orange") — amber.
        orange: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        // Danger accent (was "pink") — rose.
        pink: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE123C',
          800: '#9F1239',
          900: '#881337',
        },
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-delayed': 'float 7s ease-in-out infinite 2s',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'scan': 'scan 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'blob': 'blob 8s ease-in-out infinite',
        'blob2': 'blob 10s ease-in-out infinite 2s',
        'blob3': 'blob 12s ease-in-out infinite 4s',
        'spin-slow': 'spin 12s linear infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'typing': 'typing 1.4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-16px) rotate(2deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 30px) scale(0.9)' },
        },
        blob2: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1) rotate(0deg)' },
          '25%': { transform: 'translate(-40px, 30px) scale(1.05) rotate(5deg)' },
          '75%': { transform: 'translate(30px, -40px) scale(0.95) rotate(-5deg)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        typing: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-6px)' },
        },
      },
      boxShadow: {
        // Clean, restrained elevation — no colored glow blur.
        'glass': '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        'glass-lg': '0 4px 6px rgba(15, 23, 42, 0.04), 0 10px 20px rgba(15, 23, 42, 0.08)',
        'glow-emerald': '0 8px 20px rgba(79, 70, 229, 0.18)',
        'glow-cyan': '0 8px 20px rgba(2, 132, 199, 0.16)',
        'glow-violet': '0 8px 20px rgba(124, 58, 237, 0.16)',
        'glow-orange': '0 8px 20px rgba(217, 119, 6, 0.16)',
        'glow-pink': '0 8px 20px rgba(225, 29, 72, 0.16)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      },
      borderRadius: {
        '2xl': '12px',
        '3xl': '16px',
        '4xl': '24px',
        '5xl': '32px',
      },
    },
  },
  plugins: [],
}
