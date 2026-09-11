/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Fredoka"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        hand: ['"Patrick Hand"', '"Comic Sans MS"', 'cursive'],
      },
      colors: {
        ink: {
          DEFAULT: '#1f2233',
          soft: '#3a3f57',
        },
        paper: {
          DEFAULT: '#fffdf7',
          50: '#fffdf7',
          100: '#fbf6e9',
          200: '#f5edd4',
        },
        sky: {
          DEFAULT: '#2f6fed',
          dark: '#1d54c4',
          soft: '#e8f0ff',
        },
        leaf: {
          DEFAULT: '#1f9d63',
          dark: '#167a4d',
          soft: '#e3f7ec',
        },
        sun: {
          DEFAULT: '#f6a623',
          dark: '#d98512',
          soft: '#fff3da',
        },
        coral: {
          DEFAULT: '#e8624a',
          dark: '#c8492f',
          soft: '#fde9e3',
        },
        lilac: {
          DEFAULT: '#7a5cb0',
          soft: '#efe8fb',
        },
      },
      boxShadow: {
        doodle: '4px 4px 0 0 #1f2233',
        doodleSm: '2px 2px 0 0 #1f2233',
        doodleLg: '6px 6px 0 0 #1f2233',
        doodleXl: '8px 8px 0 0 #1f2233',
      },
      borderRadius: {
        doodle: '1.25rem',
      },
      keyframes: {
        wiggle: {
          '0%,100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        floatySlow: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        sway: {
          '0%,100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        pulseSoft: {
          '0%,100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
        flutter: {
          '0%,100%': { transform: 'rotate(-4deg) translateY(-2px)' },
          '50%': { transform: 'rotate(4deg) translateY(2px)' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        twinkle: {
          '0%,100%': { opacity: '0.25', transform: 'scale(0.85)' },
          '50%': { opacity: '0.85', transform: 'scale(1.15)' },
        },
        drive: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(8px)' },
        },
      },
      animation: {
        wiggle: 'wiggle 2.5s ease-in-out infinite',
        floaty: 'floaty 4s ease-in-out infinite',
        floatySlow: 'floatySlow 6s ease-in-out infinite',
        sway: 'sway 3.5s ease-in-out infinite',
        pulseSoft: 'pulseSoft 3s ease-in-out infinite',
        flutter: 'flutter 2.2s ease-in-out infinite',
        spinSlow: 'spinSlow 24s linear infinite',
        twinkle: 'twinkle 2.5s ease-in-out infinite',
        drive: 'drive 1.6s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
};
