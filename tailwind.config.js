/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      animation: {
        'blob-float': 'blob-float 10s ease-in-out infinite alternate',
      },
      keyframes: {
        'blob-float': {
          '0%': { transform: 'translate(0px, 0px)' },
          '25%': { transform: 'translate(0px, 100px)' },
          '50%': { transform: 'translate(100px, 100px)' },
          '75%': { transform: 'translate(200px, 100px)' },
          '100%': { transform: 'translate(100px, -100px)' },
        }
      }
    }
  }
}