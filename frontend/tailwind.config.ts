import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E53935',
          dark:    '#C62828',
          light:   '#EF5350',
          50:      '#FFEBEE',
          100:     '#FFCDD2',
        },
        graphite: {
          DEFAULT: '#1C1C1E',
          700:     '#2C2C2E',
          600:     '#3A3A3C',
          500:     '#48484A',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        card:         '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.10)',
        brand:        '0 8px 32px 0 rgb(229 57 53 / 0.18)',
      },
    },
  },
  plugins: [],
}

export default config
