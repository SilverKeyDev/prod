/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,html}"],
  theme: {
    extend: {
      colors: {
        brown: {
          DEFAULT: '#4A3228',
          light: '#6B4D40',
        },
        olive: {
          DEFAULT: '#A3B18A',
          light: '#B7C5A3',
        },
        beige: {
          DEFAULT: '#D8CAB8',
          light: '#E5DCC9',
        },
        gold: {
          DEFAULT: '#C0A161',
          light: '#D4B572',
        },
        'off-white': '#FAF9F6',
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};