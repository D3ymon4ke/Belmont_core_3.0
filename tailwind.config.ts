import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        belmont: {
          bg: '#08090d',
          surface: '#0d0f16',
          'surface-hover': '#131622',
          'surface-elevated': '#171a28',
          border: 'rgba(255, 255, 255, 0.07)',
          'border-strong': 'rgba(255, 255, 255, 0.14)',
          crimson: '#8b1528',
          'crimson-light': '#a81c34',
          rose: '#e11d48',
          gold: '#d4af37',
          'gold-light': '#f3e5ab',
          text: {
            primary: '#f1f5f9',
            secondary: '#94a3b8',
            muted: '#64748b',
          }
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'belmont-glow': '0 0 20px -3px rgba(139, 21, 40, 0.25)',
        'belmont-gold-glow': '0 0 20px -3px rgba(212, 175, 55, 0.25)',
        'belmont-card': '0 4px 20px 0 rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'mansion-radial': 'radial-gradient(circle at 50% 0%, rgba(139, 21, 40, 0.12) 0%, transparent 65%)',
        'mansion-card': 'linear-gradient(135deg, rgba(20, 23, 34, 0.6) 0%, rgba(13, 15, 22, 0.7) 100%)',
      }
    },
  },
  plugins: [],
}

export default config
