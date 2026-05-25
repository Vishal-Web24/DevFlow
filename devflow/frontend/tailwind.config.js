export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontSize: {
        'xs':   ['0.8rem',  { lineHeight: '1.4' }],
        'sm':   ['0.9rem',  { lineHeight: '1.5' }],
        'base': ['1rem',    { lineHeight: '1.6' }],
        'lg':   ['1.15rem', { lineHeight: '1.6' }],
        'xl':   ['1.3rem',  { lineHeight: '1.5' }],
        '2xl':  ['1.6rem',  { lineHeight: '1.4' }],
        '3xl':  ['1.9rem',  { lineHeight: '1.3' }],
        '4xl':  ['2.3rem',  { lineHeight: '1.2' }],
      },
      colors: {
        primary: {
          50:  '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE',
          300: '#93C5FD', 400: '#60A5FA', 500: '#3B82F6',
          600: '#2563EB', 700: '#1D4ED8', 800: '#1E40AF', 900: '#1E3A8A',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
};