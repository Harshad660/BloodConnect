/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      fontSize: {
        'xxs': '0.7rem',
      },
      colors: {
        'brand-red': '#C81E3A',      // Clinical deep brand red
        'sos-red': '#F02849',        // High urgency SOS warning red
        'trust-teal': '#0D7F6E',     // Desaturated green/teal for verified and active status
        'ink-dark': '#12161A',       // Rich charcoal body/heading text
        'clinical-bg': '#F6F8FA',    // Clean medical neutral backdrop
        'soft-border': '#EBEFF3',    // Light divider border
        blood: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
