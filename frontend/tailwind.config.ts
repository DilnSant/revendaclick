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
          // Channel variables allow Tailwind opacity modifiers (bg-primary/10, etc.)
          // and tenant theme override in the public store via --primary / --primary-dark.
          // Default channels (229 57 53 = #E53935) are declared in globals.css :root.
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          dark:    'rgb(var(--primary-dark) / <alpha-value>)',
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
        brand:        '0 8px 32px 0 rgb(var(--primary) / 0.18)',
      },
    },
  },
  plugins: [],
}

export default config
