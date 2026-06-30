import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:       'var(--bg)',
        bg2:      'var(--bg2)',
        surface:  'var(--surface)',
        surface2: 'var(--surface2)',
        ink:      'var(--ink)',
        ink2:     'var(--ink2)',
        ink3:     'var(--ink3)',
        gold:     'var(--gold)',
        'gold-lt':'var(--gold-lt)',
        'gold-dk':'var(--gold-dk)',
        brand:    '#3D1403',
        green:    'var(--green)',
        olive:    'var(--olive)',
        'olive-lt':'var(--olive-lt)',
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
      maxWidth: {
        center: '680px',
        wide:   '880px',
      },
      boxShadow: {
        sm: '0 1px 4px rgba(42,42,34,.06)',
        md: '0 4px 18px rgba(42,42,34,.09)',
        lg: '0 16px 52px rgba(42,42,34,.11)',
      },
    },
  },
  plugins: [],
}
export default config
