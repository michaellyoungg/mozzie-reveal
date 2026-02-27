/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'fredoka': ['Fredoka', 'sans-serif'],
      },
      colors: {
        'party-pink': '#FF6B9D',
        'party-purple': '#C06C84',
        'party-blue': '#667EEA',
      },
      keyframes: {
        slideInBounce: {
          '0%': { transform: 'translateX(400px)', opacity: '0' },
          '60%': { transform: 'translateX(-20px)', opacity: '1' },
          '100%': { transform: 'translateX(0)' },
        },
        popIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          'from': { opacity: '0', transform: 'scale(0.98)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        slideInLeft: {
          'from': { transform: 'translateX(-20px)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        slideInBounce: 'slideInBounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        popIn: 'popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        fadeIn: 'fadeIn 0.5s ease',
        slideInLeft: 'slideInLeft 0.3s ease',
      },
    },
  },
  plugins: [],
}
