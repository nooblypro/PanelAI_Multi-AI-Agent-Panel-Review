/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0C10',
        surface: '#14161C',
        'surface-2': '#1C1F27',
        border: 'rgba(255,255,255,0.08)',
        text: '#F5F5F7',
        muted: '#9096A6',
        'accent-technical': '#4C8DFF',
        'accent-culture': '#34D399',
        'accent-hm': '#F5B841',
        'accent-skeptic': '#F87171',
        success: '#34D399',
        warning: '#FBBF24',
        danger: '#F87171',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '6px',
      },
    },
  },
  plugins: [],
};
