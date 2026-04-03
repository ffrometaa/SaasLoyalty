import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          DEFAULT: 'var(--sage)',
          light: 'var(--sage-light)',
          dark: 'var(--sage-dark)',
        },
        clay: {
          DEFAULT: 'var(--clay)',
          light: 'var(--clay-light)',
          dark: 'var(--clay-dark)',
        },
        cream: 'var(--cream)',
        gold: {
          DEFAULT: 'var(--gold)',
          light: 'var(--gold-light)',
        },
        muted: 'var(--muted)',
        border: 'var(--border)',
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          'primary-dark': 'var(--brand-primary-dark)',
          'primary-light': 'var(--brand-primary-light)',
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Jost', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};

export default config;
