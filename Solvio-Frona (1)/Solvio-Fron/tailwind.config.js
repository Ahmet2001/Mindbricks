/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366F1',
          50: '#EEEEFF',
          100: '#D4D4FE',
          200: '#A5A6FC',
          300: '#8183F9',
          400: '#6366F1',
          500: '#4F46E5',
          600: '#4338CA',
          700: '#3730A3',
          800: '#312E81',
          900: '#1E1B4B',
        },
        accent: {
          DEFAULT: '#8B5CF6',
          50: '#F3EEFF',
          100: '#E0D4FE',
          200: '#C4A6FC',
          300: '#A78BFA',
          400: '#8B5CF6',
          500: '#7C3AED',
          600: '#6D28D9',
          700: '#5B21B6',
          800: '#4C1D95',
          900: '#3B0764',
        },
        dark: {
          DEFAULT: '#0F172A',
          50: '#1E293B',
          100: '#1A2332',
          200: '#162030',
          300: '#131C2D',
          400: '#0F172A',
          500: '#0C1322',
          600: '#080E1A',
          700: '#050A13',
          800: '#03060C',
          900: '#010305',
        },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #312E81 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-lg': '0 0 40px rgba(99, 102, 241, 0.4)',
        'glow-accent': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.36)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite alternate',
        'aurora': 'aurora 8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glowPulse: {
          '0%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)' },
        },
        aurora: {
          '0%, 100%': { opacity: '0.3', transform: 'translateX(0) translateY(0) scale(1)' },
          '33%': { opacity: '0.5', transform: 'translateX(30px) translateY(-50px) scale(1.1)' },
          '66%': { opacity: '0.4', transform: 'translateX(-20px) translateY(20px) scale(0.9)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
