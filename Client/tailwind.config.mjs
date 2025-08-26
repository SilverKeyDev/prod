/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,html}"],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        brown: {
          DEFAULT: '#8C6F5A',
          light: '#8C6F5A',
        },
        olive: {
          DEFAULT: '#A3B18A',
          light: '#97a77b',
        },
        beige: {
          DEFAULT: '#D2C3A1',
          light: '#D2C3A1',
        },
        gold: {
          DEFAULT: '#D2C3A1',
          light: '#D2C3A1',
        },
        'off-white': '#FAF9F6',
        navy: '#1A1F36',
        'dark-green': '#405541',
        'gray-brown': '#B8B3AB',
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        // Mobile-optimized sizes
        'mobile-xs': ['0.625rem', { lineHeight: '0.875rem' }],
        'mobile-sm': ['0.75rem', { lineHeight: '1rem' }],
        'mobile-base': ['0.875rem', { lineHeight: '1.25rem' }],
        'mobile-lg': ['1rem', { lineHeight: '1.5rem' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'touch-feedback': 'touchFeedback 0.1s ease-out',
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
        touchFeedback: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        // Touch-friendly spacing
        'touch-sm': '8px',
        'touch-md': '12px',
        'touch-lg': '16px',
        'touch-xl': '24px',
      },
      minHeight: {
        'touch': '44px',
        'touch-lg': '48px',
        'button': '44px',
        'input': '44px',
      },
      minWidth: {
        'touch': '44px',
        'touch-lg': '48px',
        'button': '44px',
      },
      maxWidth: {
        'mobile': '100vw',
        'touch-target': '44px',
      },
      aspectRatio: {
        'mobile-card': '16 / 9',
        'mobile-hero': '4 / 3',
      },
      zIndex: {
        'modal': '50',
        'overlay': '40',
        'dropdown': '30',
        'header': '20',
        'sidebar': '10',
      },
    },
  },
  plugins: [],
};