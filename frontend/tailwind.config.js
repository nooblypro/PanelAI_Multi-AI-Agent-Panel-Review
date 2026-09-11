/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        'accent-technical': 'var(--accent-technical)',
        'accent-culture': 'var(--accent-culture)',
        'accent-hm': 'var(--accent-hm)',
        'accent-skeptic': 'var(--accent-skeptic)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '12px',
        sm: '8px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      keyframes: {
        doodleFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        doodleFloatSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        doodleSway: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        doodleFlutter: {
          '0%, 100%': { transform: 'rotate(-4deg) translateY(-2px)' },
          '50%': { transform: 'rotate(4deg) translateY(2px)' },
        },
        doodleSpinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        doodleTwinkle: {
          '0%, 100%': { opacity: '0.25', transform: 'scale(0.85)' },
          '50%': { opacity: '0.8', transform: 'scale(1.15)' },
        },
        doodlePulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.06)' },
        },
      },
      animation: {
        doodleFloat: 'doodleFloat 4s ease-in-out infinite',
        doodleFloatSlow: 'doodleFloatSlow 6s ease-in-out infinite',
        doodleSway: 'doodleSway 3.5s ease-in-out infinite',
        doodleFlutter: 'doodleFlutter 2.4s ease-in-out infinite',
        doodleSpinSlow: 'doodleSpinSlow 36s linear infinite',
        doodleTwinkle: 'doodleTwinkle 2.8s ease-in-out infinite',
        doodlePulse: 'doodlePulse 3.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
