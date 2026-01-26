
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
    "!./node_modules/**",
    "!./.git/**"
  ],
  safelist: [
    'bg-brand-500',
    'bg-brand-600',
    'text-brand-500',
    'text-slate-900',
    'text-slate-500',
    'shadow-brand-500/25'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#10b981',
          600: '#059669'
        },
      },
      animation: {
        'subtle-float': 'subtle-float 6s ease-in-out infinite',
      },
      keyframes: {
        'subtle-float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(3deg)' },
        }
      }
    },
  },
  plugins: [],
}
